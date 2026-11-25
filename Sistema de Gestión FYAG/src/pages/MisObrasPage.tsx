import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

export default function MisObrasPage() {
  const usuario = useAppStore((s) => s.usuario);
  const todas = useAppStore((s) => s.obras);
  const fetchObras = useAppStore((s) => s.fetchObras);
  const cargando = useAppStore((s) => s.cargandoObras);

  useEffect(() => {
    fetchObras();
  }, [fetchObras]);

  const obras =
    usuario?.rol === "Gerencia" || usuario?.rol === "Encargado de Bodega"
      ? todas
      : usuario?.tecnicoId
        ? todas.filter((o) => o.tecnico_id === usuario.tecnicoId)
        : [];

  return (
    <div className="fyag-page">
      <PageHeader area="seguimiento" title="Mis Tareas" description={`${obras.length} ${obras.length === 1 ? "obra para consultar" : "obras para consultar"}`} />

      {cargando ? (
        <div className="fyag-card p-10 text-center text-slate-500">
          Cargando tareas desde PostgreSQL...
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {obras.map((o) => (
            <article key={o.id} className="rounded-2xl border border-border border-l-4 border-l-amber-500 bg-card p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-mono text-xs font-semibold text-muted-foreground">{o.codigo}</p><StatusBadge status={o.estado} /></div>
              <h2 className="mt-2 text-lg font-bold">{o.nombre}</h2>
              <label htmlFor={`avance-${o.id}`} className="mt-6 block text-xs font-medium text-slate-500">
                Avance: {o.avance}%
              </label>
              <progress id={`avance-${o.id}`} max={100} value={o.avance} className="mt-2 h-2 w-full accent-amber-600" />
              <Link className="mt-4 inline-block text-primary underline" to={`/app/obras/${o.id}`}>Ver detalle</Link>
            </article>
          ))}
        </div>
      )}

      {!cargando && !obras.length && (
        <div className="fyag-card p-10 text-center text-slate-500">
          No tienes obras asignadas por el momento.
        </div>
      )}
    </div>
  );
}