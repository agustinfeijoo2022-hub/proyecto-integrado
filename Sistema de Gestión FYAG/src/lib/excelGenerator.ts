import type { Workbook } from "exceljs";
import { textoCelda, type CeldaExportable } from "./exportFormat.ts";

export async function crearExcel(titulo: string, columnas: string[], filas: CeldaExportable[][]) {
  const { default: ExcelJS } = await import("exceljs");
  const libro = new ExcelJS.Workbook();
  libro.creator = "FYAG";
  libro.title = titulo;
  const nombre = titulo.replace(/[\\/*?:\[\]]/g, " ").trim().slice(0, 31) || "Datos";
  const hoja = libro.addWorksheet(nombre, { views: [{ state: "frozen", ySplit: 1, showGridLines: true }] });
  hoja.addRow(columnas).font = { bold: true };
  columnas.forEach((columna, indice) => {
    hoja.getColumn(indice + 1).width = filas.reduce(
      (ancho, fila) => Math.min(46, Math.max(ancho, textoCelda(fila[indice] ?? "").length + 3)),
      Math.max(12, columna.length + 5),
    );
  });
  for (const datos of filas) {
    const fila = hoja.addRow(datos.map(valor => typeof valor === "object" && "clp" in valor ? valor.clp : valor));
    datos.forEach((valor, columna) => {
      const c = fila.getCell(columna + 1);
      if (valor instanceof Date) c.numFmt = "dd-mm-yyyy";
      else if (typeof valor === "object") c.numFmt = '"$"#,##0';
    });
  }
  hoja.autoFilter = { from: { row: 1, column: 1 }, to: { row: filas.length + 1, column: columnas.length } };
  return libro;
}

export async function generarExcel(titulo: string, columnas: string[], filas: CeldaExportable[][], nombreArchivo: string) {
  await descargarExcel(await crearExcel(titulo, columnas, filas), nombreArchivo);
}

export async function descargarExcel(libro: Workbook, nombreArchivo: string) {
  const archivo = await libro.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([archivo], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  }));
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = `${nombreArchivo}.xlsx`;
  enlace.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 10000);
}
