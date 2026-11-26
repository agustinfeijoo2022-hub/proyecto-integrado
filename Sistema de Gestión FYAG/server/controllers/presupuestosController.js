const consulta = `SELECT p.*, c.razon_social AS cliente_nombre FROM presupuestos p
  LEFT JOIN clientes c ON c.id = CASE WHEN p.cliente_id ~ '^[0-9]+$' THEN 'c' || p.cliente_id ELSE p.cliente_id END`;

const textoMateriales = `
  COALESCE((SELECT string_agg((m->>'codigo') || ' × ' || (m->>'cantidad'), E'\\n')
    FROM jsonb_array_elements(p.materiales_previstos) m), 'Sin materiales previstos.')
`;

export const presupuestosController = (pgPool, Articulo) => ({
  obtenerAprobados: async (_req, res, next) => {
    try {
      const { rows } = await pgPool.query(`
        SELECT p.id,p.folio,p.cliente_id,c.razon_social AS cliente_nombre,p.tipo,p.estado,
          p.materiales_previstos,p.instrucciones
        FROM presupuestos p
        LEFT JOIN clientes c ON c.id=CASE WHEN p.cliente_id ~ '^[0-9]+$' THEN 'c' || p.cliente_id ELSE p.cliente_id END
        WHERE p.estado = 'Aprobado' ORDER BY p.fecha DESC
      `);
      res.json(rows);
    } catch (error) { next(error); }
  },
  obtenerTodos: async (_req, res, next) => {
    try {
      const { rows } = await pgPool.query(`${consulta} ORDER BY p.fecha DESC`);
      res.json(rows);
    } catch (error) { next(error); }
  },
  crear: async (req, res, next) => {
    const { folio, cliente_id, fecha, tipo, total, estado, solicitud_id,
      partidas = [], materiales_previstos = [] } = req.body;
    try {
      const codigos = materiales_previstos.map(m => m.codigo);
      if (new Set(codigos).size !== codigos.length)
        return res.status(400).json({ error: "Agrupa las cantidades por código de material." });
      if (codigos.length) {
        const catalogo = await Articulo.find({ codigo: { $in: codigos } }, { codigo: 1 }).lean();
        if (catalogo.length !== codigos.length)
          return res.status(400).json({ error: "Selecciona materiales con códigos vigentes del catálogo." });
      }
      const calculado = partidas.length
        ? Math.round(partidas.reduce((suma, item) => suma + item.cantidad * item.precioUnitario, 0))
        : total;
      if (!Number.isInteger(calculado) || calculado < 1 || calculado > 2147483647 || calculado !== total)
        return res.status(400).json({ error: "El total debe coincidir con las partidas del presupuesto." });
      const { rows } = await pgPool.query(`
        WITH nuevo AS (
          INSERT INTO presupuestos (folio,cliente_id,fecha,tipo,total,estado,solicitud_id,partidas,materiales_previstos,instrucciones)
          SELECT $1,c.id,$3,$4,$5,$6,n.id,$8::jsonb,$9::jsonb,COALESCE(n.cotizacion, CASE WHEN n.id IS NOT NULL THEN jsonb_build_object('trabajo',n.titulo,'alcance',n.mensaje) END)
          FROM clientes c LEFT JOIN notificaciones n
            ON n.id=$7 AND n.destinatario='Finanzas' AND n.tipo='cotizacion' AND n.cliente_id=c.id
          WHERE c.id=$2 AND ($7::int IS NULL OR n.id IS NOT NULL) RETURNING *
        ), aviso AS (
          INSERT INTO notificaciones (destinatario,tipo,titulo,mensaje,cliente_id)
          SELECT 'Encargado de Bodega','presupuesto','Nuevo presupuesto ' || p.folio,
            'Cliente: ' || c.razon_social || E'\\n' ||
            'Pendiente de aprobación. Materiales previstos:' || E'\\n' || ${textoMateriales}, c.id
          FROM nuevo p JOIN clientes c ON c.id=p.cliente_id
        ), revision AS (
          INSERT INTO notificaciones (destinatario,tipo,titulo,mensaje,cliente_id,presupuesto_id)
          SELECT 'Gerencia','presupuesto','Presupuesto pendiente de aprobación: ' || p.folio,
            'Finanzas envió un presupuesto para ' || c.razon_social || '. Revísalo en Presupuestos.',
            c.id,p.id
          FROM nuevo p JOIN clientes c ON c.id=p.cliente_id WHERE p.estado='Enviado'
        ) SELECT * FROM nuevo`,
        [folio,cliente_id,fecha,tipo,calculado,estado || "Borrador",solicitud_id ?? null,
          JSON.stringify(partidas),JSON.stringify(materiales_previstos)]);
      if (!rows.length) return res.status(409).json({ error: "El cliente o la solicitud de presupuesto no corresponde." });
      res.status(201).json(rows[0]);
    } catch (error) { next(error); }
  },
  actualizarEstado: async (req, res, next) => {
    try {
      const { rows } = await pgPool.query(`
        WITH cambio AS (
          UPDATE presupuestos SET estado=$1 WHERE id=$2 AND estado IS DISTINCT FROM $1 RETURNING *
        ), aviso AS (
          INSERT INTO notificaciones (destinatario,tipo,titulo,mensaje,cliente_id)
          SELECT 'Encargado de Bodega','presupuesto','Presupuesto aprobado ' || p.folio,
            'Ya puedes crear la obra para ' || c.razon_social || '. Materiales previstos:' || E'\\n' ||
            ${textoMateriales}, c.id
          FROM cambio p JOIN clientes c
            ON c.id=CASE WHEN p.cliente_id ~ '^[0-9]+$' THEN 'c' || p.cliente_id ELSE p.cliente_id END
          WHERE p.estado='Aprobado'
        ), cerrar_revision AS (
          UPDATE notificaciones n SET leida_en=COALESCE(n.leida_en,now())
          FROM cambio p WHERE n.destinatario='Gerencia' AND n.presupuesto_id=p.id
        )
        SELECT * FROM cambio UNION ALL
        SELECT * FROM presupuestos WHERE id=$2 AND NOT EXISTS (SELECT 1 FROM cambio)`,
        [req.body.estado, req.params.id]);
      if (!rows.length) return res.status(404).json({ error: "No encontrado." });
      res.json(rows[0]);
    } catch (error) { next(error); }
  },
});
