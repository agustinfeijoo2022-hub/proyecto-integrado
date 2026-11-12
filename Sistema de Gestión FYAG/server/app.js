process.env.FYAG_GERENCIA_PASSWORD = 'gerencia12345';
process.env.FYAG_FINANZAS_PASSWORD = 'finanzas12345';
process.env.FYAG_SUPERVISOR_PASSWORD = 'supervisor12345';
process.env.FYAG_TECNICO_PASSWORD = 'tecnico12345';

import express from "express"

import cors from "cors"

import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto"

const SESSION_MS = 8 * 60 * 60 * 1000

const WINDOW_MS = 15 * 60 * 1000

const cookieName = "fyag_session"

const perfiles = [
  {
    key: "GERENCIA",
    id: "u1",
    nombre: "Gerencia FYAG",
    email: "gerencia@fyag.cl",
    rol: "Gerencia",
  },

  {
    key: "FINANZAS",
    id: "u2",
    nombre: "Finanzas FYAG",
    email: "finanzas@fyag.cl",
    rol: "Finanzas",
  },

  {
    key: "SUPERVISOR",
    id: "u3",
    nombre: "Supervisor FYAG",
    email: "supervisor@fyag.cl",
    rol: "Supervisor",
  },

  {
    key: "TECNICO",
    id: "u4",
    nombre: "Técnico FYAG",
    email: "tecnico@fyag.cl",
    rol: "Técnico",
    tecnicoId: "t1",
  },
]

