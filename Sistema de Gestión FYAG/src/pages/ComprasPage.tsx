import { useEffect, useState, type FormEvent } from "react";
import { ShoppingCart, Search, CheckCircle2, Truck, ReceiptText } from "lucide-react";
import { api, obtenerArticulos, obtenerCompras, mensajeError, type Articulo, type Compra } from "@/lib/api";
import { Link } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAppStore } from "@/store/useAppStore";

const vacio = { codigoArticulo: "", cantidad: "", proveedor: "", monto: "", descuento: "0" };
const pesos = (v: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(v);

export default function ComprasPage() {
  const rol = useAppStore(state => state.usuario?.rol);
  const puedeRegistrar = rol === "Finanzas";

  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [form, setForm] = useState(vacio);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorCarga, setErrorCarga] = useState("");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [intento, setIntento] = useState(0);
  const [abierto, setAbierto] = useState(false);
  const [estado, setEstado] = useState("todos");
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    const c = new AbortController(); setCargando(true); setErrorCarga("");
    Promise.all([obtenerArticulos(c.signal), obtenerCompras(c.signal)])
      .then(([items, movimientos]) => { if (!c.signal.aborted) { setArticulos(items); setCompras(movimientos); } })
      .catch(err => { if (!c.signal.aborted) setErrorCarga(mensajeError(err)); })
      .finally(() => { if (!c.signal.aborted) setCargando(false); });
    return () => c.abort();
  }, [intento]);

  const monto = Number(form.monto), descuento = Number(form.descuento || 0);
  const resumenValido = Number.isFinite(monto) && monto >= 0 && Number.isFinite(descuento) && descuento >= 0 && descuento <= 100;
  const neto = resumenValido ? Math.round(monto * (1 - descuento / 100)) : 0;
  const iva = Math.round(neto * .19), total = neto + iva;

  const filtradas = compras.filter(c =>
    (estado === "todos" || (estado === "recibidas" ? c.recibida === true : estado === "pendientes" ? c.recibida === false : c.recibida === null)) &&
    `${c.proveedor} ${c.nombreArticulo} ${c.codigoArticulo}`.toLocaleLowerCase("es").includes(busqueda.trim().toLocaleLowerCase("es")));

  async function registrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (guardando || !puedeRegistrar) return;
    setMensaje(""); setError("");
    const cantidad = Number(form.cantidad);
    if (!form.codigoArticulo || !form.proveedor.trim() || !Number.isFinite(cantidad) || cantidad <= 0 || !form.monto || !resumenValido || !Number.isSafeInteger(monto)) {
      setError("Revisa el proveedor, artículo, cantidad, monto en pesos enteros y descuento entre 0 y 100."); return;
    }
    setGuardando(true);
    try {
      const data = await api<{ articulo: Articulo; total: number; compra: Compra }>("/compras", { method: "POST", body: JSON.stringify({ codigoArticulo: form.codigoArticulo, cantidad, proveedor: form.proveedor.trim(), monto, descuento }) });
      setArticulos(prev => prev.map(a => a._id === data.articulo._id ? data.articulo : a));
      setCompras(prev => [data.compra, ...prev].slice(0, 50));
      setMensaje(`Compra registrada por ${pesos(data.total)}. Pendiente de recepción en bodega.`);
      setForm(vacio);
      setEstado("todos");
      setBusqueda("");
      setAbierto(false);
    } catch (err) { setError(mensajeError(err)); }
    finally { setGuardando(false); }
  }

  return <div className="fyag-page">
    <PageHeader title="Compras" description="Revisa los movimientos de abastecimiento y su estado de recepción."
      actions={rol === "Encargado de Bodega" && (
        <Link to="/app/recepcion" className="fyag-secondary hover:bg-muted"><Truck className="size-4" /> Ir a recepción</Link>
      )} />
    {mensaje && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-200">{mensaje}</p>}
    {errorCarga && <div className="fyag-error" role="alert">{errorCarga}<button onClick={() => setIntento(i => i + 1)} className="ml-3 underline">Reintentar</button></div>}

    {puedeRegistrar && <Dialog open={abierto} onOpenChange={open => { if (!guardando) { setAbierto(open); setError(""); } }}>
      <DialogTrigger asChild><button type="button" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-dark"><ShoppingCart className="size-4" /> Nueva compra</button></DialogTrigger>
      <DialogContent className="max-h-[90dvh] w-[min(94vw,850px)] max-w-none overflow-y-auto">
        <DialogTitle>Registrar compra</DialogTitle>
        <DialogDescription>Ingresa el proveedor, el artículo y el monto neto.</DialogDescription>
        <form onSubmit={registrar} className="grid items-start gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(180px,240px)]">
      <section className="min-w-0 rounded-2xl border border-border p-4">
        <fieldset disabled={guardando || cargando || !!errorCarga} className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="fyag-label" htmlFor="proveedor">Proveedor</label><input id="proveedor" required maxLength={160} className="fyag-input" placeholder="Razón social del proveedor" value={form.proveedor} onChange={e => setForm({ ...form, proveedor: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="fyag-label" htmlFor="producto">Artículo</label><select id="producto" required className="fyag-input" value={form.codigoArticulo} onChange={e => setForm({ ...form, codigoArticulo: e.target.value })}><option value="">{cargando ? "Cargando artículos…" : "Selecciona un artículo"}</option>{articulos.map(a => <option key={a._id} value={a.codigo}>{a.nombre} · {a.codigo} · stock: {a.stock}</option>)}</select>{!cargando && !errorCarga && !articulos.length && <p className="mt-2 text-sm text-slate-500">No hay artículos. Solicita a Bodega que cree uno.</p>}</div>
          <div><label className="fyag-label" htmlFor="cantidad">Cantidad</label><input id="cantidad" type="number" required min="0.000001" max="1000000000000" step="any" className="fyag-input" value={form.cantidad} onChange={e => setForm({ ...form, cantidad: e.target.value })} /></div>
          <div><label className="fyag-label" htmlFor="monto">Monto neto (CLP)</label><input id="monto" type="number" required min="0" max="1000000000000" step="1" className="fyag-input" value={form.monto} onChange={e => setForm({ ...form, monto: e.target.value })} /></div>
          <div><label className="fyag-label" htmlFor="descuento">Descuento (%)</label><input id="descuento" type="number" min="0" max="100" step="any" className="fyag-input" value={form.descuento} onChange={e => setForm({ ...form, descuento: e.target.value })} /></div>
        </fieldset>{error && <p role="alert" className="fyag-error mt-5">{error}</p>}
      </section>

      <aside className="rounded-2xl bg-muted p-4 dark:bg-muted">
        <h2 className="text-lg font-bold">Resumen de compra</h2>
        <p className="fyag-subtitle">Importes calculados automáticamente.</p>
        <dl className="mt-6 space-y-4 text-sm">
          <div className="flex justify-between"><dt className="text-slate-500">Neto con descuento</dt><dd>{pesos(neto)}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">IVA (19%)</dt><dd>{pesos(iva)}</dd></div>
          <div className="flex justify-between border-t pt-5 text-lg font-bold"><dt>Total</dt><dd className="text-primary">{pesos(total)}</dd></div>
        </dl>
        <button disabled={guardando || cargando || !!errorCarga || !articulos.length} className="fyag-button mt-6 w-full">{guardando ? "Registrando…" : "Registrar compra"}</button>
        <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">
          La compra quedará pendiente hasta que Bodega confirme la recepción de los productos.
        </p>
      </aside>
        </form>
      </DialogContent>
    </Dialog>}

    <section aria-labelledby="movimientos">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="movimientos" className="text-2xl font-semibold">Últimos movimientos</h2>
          <p className="mt-1 text-sm text-muted-foreground">Hasta 50 compras, de la más reciente a la más antigua.</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <label className="text-sm font-medium">
            Buscar compras
            <span className="relative mt-1 block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input className="fyag-input pl-9" placeholder="Proveedor, producto o código" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            </span>
          </label>
          <label className="text-sm font-medium">
            Estado
            <select className="fyag-input mt-1" value={estado} onChange={e => setEstado(e.target.value)}>
              <option value="todos">Todos</option>
              <option value="pendientes">Pendientes de recepción</option>
              <option value="recibidas">Recibidas</option>
              <option value="sin-registro">Recepción sin registro</option>
            </select>
          </label>
        </div>
      </div>
      {cargando ? <p role="status" className="p-6 text-muted-foreground">Cargando movimientos…</p>
        : errorCarga ? <p className="p-6 text-muted-foreground">Reintenta la conexión para consultar el historial.</p>
        : !filtradas.length ? <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">{compras.length ? "No hay compras que coincidan con los filtros." : "Todavía no hay compras registradas."}</p>
        : <ol className="ml-3 space-y-4 border-l border-border pl-6 dark:border-border sm:ml-5 sm:pl-8">
          {filtradas.map(c => {
            const fecha = new Date(c.fecha);
            return <li key={c.id} className="relative min-w-0 rounded-2xl border border-border bg-card px-4 py-4 sm:px-6">
              <span className="absolute -left-[2.18rem] top-5 grid size-5 place-items-center rounded-full bg-primary-light text-primary-dark ring-4 ring-background dark:bg-primary-light dark:text-primary-dark sm:-left-[2.68rem]"><ReceiptText className="size-3" aria-hidden="true" /></span>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <time dateTime={c.fecha} className="text-xs font-medium text-muted-foreground">{fecha.toLocaleString("es-CL", { dateStyle: "medium", timeStyle: "short" })}</time>
                {c.recibida ? <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-1 text-xs font-medium text-teal-900 dark:bg-teal-900/60 dark:text-teal-200"><CheckCircle2 className="size-3" /> Recibida{c.cantidadRecibida !== undefined && ` · ${c.cantidadRecibida.toLocaleString("es-CL")} ${c.unidad}`}</span>
                  : <span className="rounded-full bg-primary-light px-2.5 py-1 text-xs font-medium text-primary-dark dark:bg-primary-light dark:text-primary-dark">{c.recibida === null ? "Recepción sin registro" : "Pendiente de recepción"}</span>}
              </div>
              <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="break-words text-lg font-semibold">{c.nombreArticulo}</h3>
                  <p className="mt-1 break-words text-sm text-muted-foreground">{c.proveedor} · <span className="font-mono text-xs">{c.codigoArticulo}</span></p>
                </div>
                <div className="sm:text-right">
                  <p className="text-lg font-semibold tabular-nums">{pesos(c.total)}</p>
                  <p className="text-xs text-muted-foreground">{c.cantidad.toLocaleString("es-CL")} {c.unidad}</p>
                </div>
              </div>
            </li>;
          })}
        </ol>}
    </section>
  </div>;
}
