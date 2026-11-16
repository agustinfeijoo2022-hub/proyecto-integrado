import type { EstadoPresupuesto, ItemPresupuesto, TipoServicio } from "@/types";

// Archivo sin dependencias del proyecto: así sus reglas se prueban directamente (tests/presupuestos.test.mjs).

// Misma regla que el servidor (server/routes/presupuestos.js): IVA 19 %, importes en pesos enteros.
export const IVA = 0.19;

export const tiposServicio: readonly TipoServicio[] = [
  "Proyecto", "Mantención", "Climatización", "Proyecto eléctrico",
  "Emergencia", "Garantía", "Venta de repuestos", "Mejoras",
];

export const estadosPresupuesto: readonly EstadoPresupuesto[] = ["Borrador", "Enviado", "Aprobado", "Rechazado"];

export function calcularTotales(items: Pick<ItemPresupuesto, "cantidad" | "precioUnitario">[]) {
  const neto = Math.round(items.reduce((suma, item) => suma + item.cantidad * item.precioUnitario, 0));
  const iva = Math.round(neto * IVA);
  return { neto, iva, total: neto + iva };
}

export interface ItemEditable { id: string; descripcion: string; cantidad: string; precioUnitario: string }

export interface ResultadoValidacion {
  cliente?: string;
  // Mensaje por id de ítem.
  items: Record<string, string>;
  valido: boolean;
}

// Convierte el texto de un campo numérico; NaN si está vacío o no es un número.
export const aNumero = (valor: string) => (valor.trim() === "" ? NaN : Number(valor));

export function validarFormulario(clienteId: string, items: ItemEditable[]): ResultadoValidacion {
  const resultado: ResultadoValidacion = { items: {}, valido: true };
  if (!clienteId) resultado.cliente = "Selecciona un cliente.";
  for (const item of items) {
    const cantidad = aNumero(item.cantidad);
    const precio = aNumero(item.precioUnitario);
    if (!item.descripcion.trim()) resultado.items[item.id] = "Ingresa una descripción.";
    else if (item.descripcion.trim().length > 160) resultado.items[item.id] = "La descripción admite hasta 160 caracteres.";
    else if (!Number.isFinite(cantidad) || cantidad <= 0) resultado.items[item.id] = "La cantidad debe ser mayor que 0.";
    else if (!Number.isSafeInteger(precio) || precio <= 0) resultado.items[item.id] = "El valor unitario debe ser un monto entero en pesos, mayor que 0.";
  }
  resultado.valido = !resultado.cliente && Object.keys(resultado.items).length === 0;
  return resultado;
}

// Ítems ya convertidos a número; solo debe llamarse cuando validarFormulario devolvió valido.
export const itemsParaEnviar = (items: ItemEditable[]) =>
  items.map((item) => ({
    descripcion: item.descripcion.trim(),
    cantidad: Number(item.cantidad),
    precioUnitario: Number(item.precioUnitario),
  }));
