export type Rol = "Gerencia" | "Finanzas" | "Encargado de Bodega" | "Técnico";

export type EstadoPresupuesto = "Borrador" | "Enviado" | "Aprobado" | "Rechazado";
export type EstadoObra = "En proceso" | "Finalizada" | "Suspendida" | "Cancelada" | "Cierre comercial";

export type TipoServicio =
  | "Proyecto" | "Mantención" | "Climatización" | "Proyecto eléctrico"
  | "Emergencia" | "Garantía" | "Venta de repuestos" | "Mejoras";

export interface Cliente {
  id: string;
  razonSocial: string;
  rut: string;
  contacto: string;
  email: string;
}

export interface ItemPresupuesto {
  id: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
}

export type MaterialPrevisto = { codigo: string; cantidad: number };
export type InstruccionesObra = { trabajo: string; alcance: string; plazo?: string | null; materiales_solicitados?: string | null };

export interface PresupuestoDB {
  solicitud_id?: number;
  partidas?: Omit<ItemPresupuesto, "id">[];
  materiales_previstos?: MaterialPrevisto[];
  instrucciones?: InstruccionesObra | null;
  id: number;
  folio: string;
  cliente_id: string;
  cliente_nombre?: string | null;
  fecha: string;
  tipo: string;
  total: number;
  estado: string;
}

export const prioridadesObra = ["Baja", "Normal", "Alta"] as const;
export type PrioridadObra = (typeof prioridadesObra)[number];

export interface ObraDB {
  materiales_previstos?: MaterialPrevisto[];
  instrucciones?: InstruccionesObra | null;
  prioridad?: PrioridadObra;
  id: number;
  codigo: string;
  nombre: string;
  cliente_id: string;
  cliente_nombre?: string | null;
  presupuesto_id: number | null;
  presupuesto_folio?: string | null;
  tipo: string;
  tecnico_id: string | null;
  inicio: string;
  avance: number;
  historial?: { fecha: string; detalle: string }[];
  estado: string;
}

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  tecnicoId?: string;
}
export type CambiosObra = Partial<Pick<ObraDB, "tecnico_id" | "estado" | "avance" | "prioridad">> & {
  materiales?: { codigo: string; cantidad: number }[];
};