export function createApp(Articulo, env = process.env) {
  const app = express()

  app.disable("x-powered-by")

  const origin = env.FRONTEND_ORIGIN || "http://localhost:8443"

  const secure = env.COOKIE_SECURE === "true"

  const sesiones = new Map()

  const intentos = new Map()

  const usuarios = perfiles.flatMap(({ key, ...user }) => {
    const password = env[`FYAG_${key}_PASSWORD`]

    if (!password) return []

    if (password.length < 12 || password.length > 256)
      throw new Error(`FYAG_${key}_PASSWORD debe tener entre 12 y 256 caracteres.`)

    const salt = randomBytes(16).toString("hex")

    return [{ user, salt, hash: scryptSync(password, salt, 64) }]
  })

  if (!usuarios.length)
    throw new Error(
      "Configura al menos una contraseña FYAG_*_PASSWORD en .env.",
    )

  const dummySalt = randomBytes(16).toString("hex")

  const dummyHash = scryptSync(randomBytes(32), dummySalt, 64)

  const cookieOptions = {
    httpOnly: true,
    sameSite: "strict",
    secure,
    path: "/",
  }

  app.use(cors({ origin, credentials: true }))

  app.use((req, res, next) => {
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      req.get("origin") !== origin
    )
      return res.status(403).json({ error: "Origen no permitido." })

    next()
  })

  app.use(express.json({ limit: "32kb" }))

  function token(req) {
    return (req.headers.cookie || "")
      .split(";")
      .map((p) => p.trim())
      .find((p) => p.startsWith(`${cookieName}=`))
      ?.slice(cookieName.length + 1)
  }

  function autenticar(req, res, next) {
    const id = token(req),
      sesion = sesiones.get(id)

    if (!sesion || sesion.expira <= Date.now()) {
      if (id) sesiones.delete(id)

      res.clearCookie(cookieName, cookieOptions)

      return res
        .status(401)
        .json({ error: "Tu sesión no está activa. Vuelve a ingresar." })
    }

    req.usuario = sesion.usuario

    next()
  }

  const permitir =
    (...roles) =>
    (req, res, next) =>
      roles.includes(req.usuario.rol)
        ? next()
        : res
            .status(403)
            .json({ error: "No tienes permiso para realizar esta operación." })

  const limpiar = setInterval(() => {
    const ahora = Date.now()

    for (const [key, s] of sesiones) if (s.expira <= ahora) sesiones.delete(key)

    for (const [key, s] of intentos) if (s.hasta <= ahora) intentos.delete(key)
  }, 60000)

  limpiar.unref()

  app.locals.dispose = () => {
    clearInterval(limpiar)
    sesiones.clear()
    intentos.clear()
  }

  app.get("/api/status", (_req, res) =>
    res.json({ mensaje: "API FYAG disponible" }),
  )

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body || {}

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      email.length > 254 ||
      password.length > 256
    )
      return res.status(400).json({ error: "Credenciales inválidas." })

    const ip = req.ip

    let limite = intentos.get(ip)

    if (!limite || limite.hasta <= Date.now()) {
      limite = { cantidad: 0, hasta: Date.now() + WINDOW_MS }
      intentos.set(ip, limite)
    }

    if (limite.cantidad >= 10)
      return res
        .status(429)
        .json({ error: "Demasiados intentos. Inténtalo en 15 minutos." })

    limite.cantidad++

    const found = usuarios.find(
      (u) => u.user.email === email.trim().toLowerCase(),
    )

    const hash = scryptSync(password, found?.salt || dummySalt, 64)

    if (!timingSafeEqual(hash, found?.hash || dummyHash) || !found)
      return res.status(401).json({ error: "Correo o contraseña incorrectos." })

    intentos.delete(ip)

    const previo = token(req)
    if (previo) sesiones.delete(previo)

    const id = randomBytes(32).toString("hex")

    sesiones.set(id, { usuario: found.user, expira: Date.now() + SESSION_MS })

    res.cookie(cookieName, id, { ...cookieOptions, maxAge: SESSION_MS })

    res.set("Cache-Control", "no-store").json(found.user)
  })

  app.get("/api/auth/me", autenticar, (req, res) =>
    res.set("Cache-Control", "no-store").json(req.usuario),
  )

  app.post("/api/auth/logout", (req, res) => {
    const id = token(req)
    if (id) sesiones.delete(id)

    res.clearCookie(cookieName, cookieOptions).status(204).end()
  })

  app.use("/api", autenticar, (_req, res, next) => {
    res.set("Cache-Control", "no-store")
    next()
  })

  const vista = (a) => ({
    _id: String(a._id),
    codigo: a.codigo,
    nombre: a.nombre,
    categoria: a.categoria ?? "General",
    stock: a.stock,
    stockCritico: a.stockCritico ?? 5,
    unidad: a.unidad ?? "Unidad",
  })

  const texto = (value) =>
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= 160

  const numero = (value) =>
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 1e12

  app.get(
    "/api/articulos",
    permitir("Gerencia", "Finanzas", "Supervisor"),
    async (_req, res) => {
      const articulos = await Articulo.find()
        .select("-compras")
        .sort({ nombre: 1 })
        .lean()

      res.json(articulos.map(vista))
    },
  )

  app.post(
    "/api/articulos",
    permitir("Supervisor"),
    async (req, res) => {
      const {
        codigo,
        nombre,
        categoria = "General",
        stock = 0,
        stockCritico = 5,
        unidad = "Unidad",
      } = req.body || {}

      if (
        ![codigo, nombre, categoria, unidad].every(texto) ||
        !numero(stock) ||
        !numero(stockCritico)
      )
        return res
          .status(400)
          .json({
            error: "Revisa los campos de texto y las cantidades no negativas.",
          })

      const articulo = await Articulo.create({
        codigo: codigo.trim(),
        nombre: nombre.trim(),
        categoria: categoria.trim(),
        stock,
        stockCritico,
        unidad: unidad.trim(),
      })

      res
        .status(201)
        .json({ mensaje: "Artículo creado.", articulo: vista(articulo) })
    },
  )

  app.get("/api/compras", permitir("Gerencia", "Finanzas"), async (_req, res) => {
    const compras = await Articulo.aggregate([
      { $unwind: "$compras" },
      { $sort: { "compras.fecha": -1, "compras._id": -1 } },
      { $limit: 50 },
      { $project: {
        _id: 0,
        id: { $ifNull: ["$compras.id", { $toString: "$compras._id" }] },
        articuloId: { $toString: "$_id" },
        codigoArticulo: "$codigo", nombreArticulo: "$nombre", unidad: "$unidad",
        proveedor: "$compras.proveedor", cantidad: "$compras.cantidad",
        monto: "$compras.monto", descuento: "$compras.descuento",
        neto: "$compras.neto", iva: "$compras.iva", total: "$compras.total",
        fecha: "$compras.fecha",
      } },
    ]);
    res.json(compras);
  });

  app.post(
    "/api/compras",
    permitir("Finanzas"),
    async (req, res) => {
      const {
        codigoArticulo,
        cantidad,
        proveedor,
        monto,
        descuento = 0,
      } = req.body || {}

      if (
        !texto(codigoArticulo) ||
        !texto(proveedor) ||
        !numero(cantidad) ||
        cantidad <= 0 ||
        !numero(monto) ||
        !Number.isSafeInteger(monto) ||
        !numero(descuento) ||
        descuento > 100
      )
        return res
          .status(400)
          .json({
            error:
              "Compra inválida: revisa artículo, proveedor, cantidad, monto y descuento.",
          })

      const neto = Math.round(monto * (1 - descuento / 100))

      const iva = Math.round(neto * 0.19),
        total = neto + iva

      const compra = {
        id: randomUUID(), proveedor: proveedor.trim(), cantidad, monto,
        descuento, neto, iva, total, usuarioId: req.usuario.id, fecha: new Date(),
      };
      // La misma escritura confirma el ingreso y conserva su historial.
      const articulo = await Articulo.findOneAndUpdate(
        { codigo: codigoArticulo.trim(), stock: { $lte: 1e12 - cantidad } },
        { $inc: { stock: cantidad }, $push: { compras: compra } },
        { new: true, runValidators: true },
      );

      if (!articulo)
        return res
          .status(409)
          .json({
            error:
              "El artículo no existe o el stock superaría el límite permitido.",
          })

      res
        .status(201)
        .json({
          mensaje: "Compra registrada y stock actualizado.",
          articulo: vista(articulo),
          compra: { ...compra, articuloId: String(articulo._id), codigoArticulo: articulo.codigo, nombreArticulo: articulo.nombre, unidad: articulo.unidad },
          total,
        })
    },
  )

  app.use((_req, res) =>
    res.status(404).json({ error: "Endpoint no encontrado." }),
  )

  app.use((err, _req, res, _next) => {
    if (err.code === 11000)
      return res
        .status(409)
        .json({ error: "Ya existe un artículo con ese código." })

    if (err.type === "entity.parse.failed")
      return res.status(400).json({ error: "JSON inválido." })

    if (err.type === "entity.too.large")
      return res
        .status(413)
        .json({ error: "La solicitud supera el tamaño permitido." })

    if (err.name === "ValidationError" || err.name === "CastError")
      return res
        .status(400)
        .json({ error: "Los datos no cumplen el formato requerido." })

    console.error("Error de API:", err.message)

    res
      .status(500)
      .json({ error: "No se pudo completar la operación en el servidor." })
  })

  return app
}

