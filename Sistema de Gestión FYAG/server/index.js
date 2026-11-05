import express from 'express';
import cors from 'cors';
import pg from 'pg';
import mongoose from 'mongoose';

const { Pool } = pg;

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// 1. CONEXIÓN A POSTGRESQL
// ==========================================
const pgPool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'fyag_db',
  password: 'tu_password',
  port: 5432,
});

pgPool.connect((err) => {
  if (err) {
    console.error('❌ Error conectando a PostgreSQL:', err.message);
  } else {
    console.log('✅ Conectado a PostgreSQL (Datos relacionales)');
  }
});

// ==========================================
// 2. CONEXIÓN A MONGODB
// ==========================================
mongoose.connect('mongodb://localhost:27017/fyag_logs')
  .then(() => console.log('✅ Conectado a MongoDB (Datos no relacionales)'))
  .catch(err => console.error('❌ Error conectando a MongoDB:', err.message));

// ==========================================
// 3. RUTAS DE LA API
// ==========================================
app.get('/api/status', (req, res) => {
  res.json({ mensaje: 'Servidor de FYAG funcionando correctamente 🚀' });
});

app.get('/api/articulos', async (req, res) => {
  res.json([
    { id: 1, codigo: 'REF-001', nombre: 'Compresor Copeland', stock: 12 },
    { id: 2, codigo: 'REF-002', nombre: 'Gas R410A', stock: 3 }
  ]);
});

// Levantar el servidor
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor Backend corriendo en http://localhost:${PORT}`);
});