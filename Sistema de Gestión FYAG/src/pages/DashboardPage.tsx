export default function Dashboard() {
  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Panel de Control (KPIs)</h1>
      
      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <p className="text-gray-500 text-sm font-semibold">Total Artículos</p>
          <p className="text-3xl font-bold text-gray-800">1.250</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
          <p className="text-gray-500 text-sm font-semibold">Stock Crítico</p>
          <p className="text-3xl font-bold text-red-600">8</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <p className="text-gray-500 text-sm font-semibold">Compras del Mes</p>
          <p className="text-3xl font-bold text-gray-800">$2.500.000</p>
        </div>
      </div>

      {/* Alertas */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-gray-800 mb-4">⚠️ Alertas de Stock Crítico</h2>
        <ul className="space-y-3">
          <li className="p-3 bg-red-50 text-red-700 rounded border border-red-100">
            Compresor Copeland - Quedan 2 unidades (Mínimo: 5)
          </li>
          <li className="p-3 bg-red-50 text-red-700 rounded border border-red-100">
            Gas Refrigerante R410A - Quedan 3 kg (Mínimo: 10)
          </li>
        </ul>
      </div>
    </div>
  );
}