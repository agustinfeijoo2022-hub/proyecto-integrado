import { Router } from "express"

import { ESTADOS_PRESUPUESTO, TIPOS_SERVICIO } from "../models/Presupuesto.js"

// Misma regla de IVA que las compras del MVP: 19 %, importes en pesos enteros.
export const IVA = 0.19

export function calcularTotales(items) {
  const neto = Math.round(
    items.reduce((suma, item) => suma + item.cantidad * item.precioUnitario, 0),
  )

  const iva = Math.round(neto * IVA)

  return { neto, iva, total: neto + iva }
}

// Estados a los que se puede pasar y qué roles pueden hacerlo.
//   Borrador -> Enviado               Gerencia o Finanzas
//   Enviado  -> Aprobado / Rechazado  solo Gerencia
const TRANSICIONES = {
  Enviado: { desde: "Borrador", roles: ["Gerencia", "Finanzas"] },
  Aprobado: { desde: "Enviado", roles: ["Gerencia"] },
  Rechazado: { desde: "Enviado", roles: ["Gerencia"] },
}

const MAX_ITEMS = 50

const texto = (value, max = 160) =>
  typeof value === "string" &&
  value.trim().length > 0 &&
  value.trim().length <= max

// AAAA-MM-DD en hora de Chile: de noche, la fecha UTC ya sería la del día siguiente.
const fecha = (valor) =>
  new Date(valor).toLocaleDateString("en-CA", { timeZone: "America/Santiago" })

export const vista = (p) => ({
  id: String(p._id),
  folio: p.folio,
  clienteId: p.clienteId,
  fecha: fecha(p.createdAt),
  estado: p.estado,
  tipo: p.tipo,
  items: p.items.map((item) => ({
    id: String(item._id),
    descripcion: item.descripcion,
    cantidad: item.cantidad,
    precioUnitario: item.precioUnitario,
  })),
  neto: p.neto,
  iva: p.iva,
  total: p.total,
})

// Devuelve { items } con los ítems normalizados o { error } con el motivo.
function validarItems(items) {
  if (!Array.isArray(items) || items.length === 0)
    return { error: "Agrega al menos un ítem al presupuesto." }

  if (items.length > MAX_ITEMS)
    return { error: `Un presupuesto admite hasta ${MAX_ITEMS} ítems.` }

  const limpios = []

  for (const [i, item] of items.entries()) {
    const n = i + 1

    if (!item || !texto(item.descripcion))
      return { error: `Ítem ${n}: ingresa una descripción (máximo 160 caracteres).` }

    if (
      typeof item.cantidad !== "number" ||
      !Number.isFinite(item.cantidad) ||
      item.cantidad <= 0 ||
      item.cantidad > 1e6
    )
      return { error: `Ítem ${n}: la cantidad debe ser mayor que 0.` }

    if (
      !Number.isSafeInteger(item.precioUnitario) ||
      item.precioUnitario <= 0 ||
      item.precioUnitario > 1e10
    )
      return { error: `Ítem ${n}: el valor unitario debe ser un monto entero en pesos, mayor que 0.` }

    limpios.push({
      descripcion: item.descripcion.trim(),
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario,
    })
  }

  return { items: limpios }
}

export function crearRouterPresupuestos(Presupuesto, permitir) {
  const router = Router()

  router.get("/", permitir("Gerencia", "Finanzas"), async (_req, res) => {
    const presupuestos = await Presupuesto.find()
      .sort({ createdAt: -1 })
      .limit(500)
      .lean()

    res.json(presupuestos.map(vista))
  })

  router.post("/", permitir("Gerencia", "Finanzas"), async (req, res) => {
    const { clienteId, tipo, estado = "Borrador", items } = req.body || {}

    if (!texto(clienteId, 40))
      return res.status(400).json({ error: "Selecciona un cliente." })

    if (!TIPOS_SERVICIO.includes(tipo))
      return res.status(400).json({ error: "Selecciona un tipo de servicio válido." })

    // Un presupuesto nace como borrador o ya enviado; aprobar y rechazar son acciones aparte.
    if (!["Borrador", "Enviado"].includes(estado))
      return res.status(400).json({ error: "Un presupuesto nuevo solo puede crearse como Borrador o Enviado." })

    const validacion = validarItems(items)

    if (validacion.error) return res.status(400).json({ error: validacion.error })

    const totales = calcularTotales(validacion.items)

    if (totales.total > 1e12)
      return res.status(400).json({ error: "El total del presupuesto supera el límite permitido." })

    const presupuesto = await Presupuesto.create({
      folio: await Presupuesto.siguienteFolio(),
      clienteId: clienteId.trim(),
      tipo,
      estado,
      items: validacion.items,
      ...totales,
      creadoPor: req.usuario.id,
    })

    res
      .status(201)
      .json({ mensaje: "Presupuesto creado.", presupuesto: vista(presupuesto) })
  })

  router.patch("/:id/estado", permitir("Gerencia", "Finanzas"), async (req, res) => {
    const destino = req.body?.estado

    if (!ESTADOS_PRESUPUESTO.includes(destino) || !TRANSICIONES[destino])
      return res.status(400).json({ error: "Estado de destino no válido." })

    const regla = TRANSICIONES[destino]

    if (!regla.roles.includes(req.usuario.rol))
      return res.status(403).json({ error: "No tienes permiso para realizar esta operación." })

    // El filtro por estado de origen hace el cambio atómico: dos aprobaciones simultáneas no se pisan.
    const actualizado = await Presupuesto.findOneAndUpdate(
      { _id: req.params.id, estado: regla.desde },
      { $set: { estado: destino } },
      { new: true },
    ).lean()

    if (!actualizado) {
      if (!(await Presupuesto.exists({ _id: req.params.id })))
        return res.status(404).json({ error: "El presupuesto no existe." })

      return res.status(409).json({
        error: `Solo un presupuesto en estado ${regla.desde} puede pasar a ${destino}.`,
      })
    }

    res.json({ mensaje: `Presupuesto ${destino.toLowerCase()}.`, presupuesto: vista(actualizado) })
  })

  return router
}
