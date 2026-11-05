import { Navigate, createBrowserRouter } from "react-router";
import AppLayout from "@/layouts/AppLayout";
import DashboardPage from "@/pages/DashboardPage";
import LoginPage from "@/pages/LoginPage";
import CatalogoPage from "@/pages/CatalogoPage"; // Nuestra pantalla
import ComprasPage from "@/pages/ComprasPage"; // Nuestra pantalla
import { useAppStore } from "@/store/useAppStore";

function ProtectedLayout() {
  const usuario = useAppStore((state) => state.usuario);
  return usuario ? <AppLayout /> : <Navigate to="/login" replace />;
}

export const router = createBrowserRouter([
  { path: "/login", Component: LoginPage },
  {
    path: "/",
    Component: ProtectedLayout,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "catalogo", element: <CatalogoPage /> },
      { path: "compras", element: <ComprasPage /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);