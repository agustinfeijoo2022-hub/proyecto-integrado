import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
import mongoose from "mongoose";
import Articulo from "./models/Articulo.js";
import { conectarMongo } from "./config/mongo.js";
import { conectarPostgres, pool } from "./config/postgres.js";
import { createApp } from "./app.js";

let app;

try {
  app = createApp(Articulo);

  // PostgreSQL es opcional: su inicializador informa el error sin lanzarlo.
  await conectarPostgres();

  // MongoDB sigue siendo obligatorio para inventario y compras.
  await conectarMongo();
  await Articulo.init();

  const port = Number(process.env.PORT || 3001);
  const server = app.listen(port, () => {
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
