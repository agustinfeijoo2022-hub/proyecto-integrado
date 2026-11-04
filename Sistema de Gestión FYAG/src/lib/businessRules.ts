import type { EstadoObra, Obra, Presupuesto } from "@/types";
import { facturas, pagos } from "@/data/mockData";

export const validarCreacionObra = (presupuesto?: Presupuesto) =>
  presupuesto?.estado === "Aprobado" ? null : "La obra solo puede crearse desde un presupuesto aprobado.";

export function validarTransicionObra(obra: Obra, destino: EstadoObra): string | null {
  if (destino === "Finalizada" && !obra.tecnicoId) return "Asigna un técnico antes de finalizar la obra.";
  if (destino === "Cancelada" && pagos.some((pago) => pago.obraId === obra.id)) return "No se puede cancelar una obra con pagos asociados.";
  if (destino === "Cierre comercial") {
    const pendientes = facturas.some((factura) => factura.obraId === obra.id && factura.estado !== "Pagada");
    if (pendientes) return "No se puede realizar el cierre comercial: existen cuentas por cobrar pendientes.";
    if (obra.estado !== "Finalizada") return "La obra debe estar finalizada antes del cierre comercial.";
  }
  return null;
}
