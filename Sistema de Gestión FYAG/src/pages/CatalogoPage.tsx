import { useState, useEffect } from 'react';

interface Articulo {
  id: number;
  codigo: string;
  nombre: string;
  categoria?: string;
  stock: number;
  stockCritico?: number;
  unidad?: string;
}

export default function CatalogoPage() {
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);

  const fetchArticulos = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/articulos');
      if (!response.ok) throw new Error('Error al conectar con el servidor');
      const data = await response.json();
      setArticulos(data);
    } catch (error) {
      console.error("Error al cargar artículos:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchArticulos();
  }, []);

  const handleCrearArticulo = async () => {
    const codigo = prompt("Ingresa el código del artículo (ej: HER-001):");
    if (!codigo) return;
    
    const nombre = prompt("Ingresa el nombre del artículo:");
    if (!nombre) return;
    
    const stock = prompt("Ingresa el stock inicial (solo números):");
    if (!stock) return;

    try {
      const response = await fetch('http://localhost:3001/api/articulos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo, nombre, stock })
      });

      if (response.ok) {
        alert("¡Artículo guardado en el servidor exitosamente!");
        fetchArticulos(); 
      }
    } catch (error) {
      alert("Error al guardar el artículo");
    }
  };

    const articulosFiltrados = articulos.filter(art => 
    art.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    art.codigo.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (cargando) {
    return <div className="p-6 text-center text-gray-500">Conectando con el servidor...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Catálogo de Artículos</h1>
        
        <button 
          onClick={handleCrearArticulo}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition-colors">
          + Nuevo Artículo
        </button>
      </div>

      <div className="mb-4">
        <input 
          type="text" 
          placeholder="Buscar por nombre o código..." 
          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

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
                    {art.stock <= (art.stockCritico || 5) ? (
                      <span className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">
                        Stock Crítico
                      </span>
                    ) : (
                      <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                        Normal
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