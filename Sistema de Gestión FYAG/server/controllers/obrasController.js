const estadosActivos = ["En proceso", "Suspendida"];
const transiciones = new Map([
  ["En proceso", ["Suspendida", "Finalizada", "Cancelada"]],
  ["Suspendida", ["En proceso", "Cancelada"]],
  ["Finalizada", ["Cierre comercial"]],
  ["Cancelada", []],
  ["Cierre comercial", []],
]);

function presentarObra(obra) {
  return { ...obra, transiciones_disponibles: transiciones.get(obra.estado) ?? [] };
}

async function resolverReserva(Articulo, obraId, asignada) {
  const marca = `asignacionesPendientes.${obraId}`;
  if (asignada) {
    await Articulo.updateMany({ [marca]: { $exists: true } }, { $unset: { [marca]: "" } });
    return;
  }
  const articulos = await Articulo.find({ [marca]: { $exists: true } })
    .select("+asignacionesPendientes");
  for (const articulo of articulos) {
    const cantidad = articulo.asignacionesPendientes.get(String(obraId));
    await Articulo.updateOne(
      { _id: articulo.id, [marca]: cantidad },
      { $inc: { stock: cantidad }, $unset: { [marca]: "", [`materialesObra.${obraId}`]: "" } },
    );
  }
}

export async function recuperarAsignaciones(pgPool, Articulo) {
  const pendientes = await Articulo.aggregate([
    { $match: { asignacionesPendientes: { $exists: true, $ne: {} } } },
    { $project: { reservas: { $objectToArray: "$asignacionesPendientes" } } },
    { $unwind: "$reservas" },
    { $group: { _id: "$reservas.k" } },
  ]);
  for (const { _id: obraId } of pendientes) {
    const db = await pgPool.connect();
    try {
      await db.query("BEGIN");
      const { rows: [obra] } = await db.query("SELECT tecnico_id FROM obras WHERE id = $1 FOR UPDATE", [obraId]);
      await resolverReserva(Articulo, obraId, Boolean(obra?.tecnico_id));
      await db.query("COMMIT");
    } catch (error) {
      await db.query("ROLLBACK").catch(() => {});
      throw error;
    } finally { db.release(); }
  }
}

