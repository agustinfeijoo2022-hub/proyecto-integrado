import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function EnConstruccionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  let titulo = "Módulo";
  if (location.pathname.includes("presupuestos")) titulo = "Presupuestos";
  if (location.pathname.includes("cobranza")) titulo = "Cobranza";
  if (location.pathname.includes("reportes")) titulo = "Reportes";
  if (location.pathname.includes("usuarios")) titulo = "Usuarios";

  return (
    <div className="p-6 flex flex-col items-center justify-center h-[70vh] text-center">
      <div className="bg-blue-100 p-6 rounded-full mb-4">
        <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
      </div>
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Módulo de {titulo}</h1>
      <p className="text-gray-500 max-w-md mb-6">Este módulo se encuentra diseñado en la arquitectura y estará operativo en la Fase 2 de implementación.</p>
      
      <Button onClick={() => navigate('/dashboard')} className="bg-slate-800 hover:bg-slate-900 text-white">
        Volver al Dashboard
      </Button>
    </div>
  );
}