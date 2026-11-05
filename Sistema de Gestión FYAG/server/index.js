import express from 'express';
import cors from 'cors';
import { conectarPostgres } from './config/postgres.js';
import { conectarMongo } from './config/mongo.js';

const app = express();
app.use(cors());
app.use(express.json());

const iniciarBasesDeDatos = async () => {
  console.log('⏳ Iniciando conexiones a bases de datos...');
  await conectarPostgres();
  await conectarMongo();
};

iniciarBasesDeDatos();

app.get('/api/status', (req, res) => {
  res.json({ mensaje: 'Servidor de FYAG funcionando correctamente 🚀' });
});

app.get('/api/articulos', (req, res) => {
  res.json([
    { id: 1, codigo: 'REF-001', nombre: 'Compresor Copeland', stock: 12 },
    { id: 2, codigo: 'REF-002', nombre: 'Gas R410A', stock: 3 }
  ]);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor Backend corriendo en http://localhost:${PORT}`);
});