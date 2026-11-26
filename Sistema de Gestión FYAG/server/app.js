import { crearNotificacionesRoutes } from "./routes/notificacionesRoutes.js";
import { crearComercialRoutes } from "./routes/comercialRoutes.js";
import express from "express"
import cors from "cors"
import helmet from "helmet"
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto"

import { crearAutenticador, permitir } from "./middlewares/auth.js"
import { crearPresupuestosRoutes } from "./routes/presupuestosRoutes.js"
import { crearObrasRoutes } from "./routes/obrasRoutes.js"

const SESSION_MS = 8 * 60 * 60 * 1000
const WINDOW_MS = 15 * 60 * 1000
const cookieName = "fyag_session"

const perfiles = [
  { key: "GERENCIA", id: "u1", nombre: "Gerencia FYAG", email: "gerencia@fyag.cl", rol: "Gerencia" },
  { key: "FINANZAS", id: "u2", nombre: "Finanzas FYAG", email: "finanzas@fyag.cl", rol: "Finanzas" },
  { key: "SUPERVISOR", id: "u3", nombre: "Encargado de Bodega", email: "bodega@fyag.cl", rol: "Encargado de Bodega" },
  { key: "TECNICO", id: "u4", nombre: "Técnico FYAG", email: "tecnico@fyag.cl", rol: "Técnico", tecnicoId: "t1" },
]

class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
  }
}

