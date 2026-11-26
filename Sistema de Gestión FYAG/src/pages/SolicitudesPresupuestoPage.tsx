import { PuntoGuia } from "@/components/GuiaDeUso";
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ClipboardList, Package, Send } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { api, mensajeError } from "@/lib/api";
import type { Cliente } from "@/types";

export default function SolicitudesPresupuestoPage() {
  return (
    <div>
      <PageHeader area="finanzas" title="Solicitudes de presupuesto" />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,23rem)]">
        <FormularioSolicitud />
        <aside className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="grid size-12 place-items-center rounded-xl bg-muted text-primary">
            <Package className="size-6" aria-hidden="true" />
          </div>
          <PuntoGuia id="stock-cotizar" />
          <h2 className="mt-4 text-lg font-semibold">Consultar existencias</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Revisa los códigos y las cantidades disponibles mientras completas la solicitud.
          </p>
          <Link to="/app/catalogo" target="_blank" rel="noopener"
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-primary hover:bg-muted">
            Abrir catálogo en otra pestaña <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </aside>
      </div>
    </div>
  );
}

function FormularioSolicitud() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargandoClientes, setCargandoClientes] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [estado, setEstado] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    api<Cliente[]>("/clientes", { signal: controller.signal })
      .then(setClientes)
      .catch(error => { if (!controller.signal.aborted) setError(mensajeError(error)); })
      .finally(() => { if (!controller.signal.aborted) setCargandoClientes(false); });
    return () => controller.abort();
  }, []);

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (enviando) return;
    const formulario = event.currentTarget;
    setEnviando(true);
    setError("");
    setEstado("");
    try {
      const datos = Object.fromEntries(new FormData(formulario));
      await api("/notificaciones/cotizaciones", { method: "POST", body: JSON.stringify(datos) });
      formulario.reset();
      setEstado("Solicitud enviada a Finanzas.");
    } catch (error) { setError(mensajeError(error)); }
    finally { setEnviando(false); }
  }

  return <Card>
    <CardContent className="p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-primary"><ClipboardList className="size-5" aria-hidden="true" /></span>
        <h2 className="text-xl font-semibold">Antecedentes del cliente</h2>
      </div>
      <PuntoGuia id="formulario-cotizar" />
      <form onSubmit={enviar} className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Cliente">
          <Select name="clienteId" required disabled={cargandoClientes || enviando} defaultValue="">
            <option value="">{cargandoClientes ? "Cargando clientes…" : "Seleccionar cliente"}</option>
            {clientes.map(cliente => <option key={cliente.id} value={cliente.id}>{cliente.razonSocial}</option>)}
          </Select>
        </Field>
        <Field label="Trabajo solicitado">
          <Input name="asunto" required minLength={3} maxLength={140} placeholder="Ej. Mantención de cámara frigorífica" disabled={enviando} />
        </Field>
        <Field label="Alcance y lugar del trabajo" className="sm:col-span-2">
          <textarea name="alcance" required minLength={10} maxLength={2500} rows={4} disabled={enviando}
            className="fyag-input" placeholder="Indica dónde se hará, qué pidió el cliente y qué debe incluir la cotización." />
        </Field>
        <Field label="Materiales y cantidades (opcional)">
          <textarea name="materiales" maxLength={1500} rows={3} disabled={enviando}
            className="fyag-input" placeholder="Incluye códigos y unidades si los tienes." />
        </Field>
        <Field label="Fecha solicitada (opcional)" className="self-start">
          <Input type="date" name="plazo" disabled={enviando} />
        </Field>
        {error && <p role="alert" className="fyag-error sm:col-span-2">{error}</p>}
        {estado && <p role="status" className="font-medium text-primary sm:col-span-2">{estado}</p>}
        <div className="sm:col-span-2">
          <Button type="submit" disabled={enviando || !clientes.length}>
            <Send className="size-4" aria-hidden="true" /> {enviando ? "Enviando…" : "Enviar a Finanzas"}
          </Button>
        </div>
      </form>
    </CardContent>
  </Card>;
}

