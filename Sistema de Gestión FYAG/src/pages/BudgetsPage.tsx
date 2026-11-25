import { useState, useEffect } from "react";
import { Check, Plus, FileText, Download, X } from "lucide-react";
import { toast } from "sonner";
import BudgetForm from "@/components/BudgetForm";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { usePermissions } from "@/hooks/usePermissions";
import { currency, shortDate } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { generarExcel } from "@/lib/excelGenerator";
import { generarPDF } from "@/lib/pdfGenerator";

export default function BudgetsPage() {
  const [open, setOpen] = useState(false);

  const presupuestos = useAppStore((state) => state.presupuestos);
  const cargando = useAppStore((state) => state.cargandoPresupuestos);
  const fetchPresupuestos = useAppStore((state) => state.fetchPresupuestos);
  const usuario = useAppStore((state) => state.usuario);
  const actualizar = useAppStore((state) => state.actualizarPresupuesto);

  const { puedeAprobarPresupuestos } = usePermissions();

  useEffect(() => {
    fetchPresupuestos();
  }, [fetchPresupuestos]);

  const puedeCrear = usuario?.rol === "Finanzas";
  const puedeExportar = ["Gerencia", "Finanzas"].includes(usuario?.rol ?? "");

  const handleAprobar = async (id: number, folio: string) => {
    const confirmado = window.confirm(`¿Aprobar el presupuesto ${folio}?`);
    if (!confirmado) return;
    if (!await actualizar(id, { estado: "Aprobado" })) return toast.error("No se pudo aprobar el presupuesto.");
    toast.success(`Presupuesto ${folio} aprobado por Gerencia.`);
  };

  const handleRechazar = async (id: number, folio: string) => {
    const confirmado = window.confirm(`¿Rechazar el presupuesto ${folio}? Esta acción no se puede deshacer.`);
    if (!confirmado) return;
    if (!await actualizar(id, { estado: "Rechazado" })) return toast.error("No se pudo rechazar el presupuesto.");
    toast.success(`Presupuesto ${folio} ha sido rechazado.`);
  };

  const exportar = async (formato: "pdf" | "excel") => {
    const columnas = ["Folio", "Cliente", "Fecha", "Servicio", "Total", "Estado"];
    const filas = presupuestos.map((item) => {
      return [
        item.folio,
        item.cliente_nombre || item.cliente_id,
        item.fecha ? new Date(item.fecha.slice(0, 10)) : "—",
        item.tipo,
        { clp: Number(item.total) },
        item.estado,
      ];
    });
    try {
      if (formato === "pdf") generarPDF("Reporte de presupuestos", columnas, filas, "presupuestos_FYAG");
      else await generarExcel("Reporte de presupuestos", columnas, filas, "presupuestos_FYAG");
    } catch {
      toast.error("No se pudo exportar el reporte de presupuestos.");
    }
  };

  return (
    <div>
      <PageHeader area="finanzas"
        title="Presupuestos"
        description="Gestión comercial y aprobación de propuestas."
        actions={
          <div className="flex items-center gap-2">
            {puedeExportar && (
              <>
                <Button variant="outline" onClick={() => void exportar("pdf")}>
                  <Download className="size-4" /> PDF
                </Button>
                <Button variant="outline" onClick={() => void exportar("excel")}>
                  <Download className="size-4" /> Excel
                </Button>
              </>
            )}

            {puedeCrear && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="size-4" /> Nuevo presupuesto
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogTitle>Nuevo presupuesto</DialogTitle>
                  <DialogDescription>Agrega servicios o materiales. El total se calcula automáticamente.</DialogDescription>
                  <BudgetForm onDone={() => { setOpen(false); fetchPresupuestos(); }} />
                </DialogContent>
              </Dialog>
            )}
          </div>
        }
      />

      <Card className="overflow-hidden">
        {cargando ? (
          <div className="p-12 text-center text-muted-foreground">Cargando presupuestos desde la base de datos...</div>
        ) : presupuestos.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
            <FileText className="size-10 text-muted-foreground" />
            <p className="font-medium">No hay presupuestos registrados en PostgreSQL</p>
            <p className="text-sm text-muted-foreground">
              {puedeCrear ? "Crea el primero con el botón de arriba." : "Cuando se cree uno, aparecerá aquí."}
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <Table>
              <THead>
                <TR>
                  <TH className="whitespace-nowrap">Folio</TH>
                  <TH className="whitespace-nowrap">Cliente</TH>
                  <TH className="whitespace-nowrap">Fecha</TH>
                  <TH className="whitespace-nowrap">Servicio</TH>
                  <TH className="whitespace-nowrap">Total</TH>
                  <TH className="whitespace-nowrap">Estado</TH>
                  <TH className="whitespace-nowrap text-right">Acción</TH>
                </TR>
              </THead>
              <TBody>
                {presupuestos.map((item) => {
                  // Buscamos el cliente aceptando el ID con o sin la letra "c"

                  return (
                    <TR key={item.id}>
                      <TD className="font-semibold text-primary whitespace-nowrap">{item.folio}</TD>
                      <TD className="min-w-[150px]">{item.cliente_nombre ?? item.cliente_id}</TD>
                      <TD className="whitespace-nowrap">{shortDate(item.fecha)}</TD>
                      <TD className="whitespace-nowrap">{item.tipo}</TD>
                      <TD className="font-semibold whitespace-nowrap">{currency(item.total)}</TD>
                      <TD><StatusBadge status={item.estado} /></TD>
                      <TD className="text-right whitespace-nowrap">
                        {puedeAprobarPresupuestos && item.estado === "Enviado" ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" onClick={() => handleAprobar(item.id, item.folio)}>
                              <Check className="size-4 mr-1" /> Aprobar
                            </Button>
                            <Button size="sm" variant="outline" className="text-danger hover:bg-red-50 hover:text-red-700 border-red-200" onClick={() => handleRechazar(item.id, item.folio)}>
                              <X className="size-4 mr-1" /> Rechazar
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {item.estado === "Enviado" ? "Solo Gerencia" : item.estado}
                          </span>
                        )}
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}