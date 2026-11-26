import { Router } from "express";
import { z } from "zod";
import { permitir, validarEsquema } from "../middlewares/auth.js";

const solicitud = z.object({
  clienteId: z.string().trim().min(1).max(50),
  asunto: z.string().trim().min(3).max(140),
  alcance: z.string().trim().min(10).max(2500),
  materiales: z.string().trim().max(1500).optional(),
  plazo: z.iso.date().or(z.literal("")).optional(),
});

function destinatario(usuario) {
  return usuario.rol === "Técnico" ? `tecnico:${usuario.tecnicoId ?? ""}` : usuario.rol;
}

export function crearNotificacionesRoutes(pool) {
  const router = Router();

  router.get("/", async (req, res, next) => {
    try {
      const { rows } = await pool.query(`
        SELECT id, tipo, titulo, mensaje, cliente_id, obra_id, presupuesto_id, creada_en, leida_en
        FROM notificaciones WHERE destinatario=$1 ORDER BY (leida_en IS NULL) DESC, id DESC LIMIT 100
      `, [destinatario(req.usuario)]);
      res.json(rows);
    } catch (error) { next(error); }
  });

  router.get("/resumen", async (req, res, next) => {
    try {
      const { rows: [resumen] } = await pool.query(`
        SELECT EXISTS (SELECT 1 FROM notificaciones WHERE destinatario=$1 AND leida_en IS NULL) AS pendientes
      `, [destinatario(req.usuario)]);
      res.json(resumen);
    } catch (error) { next(error); }
  });

  router.post("/cotizaciones", permitir("Gerencia"), validarEsquema(solicitud), async (req, res, next) => {
    try {
      const { clienteId, asunto, alcance, materiales, plazo } = req.body;
      const { rowCount } = await pool.query(`
        INSERT INTO notificaciones (destinatario,tipo,titulo,mensaje,cliente_id,cotizacion)
        SELECT 'Finanzas','cotizacion',$2,
          concat_ws(E'\\n\\n', 'Cliente: ' || razon_social, 'Alcance: ' || $3::text,
                    'Materiales: ' || NULLIF($4::text,''), 'Plazo solicitado: ' || NULLIF($5::text,'')), id,
          jsonb_build_object('trabajo',$2::text,'alcance',$3::text,'materiales_solicitados',NULLIF($4::text,''),'plazo',NULLIF($5::text,''))
        FROM clientes WHERE id=$1
      `, [clienteId, asunto, alcance, materiales || "", plazo || ""]);
      if (!rowCount) return res.status(404).json({ error: "El cliente seleccionado no existe." });
      res.status(201).json({ mensaje: "Solicitud enviada a Finanzas." });
    } catch (error) { next(error); }
  });

  router.patch("/:id/leer", async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isSafeInteger(id) || id < 1 || id > 2147483647)
        return res.status(400).json({ error: "Notificación inválida." });
      const { rows: [notificacion] } = await pool.query(`
        UPDATE notificaciones SET leida_en=COALESCE(leida_en,now())
        WHERE id=$1 AND destinatario=$2 RETURNING id,leida_en
      `, [id, destinatario(req.usuario)]);
      if (!notificacion) return res.status(404).json({ error: "Notificación no encontrada." });
      res.json(notificacion);
    } catch (error) { next(error); }
  });

  return router;
}
