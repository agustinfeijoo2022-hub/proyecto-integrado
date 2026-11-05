import pg from 'pg';
const { Pool } = pg;

export const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'fyag_inventario',
  password: 'tu_password_secreta',
  port: 5432,
});

export const conectarPostgres = async () => {
  try {
    const client = await pool.connect();
    console.log('[PostgreSQL] Conexión establecida correctamente.');
    client.release();
  } catch (error) {
    console.error('[PostgreSQL] Error de conexión:', error.message);
  }
};