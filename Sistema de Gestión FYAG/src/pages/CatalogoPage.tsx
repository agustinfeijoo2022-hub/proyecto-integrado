import { useState } from 'react';

interface Articulo {
  id: number;
  codigo: string;
  nombre: string;
  categoria: string;
  stock: number;
  stockCritico: number;
  unidad: string;
}

const articulosPrueba: Articulo[] = [
  { id: 1, codigo: 'REF-001', nombre: 'Compresor Copeland', categoria: 'Refrigeración', stock: 12, stockCritico: 5, unidad: 'Unidad' },
  { id: 2, codigo: 'REF-002', nombre: 'Gas Refrigerante R410A', categoria: 'Insumos', stock: 3, stockCritico: 10, unidad: 'Kg' },
  { id: 3, codigo: 'ELE-045', nombre: 'Cable THHN 12 AWG', categoria: 'Electricidad', stock: 150, stockCritico: 50, unidad: 'Metros' },
  { id: 4, codigo: 'HER-010', nombre: 'Manómetro de Presión', categoria: 'Herramientas', stock: 2, stockCritico: 3, unidad: 'Unidad' },
];

export default function Catalogo() {
  const [busqueda, setBusqueda] = useState('');

    const articulosFiltrados = articulosPrueba.filter(art => 
    art.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    art.codigo.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      
      {/* Encabezado de la pantalla */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Catálogo de Artículos</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow">
          + Nuevo Artículo
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div className="mb-4">
        <input 
          type="text" 
          placeholder="Buscar por nombre o código..." 
          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* Tabla de artículos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="p-4 font-semibold">Código</th>
              <th className="p-4 font-semibold">Nombre</th>
              <th className="p-4 font-semibold">Categoría</th>
              <th className="p-4 font-semibold">Stock Actual</th>
              <th className="p-4 font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody>
            {articulosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  No se encontraron artículos.
                </td>
              </tr>
            ) : (
              articulosFiltrados.map((art) => (
                <tr key={art.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-gray-600 font-mono">{art.codigo}</td>
                  <td className="p-4 font-medium text-gray-800">{art.nombre}</td>
                  <td className="p-4 text-gray-600">{art.categoria}</td>
                  <td className="p-4 text-gray-800 font-bold">
                    {art.stock} <span className="text-sm font-normal text-gray-500">{art.unidad}</span>
                  </td>
                  <td className="p-4">
                    {/* Validación visual de stock crítico */}
                    {art.stock <= art.stockCritico ? (
                      <span className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">
                        ⚠️ Stock Crítico
                      </span>
                    ) : (
                      <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                        ✅ Normal
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}