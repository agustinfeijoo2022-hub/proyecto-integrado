import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { permitir, validarEsquema } from "../middlewares/auth.js";

const cliente = z.object({
  razonSocial: z.string().trim().min(2).max(160),
  rut: z.string().trim().max(24),
  contacto: z.string().trim().max(160),
  email: z.union([z.literal(""), z.email().max(254)]),
});
const monto = z.number().int().positive().max(2147483647);
const factura = z.object({ obraId: z.number().int().positive().max(2147483647),
  folio: z.string().trim().min(1).max(50), emision: z.iso.date(), vencimiento: z.iso.date(), monto,
}).refine(datos => datos.vencimiento >= datos.emision, { message: "El vencimiento debe ser igual o posterior a la emisión." });
const pago = z.object({ id: z.uuid(), monto });
const columnasCliente = `id, razon_social AS "razonSocial", COALESCE(rut, '') AS rut, contacto, email`;

export function crearComercialRoutes(pool) {
  const router = Router();
  const lectura = permitir("Gerencia", "Finanzas");
  const escritura = permitir("Finanzas");
  router.get("/clientes", lectura, async (_req, res, next) => {
    try { res.json((await pool.query(`SELECT ${columnasCliente} FROM clientes ORDER BY razon_social`)).rows); }
    catch(error) { next(error); }
  });
  const guardarCliente = (editar) => async (req, res, next) => {
    try {
      const { razonSocial, rut, contacto, email } = req.body;
      const normalizado = rut.replace(/[.\s]/g, "").toUpperCase() || null;
      const valores = [razonSocial, normalizado, contacto, email, editar ? req.params.id : randomUUID()];
      const sql = editar
        ? "UPDATE clientes SET razon_social=$1,rut=$2,contacto=$3,email=$4 WHERE id=$5"
        : "INSERT INTO clientes(razon_social,rut,contacto,email,id) VALUES($1,$2,$3,$4,$5)";
      const { rows } = await pool.query(`${sql} RETURNING ${columnasCliente}`, valores);
      if (!rows.length) return res.status(404).json({ error: "Cliente no encontrado." });
      res.status(editar ? 200 : 201).json(rows[0]);
    } catch(error) { next(error); }
  };
  router.post("/clientes", escritura, validarEsquema(cliente), guardarCliente(false));
  router.patch("/clientes/:id", escritura, validarEsquema(cliente), guardarCliente(true));

  router.get("/facturas", lectura, async (_req, res, next) => {
    try {
      const { rows } = await pool.query(`
        WITH cuenta AS (
          SELECT f.*, o.codigo AS obra_codigo, o.nombre AS obra_nombre, o.estado AS obra_estado,
            COALESCE(c.razon_social,o.cliente_id) AS cliente_nombre,
            COALESCE((SELECT SUM(monto) FROM pagos p WHERE p.factura_id=f.id),0)::int AS pagado
          FROM facturas f JOIN obras o ON o.id=f.obra_id
          LEFT JOIN clientes c ON c.id=CASE WHEN o.cliente_id ~ '^[0-9]+$' THEN 'c'||o.cliente_id ELSE o.cliente_id END
        )
        SELECT id, obra_id, folio, monto, obra_codigo, obra_nombre, obra_estado, cliente_nombre, pagado,
          emision::text AS emision, vencimiento::text AS vencimiento, monto-pagado AS saldo,
          CASE WHEN monto=pagado THEN 'Pagada'
               WHEN vencimiento < (now() AT TIME ZONE 'America/Santiago')::date THEN 'Vencida'
               WHEN pagado>0 THEN 'Pago parcial' ELSE 'Pendiente' END AS estado
        FROM cuenta ORDER BY cuenta.vencimiento, cuenta.id`);
      res.json(rows);
    } catch(error) { next(error); }
  });
  router.post("/facturas", escritura, validarEsquema(factura), async (req, res, next) => {
    try {
      const { obraId, folio, emision, vencimiento, monto: valor } = req.body;
      const { rows } = await pool.query(`
        INSERT INTO facturas(obra_id,folio,emision,vencimiento,monto)
        SELECT id,$2,$3,$4,$5 FROM obras WHERE id=$1 AND estado NOT IN ('Cancelada','Cierre comercial') FOR SHARE
        RETURNING id`, [obraId,folio,emision,vencimiento,valor]);
      if (!rows.length) return res.status(409).json({ error: "Selecciona una obra vigente que admita facturación." });
      res.status(201).json(rows[0]);
    } catch(error) { next(error); }
  });
  router.post("/facturas/:id/pagos", escritura, validarEsquema(pago), async (req, res, next) => {
    const facturaId = Number(req.params.id);
    if (!Number.isSafeInteger(facturaId) || facturaId < 1 || facturaId > 2147483647)
      return res.status(400).json({ error: "Factura inválida." });
    let db;
    try {
      db = await pool.connect();
      await db.query("BEGIN");
      const { rows: [datos] } = await db.query(`
        SELECT f.monto,o.estado FROM facturas f JOIN obras o ON o.id=f.obra_id WHERE f.id=$1 FOR UPDATE OF o,f`,[facturaId]);
      const { id, monto: valor } = req.body;
      const { rows: [anterior] } = await db.query("SELECT factura_id,monto FROM pagos WHERE id=$1",[id]);
      if (anterior && anterior.factura_id===facturaId && anterior.monto===valor) {
        await db.query("COMMIT");
        return res.status(200).json({ id });
      }
      const { rows: [cobro] } = await db.query("SELECT COALESCE(SUM(monto),0)::int AS pagado FROM pagos WHERE factura_id=$1",[facturaId]);
      if (!datos || ["Cancelada","Cierre comercial"].includes(datos.estado) || anterior || valor>datos.monto-cobro.pagado) {
        await db.query("ROLLBACK");
        return res.status(409).json({ error: "La factura no admite el pago indicado. Revisa su estado y saldo." });
      }
      await db.query("INSERT INTO pagos(id,factura_id,monto) VALUES($1,$2,$3)",[id,facturaId,valor]);
      await db.query("COMMIT");
      res.status(201).json({ id });
    } catch(error) {
      if (db) await db.query("ROLLBACK").catch(() => {});
      next(error);
    } finally { db?.release(); }
  });
  return router;
}
