import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import { paletaExportacion, fechaEmision, textoCelda, type CeldaExportable } from "./exportFormat.ts";

export function generarPDF(titulo: string, columnas: string[], filas: CeldaExportable[][], nombreArchivo: string) {
  const doc = new jsPDF({ orientation: columnas.length > 5 ? "landscape" : "portrait", compress: true });
  doc.setProperties({ title: titulo, author: "FYAG", subject: "Logística e inventario" });

  const ancho = doc.internal.pageSize.getWidth();
  const alto = doc.internal.pageSize.getHeight();
  const margen = 15;
  const anchoContenido = ancho - margen * 2;
  const emitido = fechaEmision();
  const registros = filas.length === 1 ? "1 registro" : `${filas.length} registros`;

  const dibujarEncabezado = () => {
    doc.setFillColor(paletaExportacion.oscuro);
    doc.rect(0, 0, ancho, 33, "F");
    doc.setFillColor(paletaExportacion.principal);
    doc.rect(0, 33, ancho, 1.4, "F");

    doc.setTextColor("#FFFFFF");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("FYAG", margen, 11);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Logística e inventario", margen + 16, 11);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(23);
    doc.text(titulo, margen, 25);

    doc.setTextColor(paletaExportacion.secundario);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Emitido el ${emitido} (Chile)`, margen, 43);
    doc.text(registros, ancho - margen, 43, { align: "right" });
  };

  autoTable(doc, {
    head: [columnas],
    body: filas.map(fila => fila.map(textoCelda)),
    startY: 49,
    margin: { top: 49, left: margen, right: margen, bottom: 20 },
    theme: "plain",
    showHead: "everyPage",
    rowPageBreak: "avoid",
    styles: {
      font: "helvetica", fontSize: 9.5, textColor: paletaExportacion.texto, fillColor: "#FFFFFF",
      cellPadding: { top: 3, bottom: 3, left: 3.5, right: 3.5 },
      valign: "middle", overflow: "linebreak",
    },
    headStyles: { fillColor: paletaExportacion.principal, textColor: "#FFFFFF", fontStyle: "bold" },
    alternateRowStyles: { fillColor: paletaExportacion.fila },
    willDrawPage: dibujarEncabezado,
    didParseCell: ({ cell, section, row, column }) => {
      const valor = filas[row.index]?.[column.index];
      if (section === "body" && (typeof valor === "number" || (valor && typeof valor === "object" && "clp" in valor))) {
        cell.styles.halign = "right";
        if (typeof valor === "object") cell.styles.fontStyle = "bold";
      }
    },
  });

  if (!filas.length) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(paletaExportacion.secundario);
    doc.text("No hay registros para este documento.", margen + 3.5, 68);
  }

  const paginas = doc.getNumberOfPages();
  for (let pagina = 1; pagina <= paginas; pagina++) {
    doc.setPage(pagina);
    doc.setDrawColor(paletaExportacion.linea);
    doc.setLineWidth(0.25);
    doc.line(margen, alto - 15, margen + anchoContenido, alto - 15);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(paletaExportacion.secundario);
    doc.text("FYAG  /  Sistema de gestión", margen, alto - 9);
    doc.text(`Página ${pagina} de ${paginas}`, ancho - margen, alto - 9, { align: "right" });
  }

  doc.save(`${nombreArchivo}.pdf`);
}
