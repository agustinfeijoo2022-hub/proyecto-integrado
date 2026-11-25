import { useState } from "react"
import { Link, NavLink, Outlet, useLocation } from "react-router-dom"
import * as Dialog from "@radix-ui/react-dialog"
import {
  ChartNoAxesCombined, Package, ShoppingCart, BriefcaseBusiness,
  ClipboardList, FileText, WalletCards, FileChartColumn, Users,
  Boxes, Menu, X, LogOut, PackageCheck, ChevronRight,
} from "lucide-react"

import { inicioPorRol, permisos } from "@/app/access"
import { useAppStore } from "@/store/useAppStore"
import { api, mensajeError } from "@/lib/api"
import type { Rol } from "@/types"
import GuiaDeUso from "@/components/GuiaDeUso"
import ThemeToggle from "@/components/ThemeToggle"

const enlaces = [
  { path: "dashboard", label: "Dashboard", icon: ChartNoAxesCombined },
  { path: "catalogo", label: "Catálogo", icon: Package },
  { path: "compras", label: "Compras", icon: ShoppingCart },
  { path: "recepcion", label: "Recepción Mercancía", icon: PackageCheck },
  { path: "obras", label: "Obras", icon: BriefcaseBusiness },
  { path: "mis-obras", label: "Mis Tareas", icon: ClipboardList },
  { path: "solicitudes", label: "Solicitudes", icon: FileText },
  { path: "presupuestos", label: "Presupuestos", icon: FileText },
  { path: "clientes", label: "Clientes", icon: Users },
  { path: "facturacion", label: "Facturación", icon: FileText },
  { path: "cobranza", label: "Cobranza", icon: WalletCards },
  { path: "reportes", label: "Reportes", icon: FileChartColumn },
  { path: "usuarios", label: "Usuarios", icon: Users },
] as const

export default function AppLayout() {
  const [open, setOpen] = useState(false)
  const [saliendo, setSaliendo] = useState(false)
  const [error, setError] = useState("")

  const usuario = useAppStore((s) => s.usuario)
  const logout = useAppStore((s) => s.logout)
  const location = useLocation()

  if (!usuario) return null

  const section =
    enlaces.find((e) => (location.pathname === `/app/${e.path}` || location.pathname.startsWith(`/app/${e.path}/`)))?.label || "FYAG"

  async function salir() {
    setSaliendo(true)
    setError("")
    try {
      await api("/auth/logout", { method: "POST" })
      logout()
    } catch (err) {
      setError(mensajeError(err))
    } finally {
      setSaliendo(false)
    }
  }

  const visibles = enlaces.filter(enlace => (permisos[enlace.path] as readonly Rol[]).includes(usuario.rol))
  const nav = (movil = false) => (
    <nav aria-label="Navegación principal" className={movil ? "grid gap-1 p-4" : "flex flex-wrap gap-1"}>
      {visibles.map(({ path, label, icon: Icon }) => (
        <NavLink key={path} to={`/app/${path}`} onClick={() => setOpen(false)}
          className={({ isActive }) => `inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
            isActive ? "bg-emerald-100 text-emerald-950 dark:bg-emerald-900/70 dark:text-emerald-50" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}>
          <Icon className="size-4 shrink-0" aria-hidden="true" />{label}
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div className="fyag-workspace min-h-screen bg-app text-foreground">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-card focus:p-3">Ir al contenido</a>
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-8">
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <button type="button" onClick={() => setOpen(true)} aria-label="Abrir menú" className="rounded-lg p-2 hover:bg-muted lg:hidden"><Menu className="size-5" /></button>
            <Link to={inicioPorRol(usuario.rol)} className="flex shrink-0 items-center gap-2 rounded-lg font-semibold tracking-tight text-foreground">
              <span className="grid size-9 place-items-center rounded-lg bg-emerald-900 text-emerald-50 dark:bg-emerald-300 dark:text-emerald-950"><Boxes className="size-5" aria-hidden="true" /></span>
              <span className="text-lg">FYAG</span>
            </Link>
            <ChevronRight className="hidden size-4 shrink-0 text-muted-foreground sm:block" aria-hidden="true" />
            <span className="hidden truncate text-sm text-muted-foreground sm:block">{section}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{usuario.nombre}</p>
              <p className="text-xs text-muted-foreground">{usuario.rol}</p>
            </div>
            <ThemeToggle />
            <button type="button" disabled={saliendo} onClick={salir} aria-label="Cerrar sesión" title="Cerrar sesión" className="grid size-9 place-items-center rounded-lg border border-border hover:bg-muted"><LogOut className="size-4" aria-hidden="true" /></button>
          </div>
        </div>
        <div className="hidden border-t border-border lg:block">
          <div className="mx-auto max-w-[1440px] px-8 py-2">{nav()}</div>
        </div>
      </header>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/45" />
          <Dialog.Content aria-describedby={undefined} className="fyag-workspace fixed inset-y-0 left-0 z-50 w-[min(20rem,85vw)] overflow-y-auto border-r border-border bg-app text-foreground">
            <div className="flex items-center justify-between gap-3 border-b border-border p-4">
              <div><Dialog.Title className="font-semibold">Menú FYAG</Dialog.Title><p className="text-xs text-muted-foreground">{usuario.rol}</p></div>
              <Dialog.Close className="rounded-lg p-2 hover:bg-muted" aria-label="Cerrar menú"><X className="size-5" /></Dialog.Close>
            </div>
            {nav(true)}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <main tabIndex={-1} id="contenido" className="mx-auto min-w-0 max-w-[1440px] px-4 py-6 sm:px-8 sm:py-9">
        {error && <p role="alert" className="fyag-error mb-4">{error}</p>}
        <GuiaDeUso key={usuario.id} usuarioId={usuario.id} modulos={visibles} />
        <Outlet />
      </main>
    </div>
  )
}
