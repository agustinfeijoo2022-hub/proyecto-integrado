const consulta = `SELECT p.*, c.razon_social AS cliente_nombre FROM presupuestos p
  LEFT JOIN clientes c ON c.id = CASE WHEN p.cliente_id ~ '^[0-9]+$' THEN 'c' || p.cliente_id ELSE p.cliente_id END`;
export const presupuestosController = (pgPool) => ({
  obtenerAprobados: async (_req, res, next) => {
    try {
      const { rows } = await pgPool.query(`${consulta} WHERE p.estado = $1 ORDER BY p.fecha DESC`, ["Aprobado"]);
      res.json(rows);
    } catch (error) { next(error); }
  },
  obtenerTodos: async (req, res, next) => {
    try {
      const { rows } = await pgPool.query(`${consulta} ORDER BY p.fecha DESC`)
      res.json(rows)
    } catch (error) { next(error) }
  },

  crear: async (req, res, next) => {
    const { folio, cliente_id, fecha, tipo, total, estado } = req.body
    try {
      const { rows } = await pgPool.query(
        "INSERT INTO presupuestos (folio, cliente_id, fecha, tipo, total, estado) SELECT $1,id,$3,$4,$5,$6 FROM clientes WHERE id=$2 RETURNING *",
        [folio, cliente_id, fecha, tipo, total, estado || "Borrador"]
      )
      if (!rows.length) return res.status(409).json({ error: "El cliente seleccionado no existe." });
      res.status(201).json(rows[0])
    } catch (error) { next(error) }
  },

  actualizarEstado: async (req, res, next) => {
    const { id } = req.params
    const { estado } = req.body
    try {
      const { rows } = await pgPool.query(
        "UPDATE presupuestos SET estado = $1 WHERE id = $2 RETURNING *",
        [estado, id]
      )
      if (rows.length === 0) return res.status(404).json({ error: "No encontrado." })
      res.json(rows[0])
    } catch (error) { next(error) }
  }
})