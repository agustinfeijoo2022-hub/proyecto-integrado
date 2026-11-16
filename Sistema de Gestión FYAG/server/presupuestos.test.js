import test from "node:test"

import assert from "node:assert/strict"

import { IncomingMessage, ServerResponse } from "node:http"

import { Socket } from "node:net"

import { createApp } from "./app.js"

import PresupuestoModel from "./models/Presupuesto.js"

import { calcularTotales } from "./routes/presupuestos.js"

const origin = "http://localhost:8443"

const env = {
  FRONTEND_ORIGIN: origin,
  FYAG_GERENCIA_PASSWORD: "gerencia-test-123",
  FYAG_FINANZAS_PASSWORD: "finanzas-test-123",
  FYAG_SUPERVISOR_PASSWORD: "supervisor-test-123",
  FYAG_TECNICO_PASSWORD: "tecnico-test-123",
}

// Modelo simulado en memoria: imita solo lo que usa el router (sin MongoDB).
function crearModeloSimulado() {
  const filas = []

  let seq = 0

  return {
    filas,

    siguienteFolio: async () => `PRE-${2500 + ++seq}`,

    find: () => ({
      sort: () => ({ limit: () => ({ lean: async () => [...filas].reverse() }) }),
    }),

    create: async (data) => {
      const doc = {
        ...data,
        _id: `id${filas.length + 1}`,
        createdAt: new Date("2026-11-12T15:00:00Z"),
        items: data.items.map((item, i) => ({ ...item, _id: `it${i + 1}` })),
      }

      filas.push(doc)

      return doc
    },

    findOneAndUpdate: (filtro, cambios) => ({
      lean: async () => {
        const fila = filas.find(
          (f) => f._id === filtro._id && f.estado === filtro.estado,
        )

        if (!fila) return null

        fila.estado = cambios.$set.estado

        return fila
      },
    }),

    exists: async (filtro) =>
      filas.some((f) => f._id === filtro._id) ? { _id: filtro._id } : null,
  }
}

const itemValido = { descripcion: "Cámara de frío", cantidad: 3, precioUnitario: 1450000 }

const cuerpoValido = { clienteId: "c1", tipo: "Proyecto", items: [itemValido] }

