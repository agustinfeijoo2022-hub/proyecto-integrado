import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import {
  Bell, BriefcaseBusiness, ChartNoAxesCombined, ChevronRight, ClipboardList,
  FileChartColumn, FileText, LogOut, Menu, Search, Snowflake, Users, WalletCards, X,
  Package, ShoppingCart // <-- Nuevos íconos agregados
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import type { Rol } from "@/types";

const nav: { to: string; label: string; icon: typeof ChartNoAxesCombined; roles: Rol[] }[] = [
  { to: "/dashboard", label: "Dashboard", icon: ChartNoAxesCombined, roles: ["Gerencia", "Finanzas", "Supervisor"] },
  
  // Rutas nuevas agregadas aquí:
  { to: "/catalogo", label: "Catálogo", icon: Package, roles: ["Gerencia", "Supervisor"] },
  { to: "/compras", label: "Compras", icon: ShoppingCart, roles: ["Gerencia", "Finanzas"] },
  
  { to: "/obras", label: "Obras", icon: BriefcaseBusiness, roles: ["Gerencia", "Supervisor"] },
  { to: "/mis-obras", label: "Mis obras", icon: ClipboardList, roles: ["Técnico"] },
  { to: "/presupuestos", label: "Presupuestos", icon: FileText, roles: ["Gerencia", "Finanzas"] },
  { to: "/cobranza", label: "Cobranza", icon: WalletCards, roles: ["Gerencia", "Finanzas"] },
  { to: "/reportes", label: "Reportes", icon: FileChartColumn, roles: ["Gerencia", "Finanzas"] },
  { to: "/usuarios", label: "Usuarios", icon: Users, roles: ["Gerencia"] },
];

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const usuario = useAppStore((state) => state.usuario);
  const logout = useAppStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();
  
  if (!usuario) return null;
  
  const section = nav.find((item) => location.pathname.startsWith(item.to))?.label ?? "Detalle";

  const sidebar = <div className="flex h-full flex-col bg-sidebar text-white">
    <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
      <div className="grid size-10 place-items-center rounded-xl bg-white/10"><Snowflake className="size-6" /></div>
      <div><div className="text-lg font-bold tracking-wide">FYAG</div><div className="text-xs text-blue-200">Gestión de obras</div></div>
    </div>
    <nav className="flex-1 space-y-1 p-3 overflow-y-auto" aria-label="Navegación principal">
      {nav.filter((item) => item.roles.includes(usuario.rol)).map((item) => {
        const Icon = item.icon;
        return <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)} className={({ isActive }) => cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-blue-100 transition-colors hover:bg-white/10 hover:text-white", isActive && "bg-white/15 text-white")}>
          <Icon className="size-5" />{item.label}
        </NavLink>;
      })}
    </nav>
    <div className="border-t border-white/10 p-3">
      <Button variant="ghost" className="w-full justify-start text-blue-100 hover:bg-white/10 hover:text-white" onClick={() => { logout(); navigate("/login"); }}><LogOut className="size-4" />Cerrar sesión</Button>
    </div>
  </div>;

  return <div className="min-h-screen bg-app">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">{sidebar}</aside>
    {open && <div className="fixed inset-0 z-50 lg:hidden"><div className="absolute inset-0 bg-slate-950/50" onClick={() => setOpen(false)} /><aside className="relative h-full w-72">{sidebar}<Button variant="ghost" size="icon" className="absolute right-2 top-2 text-white" onClick={() => setOpen(false)}><X /></Button></aside></div>}
    <div className="lg:pl-64">
      <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b border-border bg-white/95 px-4 backdrop-blur sm:px-6">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir navegación"><Menu /></Button>
        <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex"><span>FYAG</span><ChevronRight className="size-4" /><span className="font-medium text-foreground">{section}</span></div>
        <div className="ml-auto hidden w-64 md:block"><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Buscar en FYAG..." aria-label="Buscar" /></div></div>
        <Button variant="ghost" size="icon" aria-label="Notificaciones" className="relative"><Bell className="size-5" /><span className="absolute right-2 top-2 size-2 rounded-full bg-danger" /></Button>
        <div className="flex items-center gap-3 border-l border-border pl-4">
          <div className="grid size-9 place-items-center rounded-full bg-primary text-sm font-bold text-white">{usuario.nombre.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div>
          <div className="hidden sm:block"><div className="text-sm font-semibold">{usuario.nombre}</div><div className="text-xs text-muted-foreground">{usuario.rol}</div></div>
        </div>
      </header>
      <main className="p-4 sm:p-6 lg:p-8"><Outlet /></main>
    </div>
  </div>;
}