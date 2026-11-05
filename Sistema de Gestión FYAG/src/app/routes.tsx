import { Navigate, createBrowserRouter } from "react-router";
import AppLayout from "@/layouts/AppLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import CatalogoPage from "@/pages/CatalogoPage";
import ComprasPage from "@/pages/ComprasPage";
import WorksPage from "@/pages/WorksPage";
import BudgetsPage from "@/pages/BudgetsPage";
import CollectionsPage from "@/pages/CollectionsPage";
import ReportsPage from "@/pages/ReportsPage";
import UsersPage from "@/pages/UsersPage";
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
      { path: "obras", element: <WorksPage /> },
      { path: "presupuestos", element: <BudgetsPage /> },
      { path: "cobranza", element: <CollectionsPage /> },
      { path: "reportes", element: <ReportsPage /> },
      { path: "usuarios", element: <UsersPage /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);