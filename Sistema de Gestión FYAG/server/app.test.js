import test from "node:test"

import assert from "node:assert/strict"

import { createApp } from "./app.js"
import { obrasController } from "./controllers/obrasController.js"

import { IncomingMessage, ServerResponse } from "node:http"

import { Socket } from "node:net"

const origin = "http://localhost:8443"

const env = {
  FRONTEND_ORIGIN: origin,
  FYAG_GERENCIA_PASSWORD: "gerencia-test-123",
  FYAG_FINANZAS_PASSWORD: "finanzas-test-123",
  FYAG_SUPERVISOR_PASSWORD: "supervisor-test-123",
  FYAG_TECNICO_PASSWORD: "tecnico-test-123",
}

const articulo = {
  _id: "mongo-id",
  codigo: "A1",
  nombre: "Filtro",
  categoria: "General",
  stock: 10,
  stockCritico: 0,
  unidad: "Unidad",
}

let update

const model = {
  aggregate: async () => [{ id: "compra-1", codigoArticulo: "A1", proveedor: "P", cantidad: 1, total: 1190 }],
  find: () => ({
    select: () => ({ sort: () => ({ lean: async () => [articulo] }) }),
  }),

  create: async (data) => {
    if (data.codigo === "DUP")
      throw Object.assign(new Error("duplicate"), { code: 11000 })
    return { ...articulo, ...data }
  },

  findOneAndUpdate: async (query, changes) => {
    update = { query, changes }
    return query.codigo === "NO"
      ? null
      : { ...articulo, stock: articulo.stock + (changes.$inc?.stock ?? 0) }
  },
}

