export type Rol = "Gerencia" | "Finanzas" | "Supervisor" | "Técnico";
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

export interface Presupuesto {
  id: string;
  folio: string;
  clienteId: string;
  fecha: string;
  estado: EstadoPresupuesto;
  tipo: TipoServicio;
  items: ItemPresupuesto[];
  total: number;
}

export interface Obra {
  id: string;
  codigo: string;
  nombre: string;
  clienteId: string;
  presupuestoId: string;
  tecnicoId?: string;
  estado: EstadoObra;
  tipo: TipoServicio;
  fechaInicio: string;
  fechaFin?: string;
  avance: number;
}

export interface Tecnico {
  id: string;
  nombre: string;
  especialidad: string;
  email: string;
  activo: boolean;
}

export interface Factura {
  id: string;
  folio: string;
  obraId: string;
  clienteId: string;
  fechaEmision: string;
  fechaVencimiento: string;
  monto: number;
  estado: "Pendiente" | "Pagada" | "Vencida";
}

export interface Pago {
  id: string;
  facturaId: string;
  obraId: string;
  fecha: string;
  monto: number;
  metodo: "Transferencia" | "Cheque" | "Tarjeta";
}

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  tecnicoId?: string;
}

export interface Auditoria {
  id: string;
  fecha: string;
  usuario: string;
  accion: string;
  entidad: string;
}