test("API de presupuestos: permisos, validación, totales, folios y estados", async (t) => {
  const modelo = crearModeloSimulado()

  const app = createApp({}, env, modelo)

  t.after(() => app.locals.dispose())

  const req = (path, method = "GET", body, cookie) =>
    new Promise((resolve, reject) => {
      const socket = new Socket()

      Object.defineProperty(socket, "remoteAddress", { value: "127.0.0.1" })

      const request = new IncomingMessage(socket)

      request.method = method
      request.url = "/api" + path
      request.headers = { origin, ...(cookie ? { cookie } : {}) }
      request.body = body

      const response = new ServerResponse(request)

      const chunks = []

      response.write = (chunk) => {
        if (chunk) chunks.push(Buffer.from(chunk))
        return true
      }

      response.end = (chunk) => {
        if (chunk) chunks.push(Buffer.from(chunk))

        const headers = new Headers()

        for (const [key, value] of Object.entries(response.getHeaders()))
          headers.set(key, Array.isArray(value) ? value.join(";") : String(value))

        resolve(
          new Response(
            response.statusCode === 204 ? null : Buffer.concat(chunks),
            { status: response.statusCode, headers },
          ),
        )

        return response
      }

      app.handle(request, response, reject)
    })

  const login = async (email, password) => {
    const res = await req("/auth/login", "POST", { email, password })

    assert.equal(res.status, 200)

    return res.headers.get("set-cookie").split(";")[0]
  }

  const gerencia = await login("gerencia@fyag.cl", "gerencia-test-123")

  const finanzas = await login("finanzas@fyag.cl", "finanzas-test-123")

  const supervisor = await login("supervisor@fyag.cl", "supervisor-test-123")

  const tecnico = await login("tecnico@fyag.cl", "tecnico-test-123")

  await t.test("sin sesión: 401", async () => {
    assert.equal((await req("/presupuestos")).status, 401)
    assert.equal((await req("/presupuestos", "POST", cuerpoValido)).status, 401)
  })

  await t.test("Supervisor y Técnico no pueden leer, crear ni cambiar estados", async () => {
    for (const cookie of [supervisor, tecnico]) {
      assert.equal((await req("/presupuestos", "GET", undefined, cookie)).status, 403)
      assert.equal((await req("/presupuestos", "POST", cuerpoValido, cookie)).status, 403)
      assert.equal(
        (await req("/presupuestos/id1/estado", "PATCH", { estado: "Enviado" }, cookie)).status,
        403,
      )
    }

    assert.equal(modelo.filas.length, 0)
  })

  await t.test("el servidor calcula neto, IVA y total e ignora los que envía el cliente", async () => {
    const res = await req(
      "/presupuestos",
      "POST",
      { ...cuerpoValido, total: 1, neto: 1, iva: 1, folio: "HACK-1", estado: "Borrador" },
      finanzas,
    )

    assert.equal(res.status, 201)

    const { presupuesto } = await res.json()

    assert.equal(presupuesto.folio, "PRE-2501")
    assert.equal(presupuesto.estado, "Borrador")
    assert.equal(presupuesto.neto, 4350000)
    assert.equal(presupuesto.iva, 826500)
    assert.equal(presupuesto.total, 5176500)
    assert.equal(presupuesto.fecha, "2026-11-12")
    assert.equal(presupuesto.items[0].descripcion, "Cámara de frío")
    assert.equal(modelo.filas[0].creadoPor, "u2")
  })

  await t.test("los folios son correlativos y Gerencia también puede crear", async () => {
    const res = await req("/presupuestos", "POST", { ...cuerpoValido, estado: "Enviado" }, gerencia)

    assert.equal(res.status, 201)

    const { presupuesto } = await res.json()

    assert.equal(presupuesto.folio, "PRE-2502")
    assert.equal(presupuesto.estado, "Enviado")
  })

  await t.test("rechaza datos inválidos con 400 y no guarda nada", async () => {
    const antes = modelo.filas.length

    const invalidos = [
      { ...cuerpoValido, clienteId: "" },
      { ...cuerpoValido, clienteId: undefined },
      { ...cuerpoValido, tipo: "Otro" },
      { ...cuerpoValido, estado: "Aprobado" },
      { ...cuerpoValido, estado: "Rechazado" },
      { ...cuerpoValido, items: [] },
      { ...cuerpoValido, items: "x" },
      { ...cuerpoValido, items: [{ ...itemValido, descripcion: "  " }] },
      { ...cuerpoValido, items: [{ ...itemValido, descripcion: "x".repeat(161) }] },
      { ...cuerpoValido, items: [{ ...itemValido, cantidad: 0 }] },
      { ...cuerpoValido, items: [{ ...itemValido, cantidad: "3" }] },
      { ...cuerpoValido, items: [{ ...itemValido, cantidad: -1 }] },
      { ...cuerpoValido, items: [{ ...itemValido, precioUnitario: 0 }] },
      { ...cuerpoValido, items: [{ ...itemValido, precioUnitario: 99.5 }] },
      { ...cuerpoValido, items: [{ ...itemValido, precioUnitario: -5 }] },
      { ...cuerpoValido, items: [{ ...itemValido, precioUnitario: "1000" }] },
      { ...cuerpoValido, items: [null] },
      { ...cuerpoValido, items: Array(51).fill(itemValido) },
      { ...cuerpoValido, items: [{ ...itemValido, cantidad: 1e6, precioUnitario: 1e10 }] },
    ]

    for (const cuerpo of invalidos) {
      const res = await req("/presupuestos", "POST", cuerpo, finanzas)

      assert.equal(res.status, 400, JSON.stringify(cuerpo).slice(0, 120))
      assert.ok((await res.json()).error)
    }

    assert.equal((await req("/presupuestos", "POST", undefined, finanzas)).status, 400)
    assert.equal(modelo.filas.length, antes)
  })

  await t.test("Gerencia y Finanzas listan, del más reciente al más antiguo", async () => {
    for (const cookie of [gerencia, finanzas]) {
      const res = await req("/presupuestos", "GET", undefined, cookie)

      assert.equal(res.status, 200)

      const lista = await res.json()

      assert.deepEqual(lista.map((p) => p.folio), ["PRE-2502", "PRE-2501"])
      assert.ok(lista.every((p) => typeof p.id === "string" && !("creadoPor" in p)))
    }
  })

  await t.test("cambios de estado: reglas de rol y de origen", async () => {
    const cambiar = (id, estado, cookie) =>
      req(`/presupuestos/${id}/estado`, "PATCH", { estado }, cookie)

    // id1 = Borrador, id2 = Enviado
    assert.equal((await cambiar("id1", "Aprobado", gerencia)).status, 409, "no se aprueba un borrador")
    assert.equal((await cambiar("id2", "Aprobado", finanzas)).status, 403, "Finanzas no aprueba")
    assert.equal((await cambiar("id2", "Rechazado", finanzas)).status, 403, "Finanzas no rechaza")
    assert.equal((await cambiar("id1", "Borrador", finanzas)).status, 400, "destino no permitido")
    assert.equal((await cambiar("id1", "Cualquiera", finanzas)).status, 400)
    assert.equal((await cambiar("noexiste", "Enviado", finanzas)).status, 404)

    const enviado = await cambiar("id1", "Enviado", finanzas)

    assert.equal(enviado.status, 200)
    assert.equal((await enviado.json()).presupuesto.estado, "Enviado")

    assert.equal((await cambiar("id1", "Enviado", finanzas)).status, 409, "no se reenvía")

    const aprobado = await cambiar("id2", "Aprobado", gerencia)

    assert.equal(aprobado.status, 200)
    assert.equal((await aprobado.json()).presupuesto.estado, "Aprobado")

    assert.equal((await cambiar("id2", "Rechazado", gerencia)).status, 409, "un aprobado no se rechaza")

    assert.equal((await cambiar("id1", "Rechazado", gerencia)).status, 200)
  })

  await t.test("origen distinto al del frontend: 403 en escrituras", async () => {
    const res = await new Promise((resolve, reject) => {
      const socket = new Socket()

      Object.defineProperty(socket, "remoteAddress", { value: "127.0.0.1" })

      const request = new IncomingMessage(socket)

      request.method = "POST"
      request.url = "/api/presupuestos"
      request.headers = { origin: "http://sitio-malo.test", cookie: finanzas }
      request.body = cuerpoValido

      const response = new ServerResponse(request)

      response.end = () => {
        resolve(response.statusCode)
        return response
      }

      app.handle(request, response, reject)
    })

    assert.equal(res, 403)
  })
})

