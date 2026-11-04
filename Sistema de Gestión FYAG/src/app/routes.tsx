import { Navigate, createBrowserRouter } from "react-router";
import AppLayout from "@/layouts/AppLayout";
import BudgetsPage from "@/pages/BudgetsPage";
import CollectionsPage from "@/pages/CollectionsPage";
import DashboardPage from "@/pages/DashboardPage";
import LoginPage from "@/pages/LoginPage";
import MyWorksPage from "@/pages/MyWorksPage";
import ReportsPage from "@/pages/ReportsPage";
import UsersPage from "@/pages/UsersPage";
import WorkDetailPage from "@/pages/WorkDetailPage";
import WorksPage from "@/pages/WorksPage";
import { useAppStore } from "@/store/useAppStore";
import type { Rol } from "@/types";

function ProtectedLayout() {
  const usuario = useAppStore((state) => state.usuario);
  return usuario ? <AppLayout /> : <Navigate to="/login" replace />;
}

function RoleRoute({ roles, children }: { roles: Rol[]; children: React.ReactNode }) {
  const usuario = useAppStore((state) => state.usuario);
  if (!usuario) return <Navigate to="/login" replace />;
  if (!roles.includes(usuario.rol)) return <Navigate to={usuario.rol === "Técnico" ? "/mis-obras" : "/dashboard"} replace />;
  return children;
}

export const router = createBrowserRouter([
  { path: "/login", Component: LoginPage },
  {
    path: "/",
    Component: ProtectedLayout,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <RoleRoute roles={["Gerencia", "Finanzas", "Supervisor"]}><DashboardPage /></RoleRoute> },
      { path: "obras", element: <RoleRoute roles={["Gerencia", "Supervisor"]}><WorksPage /></RoleRoute> },
      { path: "obras/:id", element: <RoleRoute roles={["Gerencia", "Supervisor", "Técnico"]}><WorkDetailPage /></RoleRoute> },
      { path: "presupuestos", element: <RoleRoute roles={["Gerencia", "Finanzas"]}><BudgetsPage /></RoleRoute> },
      { path: "cobranza", element: <RoleRoute roles={["Gerencia", "Finanzas"]}><CollectionsPage /></RoleRoute> },
      { path: "reportes", element: <RoleRoute roles={["Gerencia", "Finanzas"]}><ReportsPage /></RoleRoute> },
      { path: "mis-obras", element: <RoleRoute roles={["Técnico"]}><MyWorksPage /></RoleRoute> },
      { path: "usuarios", element: <RoleRoute roles={["Gerencia"]}><UsersPage /></RoleRoute> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
