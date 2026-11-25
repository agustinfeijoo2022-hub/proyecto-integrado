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

export interface PresupuestoDB {
  id: number;
  folio: string;
  cliente_id: string;
  cliente_nombre?: string | null;
  fecha: string;
  tipo: string;
  total: number;
  estado: string;
}

export interface ObraDB {
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
export type CambiosObra = Partial<Pick<ObraDB, "tecnico_id" | "estado" | "avance">> & {
  materiales?: { codigo: string; cantidad: number }[];
};