test("API: sesión, roles, validación y escritura de inventario", async (t) => {
  const app = createApp(model, env)

  t.after(() => app.locals.dispose())

  const req = (path, method = "GET", body, cookie, requestOrigin = origin) =>
    new Promise((resolve, reject) => {
      const socket = new Socket()

      Object.defineProperty(socket, "remoteAddress", { value: "127.0.0.1" })

      const request = new IncomingMessage(socket)

      request.method = method
      request.url = "/api" + path

      request.headers = { origin: requestOrigin, ...(cookie ? { cookie } : {}) }

      // Inyección de cuerpo ya parseado: prueba middleware y handlers sin sockets externos.

      request.body = body

      const response = new ServerResponse(request)

      let chunks = []

      response.write = (chunk) => {
        if (chunk) chunks.push(Buffer.from(chunk))
        return true
      }

      response.end = (chunk) => {
        if (chunk) chunks.push(Buffer.from(chunk))

        const headers = new Headers()

        for (const [key, value] of Object.entries(response.getHeaders()))
          headers.set(
            key,
            Array.isArray(value) ? value.join(";") : String(value),
          )

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
    assert.match(res.headers.get("set-cookie"), /HttpOnly/i)
    assert.match(res.headers.get("set-cookie"), /SameSite=Lax/i)
    return res.headers.get("set-cookie").split(";")[0]
  }

  await t.test("sin sesión: 401; origen inválido: 403", async () => {
    assert.equal((await req("/articulos")).status, 401)

    assert.equal(
      (
        await req(
          "/auth/login",
          "POST",
          { email: "gerencia@fyag.cl", password: env.FYAG_GERENCIA_PASSWORD },
          undefined,
          "http://evil.test",
        )
      ).status,
      403,
    )

    assert.equal(
      (
        await req("/auth/login", "POST", {
          email: "gerencia@fyag.cl",
          password: "wrong",
        })
      ).status,
      401,
    )
  })

  const tecnico = await login("tecnico@fyag.cl", env.FYAG_TECNICO_PASSWORD)

  await t.test(
    "Técnico: identidad real y denegación de endpoints administrativos",
    async () => {
      const me = await req("/auth/me", "GET", undefined, tecnico)
      assert.equal((await me.json()).rol, "Técnico")

      assert.equal(
        (await req("/articulos", "GET", undefined, tecnico)).status,
        403,
      )

      assert.equal(
        (await req("/articulos", "POST", { codigo: "A" }, tecnico)).status,
        403,
      )

      assert.equal(
        (
          await req(
            "/compras",
            "POST",
            { codigoArticulo: "A1", cantidad: 1, rol: "Gerencia" },
            tecnico,
          )
        ).status,
        403,
      )
    },
  )

  const gerente = await login("gerencia@fyag.cl", env.FYAG_GERENCIA_PASSWORD)

  const finanzas = await login("finanzas@fyag.cl", env.FYAG_FINANZAS_PASSWORD)

  const supervisor = await login(
    "bodega@fyag.cl",
    env.FYAG_SUPERVISOR_PASSWORD,
  )

  await t.test("matriz de roles: lectura, creación, compras", async () => {
    for (const cookie of [gerente, finanzas, supervisor])
      assert.equal(
        (await req("/articulos", "GET", undefined, cookie)).status,
        200,
      )

    assert.equal(
      (
        await req(
          "/articulos",
          "POST",
          { codigo: "N", nombre: "Nuevo", stock: 0, stockCritico: 0 },
          finanzas,
        )
      ).status,
      403,
    )

    assert.equal(
      (
        await req(
          "/compras",
          "POST",
          { codigoArticulo: "A1", cantidad: 1, proveedor: "P", monto: 1000 },
          supervisor,
        )
      ).status,
      403,
    )

    for (const cookie of [supervisor]) {
      const res = await req(
        "/articulos",
        "POST",
        { codigo: "N", nombre: "Nuevo", stock: 0, stockCritico: 0 },
        cookie,
      )
      assert.equal(res.status, 201)
      assert.equal((await res.json()).articulo.stockCritico, 0)
    }
  })

  await t.test("datos inválidos y códigos duplicados", async () => {
    for (const stock of [-1, "5", null])
      assert.equal(
        (
          await req(
            "/articulos",
            "POST",
            { codigo: "N", nombre: "Nuevo", stock },
            supervisor,
          )
        ).status,
        400,
      )

    assert.equal(
      (
        await req(
          "/articulos",
          "POST",
          { codigo: "DUP", nombre: "Nuevo" },
          supervisor,
        )
      ).status,
      409,
    )

    for (const cantidad of [0, -1, "2"])
      assert.equal(
        (
          await req(
            "/compras",
            "POST",
            { codigoArticulo: "A1", cantidad, proveedor: "P", monto: 1000 },
            finanzas,
          )
        ).status,
        400,
      )

    assert.equal(
      (
        await req(
          "/compras",
          "POST",
          {
            codigoArticulo: "A1",
            cantidad: 1,
            proveedor: "P",
            monto: 1000,
            descuento: 101,
          },
          finanzas,
        )
      ).status,
      400,
    )
  })

  await t.test(
    "compra: cálculo en servidor y stock pendiente de recepción",
    async () => {
      const res = await req(
        "/compras",
        "POST",
        {
          codigoArticulo: "A1",
          cantidad: 2.5,
          proveedor: "P",
          monto: 100000,
          descuento: 10,
          total: 1,
        },
        finanzas,
      )

      assert.equal(res.status, 201)
      const data = await res.json()
      assert.equal(data.total, 107100)
      assert.equal(data.articulo.stock, 10)

      assert.equal(update.changes.$inc, undefined)
      assert.equal(update.changes.$push.compras.recibida, false)
      assert.equal(update.changes.$push.compras.total, 107100)
      assert.equal(update.changes.$push.compras.usuarioId, "u2")

      assert.equal(
        (
          await req(
            "/compras",
            "POST",
            { codigoArticulo: "NO", cantidad: 1, proveedor: "P", monto: 1000 },
            finanzas,
          )
        ).status,
        409,
      )
    },
  )

  await t.test("Gerencia conserva lectura y no puede crear ni comprar", async () => {
    assert.equal((await req("/articulos", "GET", undefined, gerente)).status, 200);
    assert.equal((await req("/compras", "GET", undefined, gerente)).status, 200);
    assert.equal((await req("/articulos", "POST", {codigo: "G", nombre: "Intento gerencia", stock: 1, rol: "Supervisor"}, gerente)).status, 403);
    assert.equal((await req("/compras", "POST", {codigoArticulo: "A1", cantidad: 1, proveedor: "P", monto: 1000, rol: "Finanzas"}, gerente)).status, 403);
  });

  await t.test("historial de compras restringido y respuesta disponible", async () => {
    assert.equal((await req("/compras", "GET", undefined, tecnico)).status, 403);
    for (const cookie of [gerente, finanzas, supervisor]) {
      const res = await req("/compras", "GET", undefined, cookie);
      assert.equal(res.status, 200);
      assert.equal((await res.json())[0].id, "compra-1");
    }
  });

  await t.test("reporte financiero y denegación de escritura por todos los verbos", async () => {
    for (const cookie of [gerente, finanzas, supervisor]) assert.equal((await req("/reportes/finanzas", "GET", undefined, cookie)).status, 200);
    assert.equal((await req("/reportes/finanzas", "GET", undefined, tecnico)).status, 403);
    for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
      for (const path of ["/articulos", "/articulos/123", "/compras", "/compras/123"]) {
        assert.equal((await req(path, method, { rol: "Supervisor" }, gerente)).status, 403);
        assert.equal((await req(path, method, { rol: "Finanzas" }, tecnico)).status, 403);
      }
    }
  });

  await t.test("logout invalida cookie; sesión falsa rechazada", async () => {
    assert.equal(
      (await req("/auth/logout", "POST", undefined, tecnico)).status,
      204,
    )

    assert.equal((await req("/auth/me", "GET", undefined, tecnico)).status, 401)

    assert.equal(
      (await req("/auth/me", "GET", undefined, "fyag_session=Gerencia")).status,
      401,
    )
  })
})

test("workflow de obras valida transiciones y registra el avance final", async () => {
  const casos = [
    ["En proceso", "Suspendida", "t1", true, 200],
    ["Suspendida", "En proceso", "t1", true, 200],
    ["Suspendida", "En proceso", "t1", false, 409],
    ["Suspendida", "Cancelada", "t1", true, 200],
    ["Suspendida", "Finalizada", "t1", true, 409],
    ["En proceso", "Cierre comercial", "t1", true, 409],
    ["En proceso", "Finalizada", null, true, 409],
    ["En proceso", "Finalizada", "t1", true, 200],
    ["Finalizada", "Cierre comercial", "t1", true, 200],
    ["Finalizada", "Cancelada", "t1", true, 409],
    ["Cancelada", "Finalizada", "t1", true, 409],
    ["Cierre comercial", "En proceso", "t1", true, 409],
    ["Cierre comercial", "Cierre comercial", "t1", true, 200],
  ];
  for (const [origen, destino, tecnico, aprobado, esperado] of casos) {
    const obra = { id: 1, estado: origen, tecnico_id: tecnico, avance: 30, presupuesto_id: 1 };
    const operaciones = [];
    const db = {
      async query(sql, params) {
        operaciones.push(sql);
        if (sql.includes("FOR UPDATE")) return { rows: [obra] };
        if (sql.includes("FROM pagos") || sql.includes("FROM facturas")) return { rowCount: 0 };
        if (sql.includes("FOR SHARE")) return { rowCount: aprobado ? 1 : 0 };
        if (sql.startsWith("UPDATE")) {
          const [avance, estado, , , historial] = params;
          return { rows: [{ ...obra, estado, avance: avance ?? obra.avance, historial: JSON.parse(historial) }] };
        }
      },
      release() {},
    };
    let codigo = 200;
    let resultado;
    const respuesta = {
      status(n) { codigo = n; return this; },
      json(datos) { resultado = datos; },
    };
    const controlador = obrasController({ connect: async () => db }, {}, []);
    await controlador.actualizar({ params: { id: "1" }, body: { estado: destino } }, respuesta, error => { throw error; });
    assert.equal(codigo, esperado, `${origen} → ${destino}`);
    assert.equal(operaciones.some(sql => sql.startsWith("UPDATE")), esperado === 200);
    assert.equal(operaciones.at(-1), esperado === 200 ? "COMMIT" : "ROLLBACK");
    if (esperado === 200) {
      assert.equal(resultado.estado, destino);
      if (destino === "Finalizada") assert.equal(resultado.avance, 100);
      if (destino === "Cancelada" || destino === "Cierre comercial") assert.deepEqual(resultado.transiciones_disponibles, []);
    }
  }
});
