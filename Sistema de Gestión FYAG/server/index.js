import express from 'express';
import cors from 'cors';
import { conectarPostgres } from './config/postgres.js';
import { conectarMongo } from './config/mongo.js';

const app = express();
app.use(cors());
app.use(express.json());

const iniciarBasesDeDatos = async () => {
  console.log('Iniciando conexiones a bases de datos...');
  await conectarPostgres();
  await conectarMongo();
};

iniciarBasesDeDatos();

app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'Online',
    mensaje: 'Servidor de FYAG funcionando correctamente ',
    basesDeDatos: ['PostgreSQL', 'MongoDB']
  });
});

let listaArticulos = [
  { id: 1, codigo: 'REF-001', nombre: 'Compresor Copeland', categoria: 'Refrigeración', stock: 12, stockCritico: 5, unidad: 'Unidad' },
  { id: 2, codigo: 'REF-002', nombre: 'Gas R410A', categoria: 'Insumos', stock: 3, stockCritico: 10, unidad: 'Kg' }
];

app.get('/api/articulos', (req, res) => {
  res.json(listaArticulos);
});

app.post('/api/articulos', (req, res) => {
  const { codigo, nombre, stock, categoria } = req.body;
  
  const nuevoArticulo = {
    id: Date.now(), 
    codigo,
    nombre,
    stock: Number(stock),
    categoria: categoria || 'General',
    stockCritico: 5,
    unidad: 'Unidad'
  };

  listaArticulos.push(nuevoArticulo);
  console.log(" Nuevo artículo guardado en el servidor:", nuevoArticulo);
  
  res.status(201).json({ 
    mensaje: 'Artículo creado exitosamente', 
    articulo: nuevoArticulo 
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(` Servidor Backend corriendo en http://localhost:${PORT}`);
});