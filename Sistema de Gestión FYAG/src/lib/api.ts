import type { CambiosObra, ObraDB, PresupuestoDB } from "@/types";

export interface Articulo {
  _id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  stock: number;
  stockCritico: number;
  unidad: string;
}

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3001/api").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers, credentials: "include" });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new Error("No se pudo conectar con la API. Comprueba que el servidor esté iniciado.");
  }

  const raw = await response.text();
  let data: unknown;
  try { data = raw ? JSON.parse(raw) : undefined; } catch {
    throw new ApiError("El servidor devolvió una respuesta no válida.", response.status);
  }

  if (!response.ok) {
    const message = data && typeof data === "object" && "error" in data ? String(data.error) : `Error HTTP ${response.status}`;
    if (response.status === 401) window.dispatchEvent(new Event("fyag:session-expired"));
    throw new ApiError(message, response.status);
  }
  return data as T;
}

export const mensajeError = (error: unknown) => error instanceof Error ? error.message : "Ha ocurrido un error inesperado.";

export async function obtenerArticulos(signal?: AbortSignal) {
  return api<Articulo[]>("/articulos", { signal });
}

export interface Compra {
  id: string;
  articuloId: string;
  codigoArticulo: string;
  nombreArticulo: string;
  unidad: string;
  proveedor: string;
  cantidad: number;
  monto: number;
  descuento: number;
  neto: number;
  iva: number;
  total: number;
  fecha: string;
  recibida: boolean | null;
  cantidadRecibida?: number;
}

export async function obtenerCompras(signal?: AbortSignal): Promise<Compra[]> {
  return api<Compra[]>("/compras", { signal });
}

export type { PresupuestoDB } from "@/types";

export async function obtenerPresupuestos(): Promise<PresupuestoDB[]> {
  return api<PresupuestoDB[]>("/presupuestos");
}
export async function crearPresupuesto(data: Omit<PresupuestoDB, "id">) {
  return api<PresupuestoDB>("/presupuestos", { method: "POST", body: JSON.stringify(data) });
}
export async function actualizarEstadoPresupuesto(id: number, estado: string) {
  return api<PresupuestoDB>(`/presupuestos/${id}`, { method: "PATCH", body: JSON.stringify({ estado }) });
}

export async function obtenerObras(): Promise<ObraDB[]> {
  return api<ObraDB[]>("/obras");
}
export async function crearObra(data: Omit<ObraDB, "id" | "avance">) {
  return api<ObraDB>("/obras", { method: "POST", body: JSON.stringify(data) });
}
export async function actualizarObraApi(id: number, cambios: CambiosObra) {
  return api<ObraDB>(`/obras/${id}`, { method: "PATCH", body: JSON.stringify(cambios) });
}