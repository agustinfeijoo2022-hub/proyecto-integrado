// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";
import BudgetsPage from "@/pages/BudgetsPage";
import CatalogoPage from "@/pages/CatalogoPage";
import ReportsPage from "@/pages/ReportsPage";
import BodegaVirtualPage from "@/pages/BodegaVirtualPage";
import SolicitudesPage from "@/pages/SolicitudesPage";
import ObrasPage from "@/pages/ObrasPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ReportsPage />} />
        <Route path="/presupuestos" element={<BudgetsPage />} />
        <Route path="/catalogos" element={<CatalogoPage />} />
        <Route path="/bodega" element={<BodegaVirtualPage />} />
        <Route path="/solicitudes" element={<SolicitudesPage />} />
        <Route path="/obras" element={<ObrasPage />} />
        <Route path="/reportes" element={<ReportsPage />} />
      </Routes>
    </BrowserRouter>
  );
}