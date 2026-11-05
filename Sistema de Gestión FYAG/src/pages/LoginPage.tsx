import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // Para mostrar errores en pantalla
  const navigate = useNavigate(); 
  
  const login = useAppStore((state) => state.login);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Limpiamos errores previos

    // Validación de los 4 usuarios de prueba
    if (email === 'gerencia@fyag.cl' && password === 'gerencia123') {
      login("Gerencia");
      navigate('/dashboard');
    } 
    else if (email === 'finanzas@fyag.cl' && password === 'finanzas123') {
      login("Finanzas");
      navigate('/dashboard');
    } 
    else if (email === 'supervisor@fyag.cl' && password === 'supervisor123') {
      login("Supervisor");
      navigate('/dashboard');
    } 
    else if (email === 'tecnico@fyag.cl' && password === 'tecnico123') {
      login("Técnico");
      navigate('/dashboard');
    } 
    else {
      // Si no coincide ninguno, mostramos error
      setError('Correo o contraseña incorrectos. Revisa las credenciales de prueba.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">FYAG</h1>
          <p className="text-gray-500">Sistema de Gestión Logística</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <input 
              type="email" 
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="usuario@fyag.cl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input 
              type="password" 
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Mensaje de error si las credenciales fallan */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded text-sm text-center">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ingresar al Sistema
          </button>
        </form>
      </div>
    </div>
  );
}