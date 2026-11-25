import { z } from "zod";

export const presupuestoSchema = z.object({
  folio: z.string().min(3, "El folio es muy corto").max(50),
  cliente_id: z.string().min(1, "El cliente es obligatorio"),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato YYYY-MM-DD"),
  tipo: z.string().min(3).max(100),
  total: z.number().positive("El total debe ser mayor a cero"),
  estado: z.enum(["Borrador", "Enviado"]).optional()
});

export const obraSchema = z.object({
  codigo: z.string().min(3).max(50),
  nombre: z.string().min(3).max(200),
  cliente_id: z.string().min(1),
  presupuesto_id: z.number().int().positive(),
  tipo: z.string().min(3).max(100),
  tecnico_id: z.string().nullable().optional(),
  inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  estado: z.literal("En proceso").optional()
});
export const actualizarObraSchema = z.object({
  avance: z.number().int().min(0).max(100).optional(),
  estado: z.enum(["En proceso", "Finalizada", "Suspendida", "Cancelada", "Cierre comercial"]).optional(),
  tecnico_id: z.string().trim().min(1).max(160).optional(),
  materiales: z.array(z.object({
    codigo: z.string().trim().min(1).max(160),
    cantidad: z.number().positive().max(1e12)
  })).max(50).optional(),
}).refine(datos => Object.keys(datos).length > 0, "Indica al menos un cambio");
