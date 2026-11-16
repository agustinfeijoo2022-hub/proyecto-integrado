import { useEffect, useMemo, useState } from "react";
import { Check, Plus, Search, Send, X } from "lucide-react";
import { toast } from "sonner";
import BudgetForm from "@/components/BudgetForm";
import EmptyState from "@/components/EmptyState";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input, Select } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR, TableWrap } from "@/components/ui/table";
import { clientes } from "@/data/mockData";
import { usePermissions } from "@/hooks/usePermissions";
import { cambiarEstadoPresupuesto, mensajeError, obtenerPresupuestos } from "@/lib/api";
import { estadosPresupuesto } from "@/lib/presupuestos";
import { currency, shortDate } from "@/lib/utils";
import type { EstadoPresupuesto, Presupuesto } from "@/types";

const nombreCliente = (clienteId: string) => clientes.find((c) => c.id === clienteId)?.razonSocial ?? clienteId;

export default function BudgetsPage() {
  const { puedeAprobarPresupuestos } = usePermissions();
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [intento, setIntento] = useState(0);
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState<"" | EstadoPresupuesto>("");
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  useEffect(() => {
    const controlador = new AbortController();
    setCargando(true);
    setErrorCarga("");
    obtenerPresupuestos(controlador.signal)
      .then((lista) => { if (!controlador.signal.aborted) setPresupuestos(lista); })
      .catch((err) => { if (!controlador.signal.aborted) setErrorCarga(mensajeError(err)); })
      .finally(() => { if (!controlador.signal.aborted) setCargando(false); });
    return () => controlador.abort();
  }, [intento]);

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return presupuestos.filter((p) =>
      (!estado || p.estado === estado) &&
      (!texto || p.folio.toLowerCase().includes(texto) || nombreCliente(p.clienteId).toLowerCase().includes(texto)));
  }, [presupuestos, busqueda, estado]);

  const detalle = presupuestos.find((p) => p.id === detalleId) ?? null;

  const cambiarEstado = async (presupuesto: Presupuesto, destino: Exclude<EstadoPresupuesto, "Borrador">) => {
    setProcesandoId(presupuesto.id);
    try {
      const actualizado = await cambiarEstadoPresupuesto(presupuesto.id, destino);
      setPresupuestos((actuales) => actuales.map((p) => (p.id === actualizado.id ? actualizado : p)));
      toast.success(`Presupuesto ${actualizado.folio}: ${actualizado.estado.toLowerCase()}.`);
    } catch (err) {
      toast.error(mensajeError(err));
    } finally {
      setProcesandoId(null);
    }
  };

  const acciones = (p: Presupuesto) => {
    const ocupado = procesandoId === p.id;
    if (p.estado === "Borrador")
      return <Button size="sm" variant="outline" disabled={ocupado} onClick={() => void cambiarEstado(p, "Enviado")}><Send className="size-4" />Enviar</Button>;
    if (p.estado === "Enviado")
      return puedeAprobarPresupuestos
        ? <div className="flex gap-2">
            <Button size="sm" disabled={ocupado} onClick={() => void cambiarEstado(p, "Aprobado")}><Check className="size-4" />Aprobar</Button>
            <Button size="sm" variant="outline" disabled={ocupado} onClick={() => void cambiarEstado(p, "Rechazado")}><X className="size-4" />Rechazar</Button>
          </div>
        : <span className="text-xs text-muted-foreground">Solo Gerencia</span>;
    return <span className="text-xs text-muted-foreground">—</span>;
  };

  return (
    <div>
      <PageHeader
        title="Presupuestos"
        description="Gestión comercial y aprobación de propuestas."
        actions={
          <Dialog open={abierto} onOpenChange={setAbierto}>
            <DialogTrigger asChild><Button><Plus className="size-4" />Nuevo presupuesto</Button></DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogTitle>Nuevo presupuesto</DialogTitle>
              <DialogDescription>Agrega servicios o materiales. Neto, IVA y total se calculan automáticamente.</DialogDescription>
              <BudgetForm onCreated={(nuevo) => { setPresupuestos((actuales) => [nuevo, ...actuales]); setAbierto(false); }} />
            </DialogContent>
          </Dialog>
        }
      />

      {errorCarga && (
        <div className="fyag-error mb-4" role="alert">
          {errorCarga}
          <button type="button" onClick={() => setIntento((i) => i + 1)} className="ml-3 underline">Reintentar</button>
        </div>
      )}

      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar por folio o cliente…" aria-label="Buscar presupuestos" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <Select className="sm:w-44" aria-label="Filtrar por estado" value={estado} onChange={(e) => setEstado(e.target.value as "" | EstadoPresupuesto)}>
              <option value="">Todos los estados</option>
              {estadosPresupuesto.map((value) => <option key={value}>{value}</option>)}
            </Select>
            {!cargando && !errorCarga && <span className="whitespace-nowrap text-xs text-muted-foreground">{visibles.length} de {presupuestos.length}</span>}
          </div>
        </div>

        {cargando ? (
          <p role="status" className="p-10 text-center text-sm text-muted-foreground">Cargando presupuestos…</p>
        ) : errorCarga ? (
          <p className="p-10 text-center text-sm text-muted-foreground">Reintenta la conexión para consultar los presupuestos.</p>
        ) : visibles.length === 0 ? (
          presupuestos.length === 0
            ? <EmptyState title="Aún no hay presupuestos" />
            : <EmptyState />
        ) : (
          <TableWrap>
            <Table className="whitespace-nowrap">
              <THead>
                <TR><TH>Folio</TH><TH>Cliente</TH><TH>Fecha</TH><TH>Servicio</TH><TH>Total</TH><TH>Estado</TH><TH>Acción</TH></TR>
              </THead>
              <TBody>
                {visibles.map((item) => (
                  <TR key={item.id}>
                    <TD><button type="button" className="font-semibold text-primary underline-offset-2 hover:underline" onClick={() => setDetalleId(item.id)}>{item.folio}</button></TD>
                    <TD>{nombreCliente(item.clienteId)}</TD>
                    <TD>{shortDate(item.fecha)}</TD>
                    <TD>{item.tipo}</TD>
                    <TD className="font-semibold">{currency(item.total)}</TD>
                    <TD><StatusBadge status={item.estado} /></TD>
                    <TD>{acciones(item)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </TableWrap>
        )}
      </Card>

      <Dialog open={!!detalle} onOpenChange={(open) => { if (!open) setDetalleId(null); }}>
        <DialogContent className="max-w-2xl">
          {detalle && (
            <>
              <DialogTitle>Presupuesto {detalle.folio}</DialogTitle>
              <DialogDescription>{nombreCliente(detalle.clienteId)} · {detalle.tipo} · {shortDate(detalle.fecha)}</DialogDescription>
              <div className="mt-4"><StatusBadge status={detalle.estado} /></div>
              <TableWrap className="mt-4">
                <Table className="whitespace-nowrap">
                  <THead><TR><TH>Descripción</TH><TH>Cant.</TH><TH>Valor unitario</TH><TH>Subtotal</TH></TR></THead>
                  <TBody>
                    {detalle.items.map((item) => (
                      <TR key={item.id}>
                        <TD>{item.descripcion}</TD>
                        <TD>{item.cantidad}</TD>
                        <TD>{currency(item.precioUnitario)}</TD>
                        <TD>{currency(Math.round(item.cantidad * item.precioUnitario))}</TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </TableWrap>
              <dl className="mt-4 grid gap-2 rounded-lg bg-muted p-4 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Neto</dt><dd>{currency(detalle.neto ?? detalle.total)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">IVA (19%)</dt><dd>{currency(detalle.iva ?? 0)}</dd></div>
                <div className="flex justify-between border-t border-border pt-2 text-base font-bold"><dt>Total</dt><dd className="text-primary">{currency(detalle.total)}</dd></div>
              </dl>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
