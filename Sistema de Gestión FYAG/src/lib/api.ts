import type { EstadoPresupuesto, ItemPresupuesto, Presupuesto, TipoServicio } from "@/types"

export interface Articulo {
  _id: string

  codigo: string

  nombre: string

  categoria: string

  stock: number

  stockCritico: number

  unidad: string
}

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3001/api"
).replace(/\/$/, "")

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers)

  if (options.body) headers.set("Content-Type", "application/json")

  let response: Response

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      credentials: "include",
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      throw error

    throw new Error(
      "No se pudo conectar con la API. Comprueba que el servidor esté iniciado.",
    )
  }

  const raw = await response.text()

  let data: unknown

  try {
    data = raw ? JSON.parse(raw) : undefined
  } catch {
    throw new ApiError(
      "El servidor devolvió una respuesta no válida.",
      response.status,
    )
  }

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data
        ? String(data.error)
        : `Error HTTP ${response.status}`

    if (response.status === 401)
      window.dispatchEvent(new Event("fyag:session-expired"))

    throw new ApiError(message, response.status)
  }

  return data as T
}

export const mensajeError = (error: unknown) =>
  error instanceof Error ? error.message : "Ha ocurrido un error inesperado."

export async function obtenerArticulos(signal?: AbortSignal) {
  const data = await api<Articulo[]>("/articulos", { signal })

  if (
    !Array.isArray(data) ||
    data.some(
      (a) =>
        !a ||
        typeof a._id !== "string" ||
        typeof a.codigo !== "string" ||
        typeof a.nombre !== "string" ||
        !Number.isFinite(a.stock) ||
        !Number.isFinite(a.stockCritico),
    )
  ) {
    throw new Error("La API devolvió un catálogo con formato incorrecto.")
  }

  return data
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
}
export async function obtenerCompras(signal?: AbortSignal): Promise<Compra[]> {
  const data = await api<Compra[]>("/compras", { signal });
  if (!Array.isArray(data) || data.some(c => !c || typeof c.id !== "string" || typeof c.proveedor !== "string" || !Number.isFinite(c.total) || !Number.isFinite(c.cantidad) || !Number.isFinite(Date.parse(c.fecha)))) {
    throw new Error("La API devolvió un historial de compras con formato incorrecto.");
  }
  return data;
}

const esPresupuesto = (p: unknown): p is Presupuesto => {
  const x = p as Presupuesto;
  return !!x && typeof x.id === "string" && typeof x.folio === "string" && typeof x.clienteId === "string"
    && typeof x.estado === "string" && typeof x.tipo === "string" && Array.isArray(x.items)
    && Number.isFinite(x.neto) && Number.isFinite(x.iva) && Number.isFinite(x.total)
    && Number.isFinite(Date.parse(x.fecha));
};

export async function obtenerPresupuestos(signal?: AbortSignal): Promise<Presupuesto[]> {
  const data = await api<Presupuesto[]>("/presupuestos", { signal });
  if (!Array.isArray(data) || !data.every(esPresupuesto)) throw new Error("La API devolvió un listado de presupuestos con formato incorrecto.");
  return data;
}

export interface NuevoPresupuesto {
  clienteId: string;
  tipo: TipoServicio;
  estado: Extract<EstadoPresupuesto, "Borrador" | "Enviado">;
  items: Omit<ItemPresupuesto, "id">[];
}

export async function crearPresupuesto(datos: NuevoPresupuesto): Promise<Presupuesto> {
  const data = await api<{ presupuesto: Presupuesto }>("/presupuestos", { method: "POST", body: JSON.stringify(datos) });
  if (!esPresupuesto(data?.presupuesto)) throw new Error("La API devolvió un presupuesto con formato incorrecto.");
  return data.presupuesto;
}

export async function cambiarEstadoPresupuesto(id: string, estado: Exclude<EstadoPresupuesto, "Borrador">): Promise<Presupuesto> {
  const data = await api<{ presupuesto: Presupuesto }>(`/presupuestos/${encodeURIComponent(id)}/estado`, { method: "PATCH", body: JSON.stringify({ estado }) });
  if (!esPresupuesto(data?.presupuesto)) throw new Error("La API devolvió un presupuesto con formato incorrecto.");
  return data.presupuesto;
}