export function createApp(Articulo, env = process.env, auditoria, pgPool) {
  const app = express()
  
  app.use(helmet()) 
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

  if (!usuarios.length) throw new Error("Configura al menos una contraseña FYAG_*_PASSWORD en .env.")

  const dummySalt = randomBytes(16).toString("hex")
  const dummyHash = scryptSync(randomBytes(32), dummySalt, 64)

  const cookieOptions = { httpOnly: true, sameSite: "lax", secure, path: "/" }

  app.use(cors({ origin, credentials: true }))
  app.use((req, res, next) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method) && req.get("origin") !== origin)
      return next(new AppError("Origen no permitido.", 403))
    next()
  })

  app.use(express.json({ limit: "32kb" }))

  function token(req) {
    return (req.headers.cookie || "").split(";").map((p) => p.trim()).find((p) => p.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1)
  }

  const limpiar = setInterval(() => {
    const ahora = Date.now()
    for (const [key, s] of sesiones) if (s.expira <= ahora) sesiones.delete(key)
    for (const [key, s] of intentos) if (s.hasta <= ahora) intentos.delete(key)
  }, 60000)
  limpiar.unref()

  app.locals.dispose = () => { clearInterval(limpiar); sesiones.clear(); intentos.clear() }

  app.get("/api/status", (_req, res) => res.json({ mensaje: "API FYAG disponible" }))

  app.post("/api/auth/login", async (req, res, next) => {
    try {
      const { email, password } = req.body || {}
      if (typeof email !== "string" || typeof password !== "string" || email.length > 254 || password.length > 256)
        return next(new AppError("Credenciales inválidas.", 400))

      const ip = req.ip
      let limite = intentos.get(ip)
      if (!limite || limite.hasta <= Date.now()) {
        limite = { cantidad: 0, hasta: Date.now() + WINDOW_MS }
        intentos.set(ip, limite)
      }
      if (limite.cantidad >= 10) return next(new AppError("Demasiados intentos. Inténtalo en 15 minutos.", 429))
      limite.cantidad++

      const found = usuarios.find((u) => u.user.email === email.trim().toLowerCase())
      const hash = scryptSync(password, found?.salt || dummySalt, 64)

      if (!timingSafeEqual(hash, found?.hash || dummyHash) || !found)
        return next(new AppError("Correo o contraseña incorrectos.", 401))

      if (auditoria) await auditoria.registrarIngreso(found.user)
      intentos.delete(ip)
      const previo = token(req)
      if (previo) sesiones.delete(previo)
      const id = randomBytes(32).toString("hex")
      sesiones.set(id, { usuario: found.user, expira: Date.now() + SESSION_MS })
      res.cookie(cookieName, id, { ...cookieOptions, maxAge: SESSION_MS })
      res.set("Cache-Control", "no-store").json(found.user)
    } catch (error) { next(error) }
  })

  app.post("/api/auth/logout", (req, res) => {
    const id = token(req)
    if (id) sesiones.delete(id)
    res.clearCookie(cookieName, cookieOptions).status(204).end()
  })

  const autenticar = crearAutenticador(sesiones)
  app.use("/api", autenticar, (_req, res, next) => {
    res.set("Cache-Control", "no-store")
    next()
  })

  app.get("/api/auth/me", (req, res) => res.json(req.usuario))

  // Defensa central
  app.use("/api", (req, res, next) => {
    if (req.usuario.rol === "Técnico" && !/^\/(obras|solicitudes|devoluciones|consumos|notificaciones)(\/|$)/.test(req.path)) {
        return next(new AppError("Solo tienes acceso a Mis Tareas.", 403));
    }
    if (req.usuario.rol === "Gerencia" && !["GET", "HEAD", "OPTIONS"].includes(req.method) && /^\/(articulos|compras)(\/|$)/.test(req.path))
      return next(new AppError("Gerencia tiene acceso de solo lectura a artículos y compras.", 403));
    next();
  });

  if (pgPool) {
    app.use("/api", (req, res, next) => {
      if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
        const recurso = req.path;
        res.once("finish", () => {
          if (res.statusCode < 200 || res.statusCode >= 300) return;
          const referencia = [req.body?.obraId, req.body?.codigo, req.body?.folio, req.body?.codigoArticulo]
            .filter(value => typeof value === "string" || typeof value === "number").join(" · ").slice(0, 180);
          void pgPool.query(
            "INSERT INTO auditoria (accion, usuario, rol, recurso, http_status) VALUES ($1,$2,$3,$4,$5)",
            [req.method, req.usuario.nombre, req.usuario.rol, (referencia ? `${recurso} · ${referencia}` : recurso).slice(0, 255), res.statusCode],
          ).catch(error => console.error("No se pudo guardar el evento de auditoría:", error.message));
        });
      }
      next();
    });
    app.get("/api/auditoria", permitir("Gerencia"), async (_req, res, next) => {
      try {
        const { rows } = await pgPool.query(
          "SELECT id, accion, fecha, usuario, rol, recurso, http_status FROM auditoria WHERE usuario IS NOT NULL ORDER BY id DESC LIMIT 100",
        );
        res.json(rows);
      } catch (error) { next(error); }
    });
  }

  const vista = (a) => ({ _id: String(a._id), codigo: a.codigo, nombre: a.nombre, categoria: a.categoria ?? "General", stock: a.stock, stockCritico: a.stockCritico ?? 5, unidad: a.unidad ?? "Unidad" })
  const texto = (value) => typeof value === "string" && value.trim().length > 0 && value.trim().length <= 160
  const numero = (value) => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1e12

  // --- ARTÍCULOS ---
  app.get("/api/articulos", permitir("Gerencia", "Finanzas", "Encargado de Bodega", "Técnico"), async (_req, res, next) => {
    try {
      const articulos = await Articulo.find().select("-compras").sort({ nombre: 1 }).lean()
      res.json(articulos.map(vista))
    } catch (error) { next(error) }
  })

  app.post("/api/articulos", permitir("Encargado de Bodega"), async (req, res, next) => {
    try {
      const { codigo, nombre, categoria = "General", stock = 0, stockCritico = 5, unidad = "Unidad" } = req.body || {}
      if (![codigo, nombre, categoria, unidad].every(texto) || !numero(stock) || !numero(stockCritico))
        return next(new AppError("Revisa los campos de texto y las cantidades no negativas.", 400))
      const articulo = await Articulo.create({ codigo: codigo.trim(), nombre: nombre.trim(), categoria: categoria.trim(), stock, stockCritico, unidad: unidad.trim() })
      res.status(201).json({ mensaje: "Artículo creado.", articulo: vista(articulo) })
    } catch (error) { next(error) }
  })

  // --- COMPRAS (FINANZAS) ---
  app.get("/api/compras", permitir("Gerencia", "Finanzas", "Encargado de Bodega"), async (req, res, next) => {
    try {
      const compras = await Articulo.aggregate([
        { $unwind: "$compras" },
        { $sort: { "compras.fecha": -1, "compras._id": -1 } },
        ...(req.query.pendientes === "true" ? [{ $match: { "compras.recibida": false } }] : [{ $limit: 50 }]),
        { $project: {
          _id: 0, id: { $ifNull: ["$compras.id", { $toString: "$compras._id" }] },
          articuloId: { $toString: "$_id" }, codigoArticulo: "$codigo", nombreArticulo: "$nombre", unidad: "$unidad",
          proveedor: "$compras.proveedor", cantidad: "$compras.cantidad", monto: "$compras.monto",
          descuento: "$compras.descuento", neto: "$compras.neto", iva: "$compras.iva", total: "$compras.total", fecha: "$compras.fecha",
          recibida: { $ifNull: ["$compras.recibida", null] }, cantidadRecibida: "$compras.cantidadRecibida"
        } },
      ]);
      res.json(compras);
    } catch (error) { next(error) }
  });

  app.post("/api/compras", permitir("Finanzas"), async (req, res, next) => {
    try {
      const { codigoArticulo, cantidad, proveedor, monto, descuento = 0 } = req.body || {}
      if (!texto(codigoArticulo) || !texto(proveedor) || !numero(cantidad) || cantidad <= 0 || !numero(monto) || !Number.isSafeInteger(monto) || !numero(descuento) || descuento > 100)
        return next(new AppError("Compra inválida: revisa artículo, proveedor, cantidad, monto y descuento.", 400))
      
      const neto = Math.round(monto * (1 - descuento / 100))
      const iva = Math.round(neto * 0.19), total = neto + iva
      
      const compra = { 
        id: randomUUID(), proveedor: proveedor.trim(), cantidad, monto, descuento, neto, iva, total, usuarioId: req.usuario.id, fecha: new Date(), recibida: false 
      };

      const articulo = await Articulo.findOneAndUpdate(
        { codigo: codigoArticulo.trim() },
        { $push: { compras: compra } },
        { returnDocument: "after" },
      );

      if (!articulo) return next(new AppError("El artículo no existe.", 409))
      
      res.status(201).json({ mensaje: "Compra registrada. Pendiente de recepción.", articulo: vista(articulo), compra: { ...compra, articuloId: String(articulo._id), codigoArticulo: articulo.codigo, nombreArticulo: articulo.nombre, unidad: articulo.unidad }, total })
    } catch (error) { next(error) }
  });

  // --- RECEPCIÓN (BODEGA) ---
  app.post("/api/compras/:articuloId/recibir/:compraId", permitir("Encargado de Bodega"), async (req, res, next) => {
    try {
      const { articuloId, compraId } = req.params;
      if (!/^[a-f0-9]{24}$/i.test(articuloId)) return next(new AppError("Artículo inválido.", 400));
      const { cantidad } = req.body || {};
      if (!numero(cantidad) || cantidad <= 0)
        return next(new AppError("Ingresa la cantidad real recibida.", 400));
      const idCompra = /^[a-f0-9]{24}$/i.test(compraId)
        ? { $or: [{ id: compraId }, { _id: compraId }] }
        : { id: compraId };
      const articulo = await Articulo.findOneAndUpdate(
        { _id: articuloId, compras: { $elemMatch: { ...idCompra, recibida: false, cantidad: { $gte: cantidad } } } },
        { $set: { "compras.$.recibida": true, "compras.$.cantidadRecibida": cantidad }, $inc: { stock: cantidad } },
        { returnDocument: "after" },
      );
      if (!articulo) return next(new AppError("La compra ya fue recibida, no existe o la cantidad supera lo comprado.", 409));
      res.json({ mensaje: "Mercancía recibida y stock actualizado.", articulo: vista(articulo) });
    } catch (error) { next(error) }
  });

  const obraAsignada = async (obraId, usuario) => {
    if (!Number.isSafeInteger(obraId) || obraId <= 0 || !usuario.tecnicoId) return false;
    const { rowCount } = await pgPool.query(
      "SELECT id FROM obras WHERE id = $1 AND tecnico_id = $2 AND estado IN ('En proceso', 'Suspendida')",
      [obraId, usuario.tecnicoId],
    );
    return rowCount > 0;
  };

  app.get("/api/solicitudes", permitir("Finanzas", "Técnico"), async (req, res, next) => {
    try {
      const solicitudes = await Articulo.aggregate([
        { $unwind: "$solicitudes" },
        ...(req.usuario.rol === "Técnico" ? [{ $match: { "solicitudes.tecnicoId": req.usuario.tecnicoId ?? null } }] : []),
        { $sort: { "solicitudes.fecha": -1 } },
        { $project: { _id: 0, id: "$solicitudes.id", obraId: "$solicitudes.obraId", codigo: 1, nombreArticulo: "$nombre",
          cantidad: "$solicitudes.cantidad", estado: "$solicitudes.estado", fecha: "$solicitudes.fecha", tecnicoId: "$solicitudes.tecnicoId" } },
      ]);
      res.json(solicitudes);
    } catch (error) { next(error) }
  });

  app.post("/api/solicitudes", permitir("Técnico"), async (req, res, next) => {
    try {
      const { codigo, cantidad, obraId } = req.body || {};
      if (!texto(codigo) || !numero(cantidad) || cantidad <= 0)
        return next(new AppError("Indica el código del artículo y una cantidad positiva.", 400));
      if (!await obraAsignada(obraId, req.usuario))
        return next(new AppError("La obra debe estar activa y asignada a ti.", 403));
      const solicitud = { id: randomUUID(), obraId, cantidad, estado: "Pendiente", fecha: new Date(), tecnicoId: req.usuario.tecnicoId };
      const articulo = await Articulo.findOneAndUpdate({ codigo: codigo.trim() }, { $push: { solicitudes: solicitud } });
      if (!articulo) return next(new AppError("Artículo no encontrado.", 404));
      res.status(201).json({ mensaje: "Solicitud enviada a Finanzas.", solicitud });
    } catch (error) { next(error) }
  });

  app.patch("/api/solicitudes/:id", permitir("Finanzas"), async (req, res, next) => {
    try {
      const { estado } = req.body || {};
      if (!["Aprobada", "Rechazada"].includes(estado))
        return next(new AppError("Selecciona aprobar o rechazar.", 400));
      const pendiente = { id: req.params.id, estado: "Pendiente" };
      const articulo = await Articulo.findOne({ solicitudes: { $elemMatch: pendiente } }).select("+solicitudes");
      const solicitud = articulo?.solicitudes.find(item => item.id === pendiente.id && item.estado === "Pendiente");
      if (!solicitud) return next(new AppError("La solicitud no existe o ya fue resuelta.", 409));
      const aprobar = estado === "Aprobada";
      if (aprobar && !await obraAsignada(solicitud.obraId, solicitud))
        return next(new AppError("La obra ya no está activa o cambió de técnico.", 409));
      const resultado = await Articulo.updateOne(
        { _id: articulo._id, solicitudes: { $elemMatch: pendiente }, ...(aprobar ? { stock: { $gte: solicitud.cantidad } } : {}) },
        {
          $set: { "solicitudes.$.estado": estado, "solicitudes.$.resueltaEn": new Date() },
          ...(aprobar ? { $inc: { stock: -solicitud.cantidad, [`materialesObra.${solicitud.obraId}`]: solicitud.cantidad } } : {}),
        },
      );
      if (!resultado.modifiedCount) return next(new AppError("Stock insuficiente o solicitud ya resuelta.", 409));
      res.json({ estado });
    } catch (error) { next(error) }
  });

  const registrarMaterial = (consumo) => async (req, res, next) => {
    try {
      const { codigo, cantidad, obraId } = req.body || {};
      if (!texto(codigo) || !numero(cantidad) || cantidad <= 0)
        return next(new AppError("Indica el código del artículo y una cantidad positiva.", 400));
      if (!await obraAsignada(obraId, req.usuario))
        return next(new AppError("La obra debe estar activa y asignada a ti.", 403));
      const saldo = `materialesObra.${obraId}`;
      const articulo = await Articulo.findOneAndUpdate(
        { codigo: codigo.trim(), [saldo]: { $gte: cantidad } },
        { $inc: {
          [saldo]: -cantidad,
          [`${consumo ? "utilizadosObra" : "devueltosObra"}.${obraId}`]: cantidad,
          ...(consumo ? {} : { stock: cantidad }),
        } },
        { returnDocument: "after" },
      );
      if (!articulo) return next(new AppError("La cantidad supera el saldo de materiales de esta obra.", 409));
      res.json({ mensaje: consumo ? "Consumo registrado." : "Sobrante devuelto al inventario.", articulo: vista(articulo) });
    } catch (error) { next(error) }
  };

  app.post("/api/devoluciones", permitir("Técnico"), registrarMaterial(false));
  app.post("/api/consumos", permitir("Técnico"), registrarMaterial(true));

  // --- REPORTES ---
  const resumirCompras = async () => {
    const [resumen] = await Articulo.aggregate([
      { $unwind: "$compras" },
      { $group: { _id: null, operaciones: { $sum: 1 }, neto: { $sum: "$compras.neto" }, iva: { $sum: "$compras.iva" }, total: { $sum: "$compras.total" } } },
      { $project: { _id: 0, operaciones: 1, neto: 1, iva: 1, total: 1 } },
    ]);
    return resumen || { operaciones: 0, neto: 0, iva: 0, total: 0 };
  };

  app.get("/api/reportes/finanzas", permitir("Gerencia", "Finanzas", "Encargado de Bodega"), async (_req, res, next) => {
    try { res.json(await resumirCompras()); }
    catch (error) { next(error); }
  });

  if (pgPool) {
    app.get("/api/dashboard/gerencia", permitir("Gerencia"), async (_req, res, next) => {
      try {
        const [compras, { rows: [resumen] }] = await Promise.all([
          resumirCompras(),
          pgPool.query(`
            SELECT
              (SELECT COALESCE(SUM(monto), 0) FROM facturas) AS facturado,
              (SELECT COALESCE(SUM(monto), 0) FROM pagos) AS cobrado,
              (SELECT COALESCE(json_agg(estados ORDER BY estado), '[]'::json)
                 FROM (SELECT estado, COUNT(*)::int AS cantidad FROM obras GROUP BY estado) estados) AS obras
          `),
        ]);
        const facturado = Number(resumen.facturado);
        const cobrado = Number(resumen.cobrado);
        res.json({ facturado, cobrado, porCobrar: facturado - cobrado, compras: compras.total, obras: resumen.obras });
      } catch (error) { next(error); }
    });
  }

  // --- RUTAS MODULARES (PRESUPUESTOS Y OBRAS) ---
  if (pgPool) app.use("/api/notificaciones", crearNotificacionesRoutes(pgPool));
  app.use("/api", crearComercialRoutes(pgPool));
  app.use("/api/presupuestos", crearPresupuestosRoutes(pgPool, Articulo))
  const tecnicos = usuarios.map(({ user }) => user).filter(user => user.rol === "Técnico")
    .map(({ tecnicoId: id, nombre }) => ({ id, nombre }));
  app.use("/api/obras", crearObrasRoutes(pgPool, Articulo, tecnicos))

  app.use((_req, res, next) => next(new AppError("Endpoint no encontrado.", 404)))

  app.use((err, _req, res, _next) => {
    console.error("Error detectado:", err.message)
    if (err.code === 11000 || err.code === "23505") return res.status(409).json({ error: "Ya existe un registro con ese código." });
    const status = err.statusCode || 500
    const mensaje = err.statusCode ? err.message : "No se pudo completar la operación en el servidor."
    res.status(status).json({ error: mensaje })
  })

  return app
}