import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { generarPDF } from "@/lib/pdfGenerator";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { api, mensajeError, obtenerObras } from "@/lib/api";
import { currency, shortDate } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import type { ObraDB } from "@/types";

interface Factura {
  id: number;
  folio: string;
  obra_codigo: string;
  obra_nombre: string;
  obra_estado: string;
  cliente_nombre: string;
  emision: string;
  vencimiento: string;
  monto: number;
  pagado: number;
  saldo: number;
  estado: string;
}

function descargarFactura(factura: Factura) {
  const nombre = factura.folio.replace(/[^a-zA-Z0-9_-]/g, "-");
  try {
    generarPDF("Detalle de factura", ["Concepto", "Información"], [
      ["Folio", factura.folio],
      ["Cliente", factura.cliente_nombre],
      ["Obra", `${factura.obra_codigo} · ${factura.obra_nombre}`],
      ["Emisión", shortDate(factura.emision)],
      ["Vencimiento", shortDate(factura.vencimiento)],
      ["Estado de pago", factura.estado],
      ["Monto (CLP)", { clp: factura.monto }],
      ["Pagado (CLP)", { clp: factura.pagado }],
      ["Saldo (CLP)", { clp: factura.saldo }],
    ], `FYAG-${nombre}`);
  } catch {
    toast.error("No se pudo descargar la factura.");
  }
}

export default function CollectionsPage({ facturacion = false }: { facturacion?: boolean }) {
  const puedeRegistrar = useAppStore(state => state.usuario?.rol === "Finanzas");
  const [facturas, setFacturas] = useState<Factura[] | null>(null);
  const [obras, setObras] = useState<ObraDB[]>([]);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [nueva, setNueva] = useState(false);
  const [pago, setPago] = useState<{ factura: Factura; id: string } | null>(null);
  const [estado, setEstado] = useState("");
  useEffect(() => {
    const c = new AbortController();
    api<Factura[]>("/facturas", { signal: c.signal }).then(setFacturas)
      .catch(e => { if (!c.signal.aborted) setError(mensajeError(e)); });
    return () => c.abort();
  }, []);
  const abrirFactura = async () => {
    try {
      const vigentes = (await obtenerObras()).filter(o => !["Cancelada", "Cierre comercial"].includes(o.estado));
      if (!vigentes.length) return toast.error("No hay obras vigentes para facturar.");
      setObras(vigentes);
      setNueva(true);
    } catch(e) { toast.error(mensajeError(e)); }
  };
  const guardar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (guardando || !puedeRegistrar) return;
    setGuardando(true);
    const datos = Object.fromEntries(new FormData(e.currentTarget));
    try {
      if (pago) {
        await api(`/facturas/${pago.factura.id}/pagos`, { method:"POST",body:JSON.stringify({ id:pago.id, monto:Number(datos.monto) }) });
        setPago(null);
        toast.success("Pago registrado.");
      } else {
        await api("/facturas", { method:"POST",body:JSON.stringify({ ...datos, obraId:Number(datos.obraId), monto:Number(datos.monto) }) });
        setNueva(false);
        toast.success("Factura registrada.");
      }
      setFacturas(await api<Factura[]>("/facturas"));
    } catch(e) { toast.error(mensajeError(e)); }
    finally { setGuardando(false); }
  };

  const visibles = facturas?.filter(f => !estado || f.estado === estado);
  const totalPendiente = facturas?.reduce((n,f) => n + f.saldo, 0) ?? 0;
  return <div>
    <PageHeader area="finanzas" title={facturacion ? "Facturación" : "Cobranza"}
      description={facturacion ? "Facturas vinculadas a obras y sus montos registrados." : "Consulta saldos, vencimientos y pagos."}
      actions={facturacion && puedeRegistrar && <Button onClick={abrirFactura}>Nueva factura</Button>} />
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      {!facturacion && facturas && <div className="rounded-xl border border-border bg-card px-5 py-3">
        <p className="text-sm text-muted-foreground">Saldo por cobrar</p>
        <p className="text-2xl font-semibold">{currency(totalPendiente)}</p>
      </div>}
      <div className="w-full max-w-xs"><Field label="Estado"><Select value={estado} onChange={e=>setEstado(e.target.value)}>
        <option value="">Todos</option>{["Pendiente","Vencida","Pago parcial","Pagada"].map(s=><option key={s}>{s}</option>)}
      </Select></Field></div>
    </div>
    {error ? <p role="alert" className="fyag-error">{error}</p> : !visibles ? <p role="status">Cargando facturas…</p> :
      !visibles.length ? <p>No hay facturas para mostrar.</p> :
      <ul className="grid gap-4 lg:grid-cols-2">{visibles.map(f=><li key={f.id} className="min-w-0 rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="break-all text-lg font-semibold">{f.folio}</h2>
            <p className="break-words text-sm">{f.cliente_nombre}</p>
            <p className="break-words text-xs text-muted-foreground">{f.obra_codigo} · {f.obra_nombre}</p>
          </div>
          <StatusBadge status={f.estado} />
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div><dt className="text-muted-foreground">Vencimiento</dt><dd>{shortDate(f.vencimiento)}</dd></div>
          <div><dt className="text-muted-foreground">Monto</dt><dd>{currency(f.monto)}</dd></div>
          <div><dt className="text-muted-foreground">Pagado</dt><dd>{currency(f.pagado)}</dd></div>
          <div><dt className="text-muted-foreground">Saldo</dt><dd className="font-semibold">{currency(f.saldo)}</dd></div>
        </dl>
        {facturacion && <Button type="button" className="mt-4" variant="outline" onClick={() => descargarFactura(f)}>
          <Download className="size-4" aria-hidden="true" /> Descargar PDF
        </Button>}
        {!facturacion && puedeRegistrar && f.saldo>0 && !["Cancelada","Cierre comercial"].includes(f.obra_estado) &&
          <Button className="mt-4" variant="outline" onClick={()=>setPago({factura:f,id:crypto.randomUUID()})}>Registrar pago</Button>}
      </li>)}</ul>}
    <Dialog open={nueva || Boolean(pago)} onOpenChange={open=>{if(!open&&!guardando){setNueva(false);setPago(null);}}}>
      {(nueva || pago) && <DialogContent>
        <DialogTitle>{pago ? "Registrar pago" : "Nueva factura"}</DialogTitle>
        <DialogDescription>{pago ? `${pago.factura.folio} · Saldo ${currency(pago.factura.saldo)}` : "Selecciona una obra y registra los datos de la factura."}</DialogDescription>
        <form className="mt-4 grid gap-3" onSubmit={guardar}>
          {!pago && <>
            <Field label="Obra"><Select name="obraId" required defaultValue=""><option value="" disabled>Selecciona una obra</option>
              {obras.map(o=><option key={o.id} value={o.id}>{o.codigo} · {o.nombre}</option>)}
            </Select></Field>
            <Field label="Folio"><Input name="folio" required maxLength={50} /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Emisión"><Input name="emision" type="date" required /></Field>
              <Field label="Vencimiento"><Input name="vencimiento" type="date" required /></Field>
            </div>
          </>}
          <Field label="Monto (CLP)"><Input name="monto" type="number" min={1} max={pago?.factura.saldo ?? 2147483647} step={1} required /></Field>
          <Button type="submit" disabled={guardando}>{guardando ? "Guardando…" : pago ? "Guardar pago" : "Guardar factura"}</Button>
        </form>
      </DialogContent>}
    </Dialog>
  </div>;
}
