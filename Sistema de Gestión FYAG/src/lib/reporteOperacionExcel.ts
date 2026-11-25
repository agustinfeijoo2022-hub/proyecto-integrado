import { crearExcel } from "./excelGenerator.ts";
import type { CeldaExportable } from "./exportFormat.ts";

export interface ResumenCompras {
  operaciones: number;
  neto: number;
  iva: number;
  total: number;
}

export interface ConteoEstado {
  estado: string;
  cantidad: number;
}

export function crearReporteOperacion(compras: ResumenCompras, obras: ConteoEstado[], presupuestos?: ConteoEstado[]) {
  const filas: CeldaExportable[][] = [
    ["Compras", "Operaciones", compras.operaciones],
    ["Compras", "Monto neto (CLP)", { clp: compras.neto }],
    ["Compras", "IVA (CLP)", { clp: compras.iva }],
    ["Compras", "Total gastado (CLP)", { clp: compras.total }],
    ...obras.map(({ estado, cantidad }) => ["Obras", estado, cantidad]),
    ...(presupuestos ?? []).map(({ estado, cantidad }) => ["Presupuestos", estado, cantidad]),
  ];
  return crearExcel("Reporte de operación", ["Sección", "Indicador", "Valor"], filas);
}
