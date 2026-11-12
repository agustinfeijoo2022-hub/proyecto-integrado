import { useEffect, useState, type FormEvent } from "react";
import { ShoppingCart, History, Search } from "lucide-react";
import { api, obtenerArticulos, obtenerCompras, mensajeError, type Articulo, type Compra } from "@/lib/api";
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
  const filtradas = compras.filter(c => `${c.proveedor} ${c.nombreArticulo} ${c.codigoArticulo}`.toLocaleLowerCase("es").includes(busqueda.trim().toLocaleLowerCase("es")));
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
      setMensaje(`Compra registrada por ${pesos(data.total)}. Stock de ${data.articulo.nombre}: ${data.articulo.stock} ${data.articulo.unidad}.`);
      setForm(vacio);
    } catch (err) { setError(mensajeError(err)); }
    finally { setGuardando(false); }
  }
  return <div className="fyag-page">
    <header><p className="text-xs font-bold uppercase tracking-widest text-blue-900">Abastecimiento</p><h1 className="fyag-title mt-2">{puedeRegistrar ? "Registro de compras" : "Historial de compras"}</h1><p className="fyag-subtitle">Controla tus ingresos de materiales y consulta los movimientos recientes.</p></header>
    {rol === "Gerencia" && <p role="note" className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">Modo lectura: puedes consultar las compras. El registro de ingresos corresponde a Finanzas.</p>}
    {mensaje && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{mensaje}</p>}
    {errorCarga && <div className="fyag-error" role="alert">{errorCarga}<button onClick={() => setIntento(i => i + 1)} className="ml-3 underline">Reintentar</button></div>}
    {puedeRegistrar && <form onSubmit={registrar} className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
      <section className="fyag-card p-6 sm:p-8"><h2 className="mb-6 flex items-center gap-2 text-lg font-bold"><ShoppingCart className="size-5 text-blue-900" />Datos de la compra</h2>
        <fieldset disabled={guardando || cargando || !!errorCarga} className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="fyag-label" htmlFor="proveedor">Proveedor</label><input id="proveedor" required maxLength={160} className="fyag-input" placeholder="Razón social del proveedor" value={form.proveedor} onChange={e => setForm({ ...form, proveedor: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="fyag-label" htmlFor="producto">Artículo</label><select id="producto" required className="fyag-input" value={form.codigoArticulo} onChange={e => setForm({ ...form, codigoArticulo: e.target.value })}><option value="">{cargando ? "Cargando artículos…" : "Selecciona un artículo"}</option>{articulos.map(a => <option key={a._id} value={a.codigo}>{a.nombre} · {a.codigo} · stock: {a.stock}</option>)}</select>{!cargando && !errorCarga && !articulos.length && <p className="mt-2 text-sm text-slate-500">No hay artículos. Solicita a Supervisor que cree uno.</p>}</div>
          <div><label className="fyag-label" htmlFor="cantidad">Cantidad recibida</label><input id="cantidad" type="number" required min="0.000001" max="1000000000000" step="any" className="fyag-input" value={form.cantidad} onChange={e => setForm({ ...form, cantidad: e.target.value })} /></div>
          <div><label className="fyag-label" htmlFor="monto">Monto neto del lote (CLP)</label><input id="monto" type="number" required min="0" max="1000000000000" step="1" className="fyag-input" value={form.monto} onChange={e => setForm({ ...form, monto: e.target.value })} /></div>
          <div><label className="fyag-label" htmlFor="descuento">Descuento (%)</label><input id="descuento" type="number" min="0" max="100" step="any" className="fyag-input" value={form.descuento} onChange={e => setForm({ ...form, descuento: e.target.value })} /></div>
        </fieldset>{error && <p role="alert" className="fyag-error mt-5">{error}</p>}
      </section>
      <aside className="fyag-card p-6"><h2 className="text-lg font-bold">Resumen de compra</h2><p className="fyag-subtitle">Importes calculados automáticamente.</p><dl className="mt-6 space-y-4 text-sm"><div className="flex justify-between"><dt className="text-slate-500">Neto con descuento</dt><dd>{pesos(neto)}</dd></div><div className="flex justify-between"><dt className="text-slate-500">IVA (19%)</dt><dd>{pesos(iva)}</dd></div><div className="flex justify-between border-t pt-5 text-lg font-bold"><dt>Total</dt><dd className="text-blue-900">{pesos(total)}</dd></div></dl><button disabled={guardando || cargando || !!errorCarga || !articulos.length} className="fyag-button mt-6 w-full">{guardando ? "Registrando…" : "Registrar e ingresar stock"}</button><p className="mt-4 text-xs leading-5 text-slate-400">El ingreso se confirma después de guardarlo en el servidor.</p></aside>
    </form>}
    <section className="fyag-card overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-4 border-b p-5"><div><h2 className="flex items-center gap-2 text-lg font-bold"><History className="size-5 text-blue-900" />Últimos movimientos</h2><p className="fyag-subtitle">Hasta 50 compras, ordenadas desde la más reciente.</p></div><div className="relative w-full sm:max-w-xs"><label htmlFor="buscar-compra" className="sr-only">Buscar compras</label><Search className="absolute left-3 top-3 size-4 text-slate-400" /><input id="buscar-compra" placeholder="Proveedor, artículo o código…" className="fyag-input pl-10" value={busqueda} onChange={e => setBusqueda(e.target.value)} /></div></div>
      {cargando ? <p role="status" className="p-10 text-center text-slate-500">Cargando movimientos…</p> : errorCarga ? <p className="p-10 text-center text-sm text-slate-500">Reintenta la conexión para consultar el historial.</p> : <div className="overflow-x-auto"><table className="w-full whitespace-nowrap text-left text-sm"><caption className="sr-only">Historial de compras registradas</caption><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{["Fecha", "Proveedor", "Artículo", "Cantidad", "Neto", "IVA", "Total"].map(label => <th scope="col" key={label} className="px-5 py-4 font-semibold">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{filtradas.map(c => <tr key={c.id} className="hover:bg-slate-50"><td className="px-5 py-4 text-slate-500">{new Date(c.fecha).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })}</td><td className="px-5 py-4 font-medium">{c.proveedor}</td><td className="px-5 py-4"><p className="font-semibold">{c.nombreArticulo}</p><p className="mt-1 font-mono text-xs text-slate-400">{c.codigoArticulo}</p></td><td className="px-5 py-4">{c.cantidad.toLocaleString("es-CL")} {c.unidad}</td><td className="px-5 py-4">{pesos(c.neto)}</td><td className="px-5 py-4 text-slate-500">{pesos(c.iva)}</td><td className="px-5 py-4 font-bold text-blue-900">{pesos(c.total)}</td></tr>)}{!filtradas.length && <tr><td colSpan={7} className="p-10 text-center text-slate-500">{compras.length ? "No hay coincidencias con tu búsqueda." : "Todavía no hay compras registradas."}</td></tr>}</tbody></table></div>}
    </section>
  </div>;
}
