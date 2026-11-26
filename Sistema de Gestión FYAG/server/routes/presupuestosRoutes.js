import { z } from "zod";
import { Router } from "express"
import { presupuestosController } from "../controllers/presupuestosController.js"
import { permitir, validarEsquema } from "../middlewares/auth.js"
import { presupuestoSchema } from "../schemas.js"

export function crearPresupuestosRoutes(pgPool, Articulo) {
  const router = Router()
  const ctrl = presupuestosController(pgPool, Articulo)

  router.get("/", permitir("Gerencia", "Finanzas"), ctrl.obtenerTodos)
  router.get("/aprobados", permitir("Encargado de Bodega"), ctrl.obtenerAprobados)
  router.post("/", permitir("Finanzas"), validarEsquema(presupuestoSchema), ctrl.crear)
  router.patch("/:id", permitir("Gerencia"), validarEsquema(z.object({ estado: z.enum(["Aprobado", "Rechazado"]) })), ctrl.actualizarEstado)

  return router
}