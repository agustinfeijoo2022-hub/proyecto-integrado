import { Link, Outlet, useNavigate } from 'react-router-dom';

export default function Layout() {
  const navigate = useNavigate();

  const cerrarSesion = () => {
    localStorage.removeItem('usuario_fyag');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Menú Lateral */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 text-2xl font-bold text-center border-b border-gray-800">
          FYAG System
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/dashboard" className="block p-3 rounded hover:bg-gray-800 transition-colors">
            📊 Dashboard
          </Link>
          <Link to="/catalogo" className="block p-3 rounded hover:bg-gray-800 transition-colors">
            📦 Catálogo
          </Link>
          <Link to="/compras" className="block p-3 rounded hover:bg-gray-800 transition-colors">
            🛒 Compras
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button onClick={cerrarSesion} className="w-full text-left text-red-400 hover:text-red-300 font-semibold">
            🚪 Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Área de contenido principal */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}