export const obrasController = (pgPool, Articulo, tecnicos) => ({
  obtenerTodas: async (req, res, next) => {
    try {
      const tecnico = req.usuario.rol === "Técnico";
      if (tecnico && !req.usuario.tecnicoId) return res.json([]);
      const filtro = tecnico ? "WHERE o.tecnico_id = $1" : "";
      const { rows } = await pgPool.query(
        `SELECT o.*, p.folio AS presupuesto_folio, c.razon_social AS cliente_nombre
         FROM obras o LEFT JOIN presupuestos p ON p.id = o.presupuesto_id
         LEFT JOIN clientes c ON c.id = CASE WHEN o.cliente_id ~ '^[0-9]+$' THEN 'c' || o.cliente_id ELSE o.cliente_id END
         ${filtro} ORDER BY o.inicio DESC`,
        tecnico ? [req.usuario.tecnicoId] : [],
      );
      res.json(rows.map(presentarObra));
    } catch (error) { next(error); }
  },

  materiales: async (req, res, next) => {
    try {
      const obraId = Number(req.params.id);
      if (!Number.isSafeInteger(obraId) || obraId < 1 || obraId > 2147483647)
        return res.status(400).json({ error: "Identificador de obra inválido." });
      const { rows: [obra] } = await pgPool.query("SELECT tecnico_id FROM obras WHERE id = $1", [obraId]);
      if (!obra || (req.usuario.rol === "Técnico" && (!req.usuario.tecnicoId || obra.tecnico_id !== req.usuario.tecnicoId)))
        return res.status(404).json({ error: "Obra no encontrada." });
      const saldo = `materialesObra.${obraId}`;
      const devueltos = `devueltosObra.${obraId}`;
      const utilizados = `utilizadosObra.${obraId}`;
      const datos = await Articulo.aggregate([
        { $match: {
          [`asignacionesPendientes.${obraId}`]: { $exists: false },
          $or: [saldo, devueltos, utilizados].map(campo => ({ [campo]: { $exists: true } })),
        } },
        { $project: {
          _id: 0, codigo: 1, nombre: 1, unidad: { $ifNull: ["$unidad", "Unidad"] },
          saldo: { $ifNull: [`$${saldo}`, 0] },
          devueltos: { $ifNull: [`$${devueltos}`, 0] },
          utilizados: { $ifNull: [`$${utilizados}`, 0] },
        } },
        { $set: { entregados: { $add: ["$saldo", "$devueltos", "$utilizados"] } } },
        { $sort: { nombre: 1 } },
      ]);
      res.json(datos);
    } catch (error) { next(error); }
  },

  crear: async (req, res, next) => {
    try {
      const { codigo, nombre, presupuesto_id, inicio, tecnico_id } = req.body;
      if (tecnico_id) return res.status(400).json({ error: "Asigna el técnico y los materiales desde el detalle de la obra." });
      const { rows } = await pgPool.query(
        `INSERT INTO obras (codigo, nombre, cliente_id, presupuesto_id, tipo, inicio, estado, historial)
         SELECT $1, $2, cliente_id, id, tipo, $4, 'En proceso', $5::jsonb
         FROM (SELECT * FROM presupuestos WHERE id = $3 AND estado = 'Aprobado' FOR SHARE) presupuesto
         RETURNING *`,
        [codigo, nombre, presupuesto_id, inicio, JSON.stringify([{ fecha: new Date(), detalle: "Obra creada con presupuesto aprobado" }])],
      );
      if (!rows.length) return res.status(409).json({ error: "La obra necesita un presupuesto aprobado." });
      res.status(201).json(presentarObra(rows[0]));
    } catch (error) { next(error); }
  },

  actualizar: async (req, res, next) => {
    let db;
    const obraId = Number(req.params.id);
    const saldo = `materialesObra.${obraId}`;
    const marca = `asignacionesPendientes.${obraId}`;
    let reservando = false;
    let confirmando = false;
    try {
      if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ error: "Identificador de obra inválido." });
      db = await pgPool.connect();
      await db.query("BEGIN");
      const { rows: [obra] } = await db.query("SELECT * FROM obras WHERE id = $1 FOR UPDATE", [req.params.id]);
      const { avance, estado, tecnico_id, materiales = [] } = req.body;
      if (!obra) {
        await db.query("ROLLBACK");
        return res.status(404).json({ error: "Obra no encontrada." });
      }
      const cambiaEstado = estado !== undefined && estado !== obra.estado;
      if (cambiaEstado && !transiciones.get(obra.estado)?.includes(estado)) {
        throw Object.assign(new Error(`No se puede cambiar de ${obra.estado} a ${estado}.`), { status: 409 });
      }
      if (cambiaEstado && estado === "Cancelada") {
        const { rowCount } = await db.query(
          "SELECT 1 FROM pagos p JOIN facturas f ON f.id = p.factura_id WHERE f.obra_id = $1 LIMIT 1",
          [obra.id],
        );
        if (rowCount) throw Object.assign(new Error("No se puede cancelar una obra con pagos asociados."), { status: 409 });
      }
      if (cambiaEstado && estado === "Cierre comercial") {
        const { rowCount } = await db.query(
          "SELECT 1 FROM facturas f WHERE f.obra_id = $1 AND f.monto > (SELECT COALESCE(SUM(p.monto), 0) FROM pagos p WHERE p.factura_id = f.id) LIMIT 1",
          [obra.id],
        );
        if (rowCount) throw Object.assign(new Error("La obra tiene facturas con saldo pendiente."), { status: 409 });
      }
      if (cambiaEstado && estado === "En proceso") {
        const { rowCount } = await db.query("SELECT id FROM presupuestos WHERE id = $1 AND estado = 'Aprobado' FOR SHARE", [obra.presupuesto_id]);
        if (!rowCount) throw Object.assign(new Error("La obra necesita un presupuesto aprobado."), { status: 409 });
      }
      if (tecnico_id && !tecnicos.some(item => item.id === tecnico_id)) {
        throw Object.assign(new Error("Selecciona un técnico habilitado."), { status: 400 });
      }
      if (cambiaEstado && estado === "Finalizada" && !(tecnico_id ?? obra.tecnico_id)) {
        throw Object.assign(new Error("Asigna un técnico antes de finalizar la obra."), { status: 409 });
      }
      if (materiales.length && (!tecnico_id || obra.tecnico_id || !estadosActivos.includes(estado ?? obra.estado))) {
        throw Object.assign(new Error("Indica materiales solo en la primera asignación de una obra activa."), { status: 409 });
      }
      if (new Set(materiales.map(item => item.codigo)).size !== materiales.length) {
        throw Object.assign(new Error("Agrupa las cantidades por código de artículo."), { status: 400 });
      }

      if (tecnico_id && !obra.tecnico_id) {
        await resolverReserva(Articulo, obraId, false);
        reservando = materiales.length > 0;
      }
      for (const { codigo, cantidad } of materiales) {
        const articulo = await Articulo.findOneAndUpdate(
          { codigo, stock: { $gte: cantidad }, [saldo]: { $exists: false } },
          { $inc: { stock: -cantidad, [saldo]: cantidad }, $set: { [marca]: cantidad } },
        );
        if (!articulo) throw Object.assign(new Error(`Stock insuficiente o artículo no disponible: ${codigo}.`), { status: 409 });
      }

      const avanceGuardado = cambiaEstado && estado === "Finalizada" ? 100 : avance;
      const historial = [];
      if (avanceGuardado !== undefined && avanceGuardado !== obra.avance) historial.push(`Avance informado: ${avanceGuardado}%`);
      if (estado && estado !== obra.estado) historial.push(`Estado actualizado a ${estado}`);
      if (tecnico_id && tecnico_id !== obra.tecnico_id) historial.push(`Técnico asignado: ${tecnico_id}`);
      if (materiales.length) historial.push(`Materiales entregados: ${materiales.map(({ codigo, cantidad }) => `${codigo} × ${cantidad}`).join(", ")}`);
      const { rows } = await db.query(
        `UPDATE obras SET avance = COALESCE($1, avance), estado = COALESCE($2, estado),
         tecnico_id = COALESCE($3, tecnico_id), historial = historial || $5::jsonb WHERE id = $4 RETURNING *`,
        [avanceGuardado, estado, tecnico_id, obra.id, JSON.stringify(historial.map(detalle => ({ fecha: new Date(), detalle })))],
      );
      confirmando = true;
      await db.query("COMMIT");
      if (reservando) {
        await resolverReserva(Articulo, obraId, true).catch(error => {
          console.error("La reserva confirmada se limpiará al reiniciar", obraId, error.message);
        });
      }
      res.json(presentarObra(rows[0]));
    } catch (error) {
      // Si el servidor pierde la confirmación, solo PostgreSQL puede decidir si se devuelven las reservas.
      if (reservando && !confirmando) {
        await resolverReserva(Articulo, obraId, false).catch(error => {
          console.error("La reserva fallida se recuperará al reiniciar", obraId, error.message);
        });
      }
      if (db) await db.query("ROLLBACK").catch(() => {});
      if (error.status) return res.status(error.status).json({ error: error.message });
      next(error);
    } finally {
      db?.release();
    }
  },
});
