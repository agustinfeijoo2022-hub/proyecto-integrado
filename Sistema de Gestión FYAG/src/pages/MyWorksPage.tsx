import { CalendarDays, ChevronRight, ClipboardList, MapPin } from "lucide-react";
import { useNavigate } from "react-router";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { clientes } from "@/data/mockData";
import { shortDate } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

export default function MyWorksPage() {
  const usuario = useAppStore((state) => state.usuario);
  const obras = useAppStore((state) => state.obras.filter((obra) => obra.tecnicoId === state.usuario?.tecnicoId));
  const navigate = useNavigate();
  return <div><PageHeader title="Mis obras asignadas" description={`Hola ${usuario?.nombre}, estas son tus obras activas y recientes.`} />
    <div className="mb-5 flex gap-3 overflow-x-auto">{["Todas", "En proceso", "Finalizada", "Suspendida"].map((filter, index) => <Button key={filter} variant={index === 0 ? "default" : "outline"} size="sm">{filter}</Button>)}</div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{obras.map((obra) => <Card key={obra.id} className="overflow-hidden"><div className="h-1.5 bg-info" /><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><div><div className="text-sm font-bold text-primary">{obra.codigo}</div><div className="mt-1 text-lg font-bold">{obra.nombre}</div></div><StatusBadge status={obra.estado} /></div><div className="mt-5 grid gap-3 text-sm text-muted-foreground"><div className="flex items-center gap-2"><MapPin className="size-4" />{clientes.find((c) => c.id === obra.clienteId)?.razonSocial}</div><div className="flex items-center gap-2"><CalendarDays className="size-4" />Inicio {shortDate(obra.fechaInicio)}</div></div><div className="mt-5"><div className="mb-1.5 flex justify-between text-xs"><span>Avance</span><strong>{obra.avance}%</strong></div><div className="h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-info" style={{ width: `${obra.avance}%` }} /></div></div><Button variant="outline" className="mt-5 w-full" onClick={() => navigate(`/obras/${obra.id}`)}>Ver detalle técnico<ChevronRight className="size-4" /></Button></CardContent></Card>)}</div>
    {obras.length === 0 && <Card><CardContent className="grid place-items-center gap-2 p-10 text-center"><ClipboardList className="size-9 text-muted-foreground" /><strong>No tienes obras asignadas</strong></CardContent></Card>}
  </div>;
}
