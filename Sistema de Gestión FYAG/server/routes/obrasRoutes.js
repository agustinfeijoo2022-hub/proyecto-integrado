import { Router } from "express"
import { obrasController } from "../controllers/obrasController.js"
import { permitir, validarEsquema } from "../middlewares/auth.js"
import { obraSchema, actualizarObraSchema } from "../schemas.js"

export function crearObrasRoutes(pgPool, Articulo, tecnicos) {
  const router = Router()
  const ctrl = obrasController(pgPool, Articulo, tecnicos)

  router.get("/", permitir("Gerencia", "Finanzas", "Encargado de Bodega", "Técnico"), ctrl.obtenerTodas)
  router.get("/tecnicos", permitir("Gerencia", "Encargado de Bodega"), (_req, res) => res.json(tecnicos))
  router.get("/catalogo", permitir("Gerencia", "Encargado de Bodega", "Técnico"), async (_req, res, next) => {
    try {
      res.json(await Articulo.find({}, { _id: 0, codigo: 1, nombre: 1, stock: 1, unidad: 1 }).sort({ nombre: 1 }).lean());
    } catch (error) { next(error); }
  })
  router.get("/:id/materiales", permitir("Gerencia", "Encargado de Bodega", "Técnico"), ctrl.materiales)
  router.post("/", permitir("Encargado de Bodega"), validarEsquema(obraSchema), ctrl.crear)
  router.patch("/:id", permitir("Gerencia", "Encargado de Bodega"), validarEsquema(actualizarObraSchema), ctrl.actualizar)

  return router
}
