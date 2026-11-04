import { Download, FileSpreadsheet, Filter } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR, TableWrap } from "@/components/ui/table";
import { SectionTitle } from "@/components/ui/typography";
import { clientes, tecnicos } from "@/data/mockData";
import { shortDate } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

export default function ReportsPage() {
  const obras = useAppStore((state) => state.obras);
  return <div><PageHeader title="Reportes" description="Analiza y exporta información consolidada." actions={<><Button variant="outline" onClick={() => toast.success("Exportación Excel preparada (simulación).")}><FileSpreadsheet className="size-4" />Exportar Excel</Button><Button onClick={() => toast.success("Exportación PDF preparada (simulación).")}><Download className="size-4" />Exportar PDF</Button></>} />
    <Card><CardHeader><SectionTitle><span className="flex items-center gap-2"><Filter className="size-4 text-primary" />Filtros combinables</span></SectionTitle></CardHeader><CardContent><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><Field label="Desde"><Input type="date" /></Field><Field label="Hasta"><Input type="date" /></Field><Field label="Cliente"><Select><option>Todos los clientes</option>{clientes.map((item) => <option key={item.id}>{item.razonSocial}</option>)}</Select></Field><Field label="Técnico"><Select><option>Todos los técnicos</option>{tecnicos.map((item) => <option key={item.id}>{item.nombre}</option>)}</Select></Field><Field label="Estado"><Select><option>Todos los estados</option><option>En proceso</option><option>Finalizada</option><option>Suspendida</option><option>Cancelada</option></Select></Field></div></CardContent></Card>
    <Card className="mt-6"><TableWrap><Table><THead><TR><TH>Obra</TH><TH>Cliente</TH><TH>Técnico</TH><TH>Fecha inicio</TH><TH>Tipo</TH><TH>Estado</TH></TR></THead><TBody>{obras.slice(0, 10).map((obra) => <TR key={obra.id}><TD className="font-semibold text-primary">{obra.codigo}</TD><TD>{clientes.find((c) => c.id === obra.clienteId)?.razonSocial}</TD><TD>{tecnicos.find((t) => t.id === obra.tecnicoId)?.nombre ?? "Sin asignar"}</TD><TD>{shortDate(obra.fechaInicio)}</TD><TD>{obra.tipo}</TD><TD><StatusBadge status={obra.estado} /></TD></TR>)}</TBody></Table></TableWrap></Card>
  </div>;
}
