import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { api, mensajeError } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import type { Cliente } from "@/types";

const nuevo: Cliente = { id: "", razonSocial: "", rut: "", contacto: "", email: "" };

export default function ClientesPage() {
  const editar = useAppStore(state => state.usuario?.rol === "Finanzas");
  const [clientes, setClientes] = useState<Cliente[] | null>(null);
  const [form, setForm] = useState<Cliente | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  useEffect(() => {
    const c = new AbortController();
    api<Cliente[]>("/clientes", { signal: c.signal }).then(setClientes)
      .catch(e => { if (!c.signal.aborted) setError(mensajeError(e)); });
    return () => c.abort();
  }, []);
  const guardar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form || guardando || !editar) return;
    setGuardando(true);
    try {
      const dato = await api<Cliente>(form.id ? `/clientes/${form.id}` : "/clientes", { method: form.id ? "PATCH" : "POST", body: JSON.stringify(form) });
      setClientes(actual => [...(actual ?? []).filter(c => c.id !== dato.id), dato].sort((a,b) => a.razonSocial.localeCompare(b.razonSocial,"es")));
      setForm(null);
      toast.success("Cliente guardado.");
    } catch(e) { toast.error(mensajeError(e)); }
    finally { setGuardando(false); }
  };
  const visibles = clientes?.filter(c => `${c.razonSocial} ${c.rut} ${c.contacto}`.toLowerCase().includes(busqueda.trim().toLowerCase()));
  return <div>
    <PageHeader area="finanzas" title="Clientes" description="Consulta las empresas asociadas a presupuestos y obras."
      actions={editar && <Button disabled={!clientes} onClick={() => setForm(nuevo)}>Nuevo cliente</Button>} />
    <div className="mb-5 max-w-md"><Field label="Buscar cliente"><Input value={busqueda} onChange={e => setBusqueda(e.target.value)} /></Field></div>
    {error ? <p role="alert" className="fyag-error">{error}</p> : !visibles ? <p role="status">Cargando clientes…</p> :
      !visibles.length ? <p>No hay clientes para mostrar.</p> :
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{visibles.map(c => <li key={c.id} className="min-w-0 rounded-2xl border border-border bg-card p-5">
        <h2 className="break-words text-lg font-semibold">{c.razonSocial}</h2>
        {c.rut && <p className="text-sm text-muted-foreground">RUT {c.rut}</p>}
        {c.contacto && <p className="mt-2 break-words text-sm">{c.contacto}</p>}
        {c.email && <p className="break-all text-sm text-muted-foreground">{c.email}</p>}
        {editar && <Button className="mt-4" variant="outline" onClick={() => setForm(c)}>Editar cliente</Button>}
      </li>)}</ul>}
    <Dialog open={Boolean(form)} onOpenChange={abierto => { if (!abierto && !guardando) setForm(null); }}>
      {form && <DialogContent><DialogTitle>{form.id ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
        <DialogDescription>La razón social se muestra en los presupuestos y las obras.</DialogDescription>
        <form onSubmit={guardar} className="mt-4 grid gap-3">
          {([["razonSocial","Razón social",160],["rut","RUT",24],["contacto","Contacto",160],["email","Correo",254]] as const).map(([campo,etiqueta,max]) =>
            <Field key={campo} label={etiqueta}><Input type={campo==="email"?"email":"text"} value={form[campo]} required={campo==="razonSocial"}
              maxLength={max} disabled={guardando} onChange={e => setForm({ ...form, [campo]: e.target.value })} /></Field>)}
          <Button type="submit" disabled={guardando}>Guardar cliente</Button>
        </form>
      </DialogContent>}
    </Dialog>
  </div>;
}
