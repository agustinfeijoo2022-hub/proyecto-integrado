import type { Rol } from "@/types";

export const permisos = {
  dashboard: ["Gerencia", "Finanzas", "Encargado de Bodega"],
  catalogo: ["Gerencia", "Finanzas", "Encargado de Bodega"],
  compras: ["Gerencia", "Finanzas", "Encargado de Bodega"],
  recepcion: ["Encargado de Bodega"],
  obras: ["Gerencia", "Encargado de Bodega"],
  "mis-obras": ["Gerencia", "Técnico"],
  presupuestos: ["Gerencia", "Finanzas"],
  solicitudes: ["Finanzas"], 
  clientes: ["Gerencia", "Finanzas"],
  facturacion: ["Gerencia", "Finanzas"],
  cobranza: ["Gerencia", "Finanzas"],
  reportes: ["Gerencia", "Finanzas", "Encargado de Bodega"], // Agregado aquí
  usuarios: ["Gerencia"],
  "solicitudes-presupuesto": ["Gerencia"],
  notificaciones: ["Gerencia", "Finanzas", "Encargado de Bodega", "Técnico"],
} as const;

export type Modulo = keyof typeof permisos;

export const nombreTareas = (rol?: Rol) => rol === "Técnico" ? "Mis tareas" : "Tareas";

export const inicioPorRol = (rol: Rol) => 
  rol === "Técnico" ? "/app/mis-obras" : "/app/dashboard";

export function puedeAcceder(rol: Rol, modulo: Modulo): boolean {
  return (permisos[modulo] as readonly Rol[]).includes(rol);
}

export function destinoSiDenegado(rol: Rol | null, roles?: readonly Rol[]): string | null {
  if (!rol) return "/login";
  return roles && !roles.includes(rol) ? inicioPorRol(rol) : null;
}