import { lazy, Suspense, useEffect, useState, type ReactNode } from "react"
import { Navigate, Outlet, createBrowserRouter } from "react-router-dom"
import PortadaEmpresa from "@/pages/PortadaEmpresa"
import LoginPage from "@/pages/LoginPage"
import AppLayout from "@/layouts/AppLayout"

const DashboardPage = lazy(() => import("@/pages/DashboardPage"))
const CatalogoPage = lazy(() => import("@/pages/CatalogoPage"))
const ComprasPage = lazy(() => import("@/pages/ComprasPage"))
const RecepcionMercanciaPage = lazy(() => import("@/pages/RecepcionMercanciaPage"))
const WorksPage = lazy(() => import("@/pages/WorksPage"))
const WorkDetailPage = lazy(() => import("@/pages/WorkDetailPage"))
const BudgetsPage = lazy(() => import("@/pages/BudgetsPage"))
const ClientesPage = lazy(() => import("@/pages/ClientesPage"))
const CollectionsPage = lazy(() => import("@/pages/CollectionsPage"))
const ReportsPage = lazy(() => import("@/pages/ReportsPage"))
const UsersPage = lazy(() => import("@/pages/UsersPage"))
const SolicitudesPage = lazy(() => import("@/pages/SolicitudesPage"))
const SolicitudesPresupuestoPage = lazy(() => import("@/pages/SolicitudesPresupuestoPage"))
const NotificacionesPage = lazy(() => import("@/pages/NotificacionesPage"))
const MisObrasPage = lazy(() => import("@/pages/MisObrasPage"))

import { useAppStore } from "@/store/useAppStore"
import { api, ApiError, mensajeError } from "@/lib/api"
import { inicioPorRol, permisos, destinoSiDenegado } from "./access"
import type { Rol, Usuario } from "@/types"

function Sesion() {
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState("")
  const [intento, setIntento] = useState(0)
  const setUsuario = useAppStore((s) => s.setUsuario)

  useEffect(() => {
    const controller = new AbortController()
    setCargando(true)
    setError("")

    api<Usuario>("/auth/me", { signal: controller.signal })
      .then((user) => {
        if (!controller.signal.aborted) setUsuario(user)
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        setUsuario(null)
        if (!(err instanceof ApiError && err.status === 401))
          setError(mensajeError(err))
      })
      .finally(() => {
        if (!controller.signal.aborted) setCargando(false)
      })

    return () => controller.abort()
  }, [setUsuario, intento])

  useEffect(() => {
    const expirar = () => setUsuario(null)
    window.addEventListener("fyag:session-expired", expirar)
    return () => window.removeEventListener("fyag:session-expired", expirar)
  }, [setUsuario])

  if (cargando)
    return (
      <div role="status" className="grid min-h-screen place-items-center text-slate-500">
        Comprobando sesión…
      </div>
    )

  if (error)
    return (
      <div className="mx-auto mt-20 max-w-lg space-y-4 p-6">
        <p role="alert" className="fyag-error">{error}</p>
        <button className="fyag-button" onClick={() => setIntento((n) => n + 1)}>
          Reintentar conexión
        </button>
      </div>
    )

  return <Suspense fallback={<div role="status" className="p-10 text-center text-slate-500">Cargando módulo…</div>}><Outlet /></Suspense>
}

function ErrorDeRuta() {
  return (
    <main className="grid min-h-svh place-items-center bg-app p-6 text-foreground">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-6">
        <h1 className="text-xl font-semibold">No se pudo cargar esta pantalla</h1>
        <p className="mt-2 text-muted-foreground">Recarga la página para volver a intentarlo.</p>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <button type="button" onClick={() => window.location.reload()} className="rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground">Recargar página</button>
          <a href="/" className="font-medium underline underline-offset-4">Volver al inicio</a>
        </div>
      </section>
    </main>
  )
}

function RutaProtegida({ roles, children }: { roles?: readonly Rol[]; children: ReactNode }) {
  const usuario = useAppStore((s) => s.usuario)
  const destino = destinoSiDenegado(usuario?.rol ?? null, roles);
  if (destino) return <Navigate to={destino} replace />;
  return <>{children}</>
}

function Inicio() {
  const usuario = useAppStore((s) => s.usuario)
  return <Navigate to={usuario ? inicioPorRol(usuario.rol) : "/login"} replace />
}

export const router = createBrowserRouter([
  { path: "/", element: <PortadaEmpresa /> },
  { path: "/login", element: <Navigate to="/acceso" replace /> },
  {
    element: <Sesion />,
    errorElement: <ErrorDeRuta />,
    children: [
      
      // 2. RUTA DE LOGIN
      { path: "/acceso", element: <LoginPage /> },

      // 3. RUTAS PROTEGIDAS (todo lo que está debajo de /app)
      {
        path: "/app", 
        element: (
          <RutaProtegida>
            <AppLayout />
          </RutaProtegida>
        ),
        children: [
          { index: true, element: <Inicio /> },
          { path: "dashboard", element: <RutaProtegida roles={permisos.dashboard}><DashboardPage /></RutaProtegida> },
          { path: "catalogo", element: <RutaProtegida roles={permisos.catalogo}><CatalogoPage /></RutaProtegida> },
          { path: "compras", element: <RutaProtegida roles={permisos.compras}><ComprasPage /></RutaProtegida> },
          { path: "recepcion", element: <RutaProtegida roles={permisos.recepcion}><RecepcionMercanciaPage /></RutaProtegida> },
          { path: "obras", element: <RutaProtegida roles={permisos.obras}><WorksPage /></RutaProtegida> },
          { path: "mis-obras", element: <RutaProtegida roles={permisos["mis-obras"]}><MisObrasPage /></RutaProtegida> },
          { path: "obras/:id", element: <RutaProtegida roles={[...permisos.obras, "Técnico"]}><WorkDetailPage /></RutaProtegida> },
          { path: "solicitudes", element: <RutaProtegida roles={permisos.solicitudes}><SolicitudesPage /></RutaProtegida> },
          { path: "presupuestos", element: <RutaProtegida roles={permisos.presupuestos}><BudgetsPage /></RutaProtegida> },
          { path: "clientes", element: <RutaProtegida roles={permisos.clientes}><ClientesPage /></RutaProtegida> },
          { path: "facturacion", element: <RutaProtegida roles={permisos.facturacion}><CollectionsPage facturacion /></RutaProtegida> },
          { path: "cobranza", element: <RutaProtegida roles={permisos.cobranza}><CollectionsPage /></RutaProtegida> },
          { path: "reportes", element: <RutaProtegida roles={permisos.reportes}><ReportsPage /></RutaProtegida> },
          { path: "solicitudes-presupuesto", element: <RutaProtegida roles={permisos["solicitudes-presupuesto"]}><SolicitudesPresupuestoPage /></RutaProtegida> },
          { path: "notificaciones", element: <RutaProtegida roles={permisos.notificaciones}><NotificacionesPage /></RutaProtegida> },
          { path: "usuarios", element: <RutaProtegida roles={permisos.usuarios}><UsersPage /></RutaProtegida> },
        ],
      },
      
      // 4. CUALQUIER OTRA RUTA: Redirige al inicio (que a su vez va al login)
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
])
