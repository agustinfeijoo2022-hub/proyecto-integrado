import { useMemo, useState } from "react";
import { ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useNavigate } from "react-router";
import NewWorkDialog from "@/components/NewWorkDialog";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR, TableWrap } from "@/components/ui/table";
import { clientes, tecnicos } from "@/data/mockData";
import { shortDate } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

export default function WorksPage() {
  const obras = useAppStore((state) => state.obras);
  const usuario = useAppStore((state) => state.usuario);
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState("");
  const [tecnico, setTecnico] = useState("");
  const [fecha, setFecha] = useState("");
  const [ascending, setAscending] = useState(false);
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => obras.filter((obra) =>
    (!search || `${obra.codigo} ${obra.nombre} ${clientes.find((c) => c.id === obra.clienteId)?.razonSocial}`.toLowerCase().includes(search.toLowerCase())) &&
    (!estado || obra.estado === estado) && (!tecnico || obra.tecnicoId === tecnico) && (!fecha || obra.fechaInicio >= fecha)
  ).sort((a, b) => ascending ? a.codigo.localeCompare(b.codigo) : b.codigo.localeCompare(a.codigo)), [obras, search, estado, tecnico, fecha, ascending]);
  const shown = filtered.slice((page - 1) * 6, page * 6);
  return <div><PageHeader title="Obras" description={`${filtered.length} obras encontradas`} actions={usuario?.rol !== "Técnico" ? <NewWorkDialog /> : undefined} />
    <Card><div className="grid gap-3 border-b border-border p-4 sm:grid-cols-2 xl:grid-cols-5"><div className="relative sm:col-span-2"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar por código, obra o cliente..." /></div><Select aria-label="Filtrar por estado" value={estado} onChange={(event) => setEstado(event.target.value)}><option value="">Todos los estados</option><option>En proceso</option><option>Finalizada</option><option>Suspendida</option><option>Cancelada</option></Select><Select aria-label="Filtrar por técnico" value={tecnico} onChange={(event) => setTecnico(event.target.value)}><option value="">Todos los técnicos</option>{tecnicos.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</Select><Input type="date" aria-label="Fecha de inicio desde" value={fecha} onChange={(event) => setFecha(event.target.value)} /></div>
      <TableWrap className="hidden md:block"><Table><THead><TR><TH><Button variant="ghost" size="sm" className="-ml-3 h-7 text-xs uppercase" onClick={() => setAscending((value) => !value)}>Código <ArrowUpDown className="size-3" /></Button></TH><TH>Obra / Cliente</TH><TH>Tipo</TH><TH>Técnico</TH><TH>Inicio</TH><TH>Avance</TH><TH>Estado</TH></TR></THead><TBody>{shown.map((obra) => <TR key={obra.id} className="cursor-pointer" tabIndex={0} onClick={() => navigate(`/obras/${obra.id}`)} onKeyDown={(event) => event.key === "Enter" && navigate(`/obras/${obra.id}`)}><TD className="font-semibold text-primary">{obra.codigo}</TD><TD><strong>{obra.nombre}</strong><div className="text-xs text-muted-foreground">{clientes.find((c) => c.id === obra.clienteId)?.razonSocial}</div></TD><TD>{obra.tipo}</TD><TD>{tecnicos.find((t) => t.id === obra.tecnicoId)?.nombre ?? "Sin asignar"}</TD><TD>{shortDate(obra.fechaInicio)}</TD><TD><div className="w-24"><div className="mb-1 text-xs">{obra.avance}%</div><div className="h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-info" style={{ width: `${obra.avance}%` }} /></div></div></TD><TD><StatusBadge status={obra.estado} /></TD></TR>)}</TBody></Table></TableWrap>
      <div className="grid gap-3 p-4 md:hidden">{shown.map((obra) => <Button variant="outline" key={obra.id} onClick={() => navigate(`/obras/${obra.id}`)} className="h-auto w-full flex-col items-stretch rounded-xl p-4 text-left font-normal"><div className="flex items-start justify-between gap-3"><div><div className="font-bold text-primary">{obra.codigo}</div><div className="mt-1 font-semibold text-foreground">{obra.nombre}</div></div><StatusBadge status={obra.estado} /></div><div className="mt-3 text-sm text-muted-foreground">{clientes.find((c) => c.id === obra.clienteId)?.razonSocial}</div><div className="mt-4 flex items-center justify-between text-xs text-foreground"><span>{tecnicos.find((t) => t.id === obra.tecnicoId)?.nombre ?? "Sin asignar"}</span><strong>{obra.avance}% avance</strong></div></Button>)}</div>
      <div className="flex items-center justify-between border-t border-border p-4 text-sm text-muted-foreground"><span>Página {page} de {Math.max(1, Math.ceil(filtered.length / 6))}</span><div className="flex gap-2"><Button variant="outline" size="icon" disabled={page === 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft /></Button><Button variant="outline" size="icon" disabled={page >= Math.ceil(filtered.length / 6)} onClick={() => setPage((value) => value + 1)}><ChevronRight /></Button></div></div>
    </Card>
  </div>;
}
