import { useState } from 'react';

export default function Compras() {
  const [proveedor, setProveedor] = useState('');
  const [monto, setMonto] = useState('');
  const [descuento, setDescuento] = useState('');
  const [total, setTotal] = useState(0);

  const calcularTotal = () => {
    const montoNum = parseFloat(monto) || 0;
    const descNum = parseFloat(descuento) || 0;
    const neto = montoNum - (montoNum * (descNum / 100));
    const iva = neto * 0.19; 
    setTotal(neto + iva);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Registro de Compras</h1>
      
      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
          <input type="text" className="w-full p-2 border rounded" placeholder="Ej: Copeland Chile" onChange={(e) => setProveedor(e.target.value)} />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto Neto ($)</label>
            <input type="number" className="w-full p-2 border rounded" placeholder="100000" onChange={(e) => setMonto(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descuento (%)</label>
            <input type="number" className="w-full p-2 border rounded" placeholder="10" onChange={(e) => setDescuento(e.target.value)} />
          </div>
        </div>

        <button onClick={calcularTotal} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full font-bold">
          Calcular Total e Ingresar al Inventario
        </button>

        {total > 0 && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded text-green-800">
            <p className="font-bold">Total a pagar (con IVA 19%): ${total.toLocaleString('es-CL')}</p>
          </div>
        )}
      </div>
    </div>
  );
}