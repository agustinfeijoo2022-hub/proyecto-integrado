import express from "express";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import mongoose from "mongoose";
import Articulo from "./models/Articulo.js";
import { conectarMongo } from "./config/mongo.js";
import { conectarPostgres, pool } from "./config/postgres.js";
import { prepararEsquema } from "./config/esquema.js";
import { recuperarAsignaciones } from "./controllers/obrasController.js";
import { createApp } from "./app.js";

let app;

try {
  app = createApp(Articulo, process.env, null, pool);

  // Ambas bases deben estar disponibles antes de aceptar peticiones.
  if (!await conectarPostgres()) throw new Error("PostgreSQL es obligatorio. Revisa DATABASE_URL y el servicio local.");

  await prepararEsquema(pool);

  // MongoDB sigue siendo obligatorio para inventario y compras.
  await conectarMongo();
  await Articulo.init();
  await recuperarAsignaciones(pool, Articulo);

  const port = Number(process.env.PORT || 3001);
  let web = app;
  if (process.env.SERVIR_FRONTEND === "true") {
    const dist = fileURLToPath(new URL("../dist/", import.meta.url));
    const index = fileURLToPath(new URL("../dist/index.html", import.meta.url));
    web = express();
    web.disable("x-powered-by");
    web.use((req, res, next) => /^\/api(?:\/|$)/.test(req.path) ? app(req, res, next) : next());
    web.use(express.static(dist));
    web.get(/^\/(?:$|login(?:\/|$)|app(?:\/|$))/, (_req, res) => res.sendFile(index));
  }
  const server = web.listen(port, () => {
    console.log(`API FYAG: http://localhost:${port}`);
  });

  let cerrando = false;
  const cerrar = () => {
    if (cerrando) return;
    cerrando = true;
    app.locals.dispose();

    const timeout = setTimeout(() => process.exit(1), 10000);
    timeout.unref();

    server.close(async () => {
      const resultados = await Promise.allSettled([
        mongoose.disconnect(),
        pool.end(),
      ]);
      clearTimeout(timeout);
      process.exit(resultados.some(r => r.status === "rejected") ? 1 : 0);
    });
  };

  process.once("SIGINT", cerrar);
  process.once("SIGTERM", cerrar);
} catch (error) {
  console.error("No se pudo iniciar FYAG:", error instanceof Error ? error.message : error);
  app?.locals.dispose();
  await Promise.allSettled([mongoose.disconnect(), pool.end()]);
  process.exit(1);
}