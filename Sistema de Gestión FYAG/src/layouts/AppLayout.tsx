import { useState } from "react"

import { NavLink, Outlet, useLocation } from "react-router-dom"

import * as Dialog from "@radix-ui/react-dialog"

import {
  ChartNoAxesCombined,
  Package,
  ShoppingCart,
  BriefcaseBusiness,
  ClipboardList,
  FileText,
  WalletCards,
  FileChartColumn,
  Users,
  Snowflake,
  Menu,
  X,
  LogOut,
} from "lucide-react"

import { permisos } from "@/app/access"

import { useAppStore } from "@/store/useAppStore"

import { api, mensajeError } from "@/lib/api"

import type { Rol } from "@/types"

const enlaces = [
  { path: "dashboard", label: "Dashboard", icon: ChartNoAxesCombined },

  { path: "catalogo", label: "Catálogo", icon: Package },

  { path: "compras", label: "Compras", icon: ShoppingCart },

  { path: "obras", label: "Obras", icon: BriefcaseBusiness },

  { path: "mis-obras", label: "Mis Tareas", icon: ClipboardList },

  { path: "presupuestos", label: "Presupuestos", icon: FileText },

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
    enlaces.find((e) => (location.pathname === `/${e.path}` || location.pathname.startsWith(`/${e.path}/`)))?.label || "FYAG"

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

  const sidebar = (
    <div className="flex h-full flex-col bg-slate-950 text-white">
      <div className="flex h-24 shrink-0 items-center gap-3 border-b border-white/10 px-6">
        <span className="grid size-11 place-items-center rounded-2xl bg-blue-500/15 text-blue-300">
          <Snowflake />
        </span>
        <div>
          <p className="text-xl font-bold tracking-widest">FYAG</p>
          <p className="text-xs text-slate-400">Logística e inventario</p>
        </div>
      </div>
      <p className="px-6 pb-3 pt-7 text-[10px] font-bold uppercase tracking-[.2em] text-slate-500">
        Espacio de trabajo
      </p>
      <nav
        aria-label="Navegación principal"
        className="flex-1 space-y-1 overflow-y-auto px-3"
      >
        {enlaces
          .filter((e) =>
            (permisos[e.path] as readonly Rol[]).includes(usuario.rol),
          )
          .map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={`/${path}`}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-900 text-white shadow-md"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <Icon className="size-5" />
              {label}
            </NavLink>
          ))}
      </nav>
      <div className="m-4 rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs text-slate-400">Sesión activa</p>
        <p className="mt-1 text-sm font-medium">{usuario.rol}</p>
        <button
          disabled={saliendo}
          onClick={salir}
          className="mt-4 flex items-center gap-2 text-sm text-slate-300 hover:text-white"
        >
          <LogOut className="size-4" />
          {saliendo ? "Cerrando…" : "Cerrar sesión"}
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        {sidebar}
      </aside>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/60" />
          <Dialog.Content
            aria-describedby={undefined}
            className="fixed inset-y-0 left-0 z-50 w-[min(20rem,90vw)]"
          >
            <Dialog.Title className="sr-only">Menú principal</Dialog.Title>
            {sidebar}
            <Dialog.Close
              className="absolute right-3 top-3 rounded p-2 text-white"
              aria-label="Cerrar menú"
            >
              <X className="size-4" />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <div className="min-w-0 lg:pl-64">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              aria-label="Abrir menú"
              className="rounded-lg p-2 lg:hidden"
            >
              <Menu />
            </button>
            <span className="text-sm text-slate-400">
              FYAG <span className="mx-2">/</span>
              <strong className="font-semibold text-slate-800">
                {section}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{usuario.nombre}</p>
              <p className="text-xs text-slate-500">{usuario.rol}</p>
            </div>
            <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-sm font-bold text-blue-900">
              {usuario.nombre
                .trim()
                .split(/\s+/)
                .map((p) => p[0])
                .join("")
                .slice(0, 2)}
            </span>
          </div>
        </header>
        <main className="p-4 sm:p-8 lg:p-10">
          {error && (
            <p role="alert" className="fyag-error mb-4">
              {error}
            </p>
          )}
          {["/obras", "/presupuestos", "/cobranza", "/reportes", "/usuarios"].some(path => location.pathname === path || location.pathname.startsWith(`${path}/`)) && <p role="note" className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">Módulo de demostración: usa datos locales del MVP. Sus cambios no se guardan en el backend.</p>}
          <Outlet />
        </main>
      </div>
    </div>
  )
}
