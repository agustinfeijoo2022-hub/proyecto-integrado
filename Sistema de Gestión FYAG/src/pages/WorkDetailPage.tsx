import { useState } from "react";
import { Navigate, useParams } from "react-router";
import { toast } from "sonner";
import { Check, Clock3, UserRound } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field, Select } from "@/components/ui/input";
import { Muted, SectionTitle } from "@/components/ui/typography";
import { clientes, tecnicos } from "@/data/mockData";
import { usePermissions } from "@/hooks/usePermissions";
import { validarTransicionObra } from "@/lib/businessRules";
import { shortDate } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import type { EstadoObra } from "@/types";

const steps = ["Presupuesto Aprobado", "En proceso", "Finalizada", "Cierre comercial"];

export default function WorkDetailPage() {
  const { id } = useParams();
  const obra = useAppStore((state) => state.obras.find((item) => item.id === id));
  const usuario = useAppStore((state) => state.usuario);
  const { puedeGestionarObras } = usePermissions();
  const actualizar = useAppStore((state) => state.actualizarObra);
  const [tecnico, setTecnico] = useState(obra?.tecnicoId ?? "");
  if (!obra) return <Navigate to="/obras" replace />;
  if (usuario?.rol === "Técnico" && obra.tecnicoId !== usuario.tecnicoId) {
    return <Navigate to="/mis-obras" replace />;
  }
  const current = obra.estado === "En proceso" ? 1 : obra.estado === "Finalizada" ? 2 : obra.estado === "Cierre comercial" ? 3 : 1;
  const transition = (destino: EstadoObra) => {
    const candidate = { ...obra, tecnicoId: tecnico || undefined };
    const error = validarTransicionObra(candidate, destino);
    if (error) return toast.error(error);
    actualizar(obra.id, { estado: destino, tecnicoId: tecnico || undefined, avance: destino === "Finalizada" ? 100 : obra.avance });
    toast.success(`Obra actualizada a “${destino}”.`);
  };
  return <div><PageHeader title={`${obra.codigo} · ${obra.nombre}`} description={`${clientes.find((c) => c.id === obra.clienteId)?.razonSocial} · Inicio ${shortDate(obra.fechaInicio)}`} actions={<StatusBadge status={obra.estado} />} />
    <Card><CardContent className="p-5 sm:p-7"><div className="grid grid-cols-4">{steps.map((step, index) => <div key={step} className="relative text-center"><div className={`absolute left-0 top-4 h-0.5 w-full ${index <= current ? "bg-primary" : "bg-border"} ${index === 0 ? "left-1/2 w-1/2" : index === 3 ? "w-1/2" : ""}`} /><div className={`relative mx-auto grid size-8 place-items-center rounded-full border-2 ${index <= current ? "border-primary bg-primary text-white" : "border-border bg-white text-muted-foreground"}`}>{index < current ? <Check className="size-4" /> : <span className="text-xs font-bold">{index + 1}</span>}</div><div className={`mt-2 text-xs font-medium ${index <= current ? "text-primary" : "text-muted-foreground"}`}>{step}</div></div>)}</div></CardContent></Card>
    <div className="mt-6 grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2"><CardHeader><SectionTitle>Información de la obra</SectionTitle></CardHeader><CardContent><div className="grid gap-5 sm:grid-cols-2"><Info label="Tipo de servicio" value={obra.tipo} /><Info label="Fecha de inicio" value={shortDate(obra.fechaInicio)} /><Info label="Presupuesto origen" value={obra.presupuestoId.toUpperCase()} /><Info label="Avance informado" value={`${obra.avance}%`} /></div><div className="mt-6"><div className="mb-2 h-2.5 rounded-full bg-muted"><div className="h-full rounded-full bg-info" style={{ width: `${obra.avance}%` }} /></div></div></CardContent></Card>
      <Card><CardHeader><SectionTitle>Gestión operacional</SectionTitle></CardHeader><CardContent className="grid gap-4"><Field label="Técnico asignado"><Select value={tecnico} onChange={(event) => setTecnico(event.target.value)} disabled={!puedeGestionarObras}><option value="">Sin asignar</option>{tecnicos.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</Select></Field>{puedeGestionarObras && <><Button onClick={() => { actualizar(obra.id, { tecnicoId: tecnico || undefined }); toast.success("Técnico asignado correctamente."); }} variant="outline"><UserRound className="size-4" />Guardar asignación</Button><div className="border-t border-border pt-4"><Muted className="mb-3">Cambiar estado</Muted><div className="grid gap-2">{obra.estado === "En proceso" && <Button onClick={() => transition("Finalizada")}>Marcar como finalizada</Button>}{obra.estado === "Finalizada" && <Button onClick={() => transition("Cierre comercial")}>Realizar cierre comercial</Button>}{obra.estado !== "Cancelada" && obra.estado !== "Cierre comercial" && <Button variant="danger" onClick={() => transition("Cancelada")}>Cancelar obra</Button>}</div></div></>}</CardContent></Card>
    </div>
    <Card className="mt-6"><CardHeader><SectionTitle>Historial de cambios</SectionTitle></CardHeader><CardContent><div className="space-y-5">{[
      ["Estado actualizado a " + obra.estado, "Sofía Contreras · Hoy, 10:32"],
      ["Avance informado al " + obra.avance + "%", "Matías González · Ayer, 17:15"],
      ["Obra creada desde presupuesto aprobado", "Sofía Contreras · " + shortDate(obra.fechaInicio)],
    ].map(([title, meta]) => <div className="flex gap-3" key={title}><div className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-light text-primary"><Clock3 className="size-4" /></div><div><div className="text-sm font-semibold">{title}</div><Muted>{meta}</Muted></div></div>)}</div></CardContent></Card>
  </div>;
}
function Info({ label, value }: { label: string; value: string }) {
  return <div><Muted>{label}</Muted><div className="mt-1 font-semibold">{value}</div></div>;
}
