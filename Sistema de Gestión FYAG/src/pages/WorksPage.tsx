import { PuntoGuia } from "@/components/GuiaDeUso";
// src/pages/WorksPage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { nombreTareas } from "@/app/access";
import NewWorkDialog from "@/components/NewWorkDialog";
import { Field, Input, Select } from "@/components/ui/input";
import { Hammer } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { useAppStore } from "@/store/useAppStore";
import StatusBadge from "@/components/StatusBadge";
import { shortDate } from "@/lib/utils";
import { prioridadesObra } from "@/types";

export default function WorksPage({ misTareas = false }: { misTareas?: boolean }) {
  const todas = useAppStore((s) => s.obras);
  const fetchObras = useAppStore((s) => s.fetchObras);
  const loading = useAppStore((s) => s.cargandoObras);
  const usuario = useAppStore((s) => s.usuario);
  const rol = usuario?.rol;
  const tecnicoId = usuario?.tecnicoId;
  const obras = rol === "Técnico" ? todas.filter(obra => tecnicoId && obra.tecnico_id === tecnicoId) : todas;
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const [prioridad, setPrioridad] = useState("");
  const estados = [...new Set(obras.map(o => o.estado))].sort();
  const visibles = obras.filter(o =>
    (!estado || o.estado === estado) &&
    (!prioridad || (o.prioridad ?? "Normal") === prioridad) &&
    `${o.codigo} ${o.nombre} ${o.tipo}`.toLocaleLowerCase("es").includes(busqueda.trim().toLocaleLowerCase("es")),
  ).sort((a, b) =>
    prioridadesObra.indexOf(b.prioridad ?? "Normal") - prioridadesObra.indexOf(a.prioridad ?? "Normal"),
  );

  useEffect(() => { void fetchObras(); }, [fetchObras]);

  return (
    <div>
      <PageHeader area="seguimiento" title={misTareas ? nombreTareas(rol) : "Obras"}
        actions={!misTareas && rol === "Encargado de Bodega" && <NewWorkDialog />} />
      <PuntoGuia id="filtros-obras" />
      <div className="mb-4 grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-3">
        <Field label="Buscar por código, nombre o servicio">
          <Input value={busqueda} onChange={event => setBusqueda(event.target.value)} />
        </Field>
        <Field label="Estado">
          <Select value={estado} onChange={event => setEstado(event.target.value)}>
            <option value="">Todos los estados</option>
            {estados.map(valor => <option key={valor}>{valor}</option>)}
          </Select>
        </Field>
        <Field label="Prioridad">
          <Select value={prioridad} onChange={event => setPrioridad(event.target.value)}>
            <option value="">Todas las prioridades</option>
            {prioridadesObra.map(valor => <option key={valor}>{valor}</option>)}
          </Select>
        </Field>
      </div>
      <p aria-live="polite" className="mb-3 text-sm text-muted-foreground">
        {loading ? "Cargando…" : `${visibles.length} ${visibles.length === 1 ? "resultado" : "resultados"}`}
      </p>

      <PuntoGuia id="lista-obras" />
      <Card className="overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-muted-foreground">Cargando...</p>
        ) : visibles.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
            <Hammer className="size-10 text-muted-foreground" />
            <p className="font-medium">{obras.length ? "No hay obras que coincidan con los filtros." : misTareas ? "Todavía no tienes tareas asignadas." : "No hay obras registradas."}</p>
          </div>
        ) : (
          <ul className="grid gap-3 p-3 sm:p-4 md:grid-cols-2 xl:grid-cols-3">
            {visibles.map(obra => (
              <li key={obra.id} className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <code className="text-xs text-muted-foreground">{obra.codigo}</code>
                  <StatusBadge status={obra.estado} />
                  <span className={obra.prioridad === "Alta" ? "rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-950 dark:bg-amber-950 dark:text-amber-100" : "rounded-full bg-muted px-2 py-1 text-xs font-semibold text-foreground"}>
                    Prioridad {obra.prioridad ?? "Normal"}
                  </span>
                </div>
                <h2 className="mt-3 flex-1 break-words text-lg font-semibold">
                  {obra.nombre}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{obra.tipo} · Inicio {shortDate(obra.inicio)}</p>
                <div className="mt-4 flex items-center gap-3">
                  <progress aria-label={`Avance de ${obra.nombre}`} max={100} value={obra.avance} className="h-2 min-w-0 flex-1 accent-amber-600" />
                  <span className="text-xs font-semibold tabular-nums">{obra.avance}%</span>
                </div>
                <Link aria-label={`Ver detalle de ${obra.nombre}`} className="mt-3 inline-flex min-h-11 items-center self-start font-semibold text-primary hover:underline" to={`/app/obras/${obra.id}`}>
                  Ver detalle
                </Link>
                </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}