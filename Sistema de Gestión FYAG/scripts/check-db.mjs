import "dotenv/config";
import mongoose from "mongoose";
import { conectarMongo } from "../server/config/mongo.js";
import { conectarPostgres, pool } from "../server/config/postgres.js";
try {
  if (!await conectarPostgres()) throw new Error("PostgreSQL no está disponible.");
  await conectarMongo();
  await mongoose.connection.db.admin().ping();
  console.log("Verificación real correcta: MongoDB y PostgreSQL responden.");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await Promise.allSettled([mongoose.disconnect(), pool.end()]);
}
