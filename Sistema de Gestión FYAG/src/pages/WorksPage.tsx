// src/pages/WorksPage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import NewWorkDialog from "@/components/NewWorkDialog";
import { Field, Input, Select } from "@/components/ui/input";
import { Hammer } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { useAppStore } from "@/store/useAppStore";
import StatusBadge from "@/components/StatusBadge";
import { shortDate } from "@/lib/utils";

export default function WorksPage() {
  const obras = useAppStore((s) => s.obras);
  const fetchObras = useAppStore((s) => s.fetchObras);
  const loading = useAppStore((s) => s.cargandoObras);
  const rol = useAppStore((s) => s.usuario?.rol);
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const estados = [...new Set(obras.map(o => o.estado))].sort();
  const visibles = obras.filter(o =>
    (!estado || o.estado === estado) &&
    `${o.codigo} ${o.nombre} ${o.tipo}`.toLocaleLowerCase("es").includes(busqueda.trim().toLocaleLowerCase("es")),
  );

  useEffect(() => { void fetchObras(); }, [fetchObras]);

  return (
    <div>
      <PageHeader area="seguimiento" title="Obras" description="Seguimiento de obras asignadas." actions={rol === "Encargado de Bodega" && <NewWorkDialog />} />
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Field label="Buscar por código, nombre o servicio">
          <Input value={busqueda} onChange={event => setBusqueda(event.target.value)} />
        </Field>
        <Field label="Estado">
          <Select value={estado} onChange={event => setEstado(event.target.value)}>
            <option value="">Todos los estados</option>
            {estados.map(valor => <option key={valor}>{valor}</option>)}
          </Select>
        </Field>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-muted-foreground">Cargando...</p>
        ) : visibles.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
            <Hammer className="size-10 text-muted-foreground" />
            <p className="font-medium">{obras.length ? "No hay obras que coincidan con los filtros." : "No hay obras registradas."}</p>
          </div>
        ) : (
          <ul className="grid gap-3 p-3 sm:p-4 md:grid-cols-2 xl:grid-cols-3">
            {visibles.map(obra => (
              <li key={obra.id} className="flex flex-col rounded-xl border border-border bg-app p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <code className="text-xs text-muted-foreground">{obra.codigo}</code>
                  <StatusBadge status={obra.estado} />
                </div>
                <h2 className="mt-3 flex-1 break-words text-lg font-semibold">
                  <Link className="text-foreground hover:text-primary hover:underline" to={`/app/obras/${obra.id}`}>{obra.nombre}</Link>
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{obra.tipo} · Inicio {shortDate(obra.inicio)}</p>
                <div className="mt-4 flex items-center gap-3">
                  <progress aria-label={`Avance de ${obra.nombre}`} max={100} value={obra.avance} className="h-2 min-w-0 flex-1 accent-amber-600" />
                  <span className="text-xs font-semibold tabular-nums">{obra.avance}%</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}