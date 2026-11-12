import type { Rol } from "@/types";
export const permisos = {
  dashboard: ["Gerencia", "Finanzas", "Supervisor"],
  catalogo: ["Gerencia", "Supervisor"],
  compras: ["Gerencia", "Finanzas"],
  obras: ["Gerencia", "Supervisor"],
  "mis-obras": ["Técnico"],
  presupuestos: ["Gerencia", "Finanzas"],
  cobranza: ["Gerencia", "Finanzas"],
  reportes: ["Gerencia", "Finanzas"],
  usuarios: ["Gerencia"],
} satisfies Record<string, readonly Rol[]>;
export type Modulo = keyof typeof permisos;
export const inicioPorRol = (rol: Rol) => rol === "Técnico" ? "/mis-obras" : "/dashboard";
export function puedeAcceder(rol: Rol, modulo: Modulo): boolean {
  return (permisos[modulo] as readonly Rol[]).includes(rol);
}
export function destinoSiDenegado(rol: Rol | null, roles?: readonly Rol[]): string | null {
  if (!rol) return "/login";
  return roles && !roles.includes(rol) ? inicioPorRol(rol) : null;
}
