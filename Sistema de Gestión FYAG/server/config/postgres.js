import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

export const SQL_AUDITORIA = "CREATE TABLE IF NOT EXISTS auditoria (id SERIAL PRIMARY KEY, accion VARCHAR(255), fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP)";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  query_timeout: 5000,
  statement_timeout: 5000,
  allowExitOnIdle: true,
});

// Evita que un error de una conexión inactiva termine el proceso de Node.
pool.on("error", (error) => {
  console.warn("⚠️ [PostgreSQL] Error en una conexión del pool:", error.message);
});

export async function conectarPostgres(dbPool = pool, logger = console) {
  let cliente;
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("Falta DATABASE_URL en el archivo .env de la raíz del proyecto.");
    }
    cliente = await dbPool.connect();
    await cliente.query(SQL_AUDITORIA);
    logger.log("✅ [PostgreSQL] Conexión establecida correctamente");
    return true;
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    logger.warn("⚠️ [PostgreSQL] No se pudo inicializar la conexión o la tabla auditoria. El servidor continuará utilizando MongoDB:", mensaje);
    return false;
  } finally {
    if (cliente) cliente.release();
  }
}
