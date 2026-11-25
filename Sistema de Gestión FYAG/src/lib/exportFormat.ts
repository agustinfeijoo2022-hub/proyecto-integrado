export const paletaExportacion = {
  oscuro: "#153D30",
  principal: "#196549",
  blanco: "#FFFFFF",
  texto: "#1D302B",
  secundario: "#506358",
  fila: "#F1F6F2",
  linea: "#DCE5DE",
  acento: "#104B36",
  acentoClaro: "#E4F4EB",
} as const;

export type CeldaExportable = string | number | Date | { clp: number };

export const fechaEmision = (fecha = new Date()) =>
  new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Santiago",
  }).format(fecha);

const fechaDocumento = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "medium",
  timeZone: "UTC",
});
const pesos = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});
const numero = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 6 });

export function textoCelda(celda: CeldaExportable): string {
  if (typeof celda === "string") return celda;
  if (typeof celda === "number") return numero.format(celda);
  if (celda instanceof Date) return fechaDocumento.format(celda);
  return pesos.format(celda.clp);
}