test("calcularTotales: pesos enteros, IVA 19 % y cantidades fraccionarias", () => {
  assert.deepEqual(calcularTotales([{ cantidad: 3, precioUnitario: 1450000 }]), {
    neto: 4350000,
    iva: 826500,
    total: 5176500,
  })

  assert.deepEqual(
    calcularTotales([
      { cantidad: 2, precioUnitario: 1000 },
      { cantidad: 1.5, precioUnitario: 3333 },
    ]),
    { neto: 7000, iva: 1330, total: 8330 },
  )
})

test("modelo Presupuesto: el esquema exige ítems, tipo y estado válidos", () => {
  const base = {
    folio: "PRE-2501",
    clienteId: "c1",
    tipo: "Proyecto",
    estado: "Borrador",
    items: [{ descripcion: "Servicio", cantidad: 1, precioUnitario: 1000 }],
    neto: 1000,
    iva: 190,
    total: 1190,
    creadoPor: "u2",
  }

  assert.equal(new PresupuestoModel(base).validateSync(), undefined)

  for (const malo of [
    { ...base, items: [] },
    { ...base, tipo: "Otro" },
    { ...base, estado: "Archivado" },
    { ...base, total: -1 },
    { ...base, clienteId: undefined },
    { ...base, creadoPor: undefined },
  ])
    assert.ok(new PresupuestoModel(malo).validateSync(), JSON.stringify(malo).slice(0, 80))
})
