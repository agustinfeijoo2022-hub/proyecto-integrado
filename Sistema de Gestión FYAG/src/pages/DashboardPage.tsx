import { ArrowDownRight, ArrowUpRight, BriefcaseBusiness, CircleCheck, FileCheck2, WalletCards } from "lucide-react";
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Muted, SectionTitle } from "@/components/ui/typography";
import { Table, TBody, TD, TH, THead, TR, TableWrap } from "@/components/ui/table";
import { clientes, distribucionServicios, ventasMensuales } from "@/data/mockData";
import { currency, shortDate } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

const COLORS = ["#1E3A8A", "#3B82F6", "#10B981", "#F59E0B"];

export default function DashboardPage() {
  const obras = useAppStore((state) => state.obras);
  const presupuestos = useAppStore((state) => state.presupuestos);
  const kpis = [
    { label: "Ventas del mes", value: currency(74200000), delta: "+12,5%", up: true, icon: WalletCards, tone: "bg-primary-light text-primary" },
    { label: "Presupuestos aprobados", value: presupuestos.filter((p) => p.estado === "Aprobado").length.toString(), delta: "+8,2%", up: true, icon: FileCheck2, tone: "bg-success-light text-success-dark" },
    { label: "Obras en proceso", value: obras.filter((o) => o.estado === "En proceso").length.toString(), delta: "+2 este mes", up: true, icon: BriefcaseBusiness, tone: "bg-info-light text-info-dark" },
    { label: "Servicios realizados", value: obras.filter((o) => o.estado === "Finalizada").length.toString(), delta: "-3,1%", up: false, icon: CircleCheck, tone: "bg-warning-light text-warning-dark" },
  ];
  return <div>
    <PageHeader title="Resumen ejecutivo" description="Visión general de la operación comercial y técnica." />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{kpis.map((kpi) => {
      const Icon = kpi.icon;
      return <Card key={kpi.label}><CardContent className="p-5"><div className="flex items-start justify-between"><div className={`grid size-11 place-items-center rounded-xl ${kpi.tone}`}><Icon className="size-5" /></div><span className={`flex items-center text-xs font-semibold ${kpi.up ? "text-success-dark" : "text-danger"}`}>{kpi.up ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}{kpi.delta}</span></div><div className="mt-5 text-2xl font-bold">{kpi.value}</div><Muted className="mt-1">{kpi.label}</Muted></CardContent></Card>;
    })}</div>
    <div className="mt-6 grid gap-6 xl:grid-cols-5">
      <Card className="xl:col-span-3"><CardHeader><div><SectionTitle>Evolución de ventas</SectionTitle><Muted>Últimos 6 meses · MM CLP</Muted></div></CardHeader><CardContent><div className="h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={ventasMensuales} margin={{ left: -20, right: 12 }}><XAxis dataKey="mes" axisLine={false} tickLine={false} /><YAxis axisLine={false} tickLine={false} /><Tooltip formatter={(value) => [`$${value} MM`, "Ventas"]} /><Line type="monotone" dataKey="ventas" stroke="#1E3A8A" strokeWidth={3} dot={{ fill: "#1E3A8A", r: 4 }} /></LineChart></ResponsiveContainer></div></CardContent></Card>
      <Card className="xl:col-span-2"><CardHeader><div><SectionTitle>Servicios por tipo</SectionTitle><Muted>Distribución del período</Muted></div></CardHeader><CardContent><div className="h-52"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={distribucionServicios} innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">{distribucionServicios.map((item, index) => <Cell key={item.name} fill={COLORS[index]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div><div className="grid grid-cols-2 gap-3">{distribucionServicios.map((item, index) => <div key={item.name} className="flex items-center gap-2 text-xs"><span className="size-2.5 rounded-full" style={{ backgroundColor: COLORS[index] }} /><span className="text-muted-foreground">{item.name}</span><strong className="ml-auto">{item.value}%</strong></div>)}</div></CardContent></Card>
    </div>
    <Card className="mt-6"><CardHeader><div><SectionTitle>Obras recientes</SectionTitle><Muted>Últimas actualizaciones operacionales</Muted></div></CardHeader><TableWrap className="hidden md:block"><Table><THead><TR><TH>Obra</TH><TH>Cliente</TH><TH>Inicio</TH><TH>Técnico</TH><TH>Estado</TH></TR></THead><TBody>{obras.slice(0, 5).map((obra) => <TR key={obra.id}><TD><strong>{obra.codigo}</strong><div className="text-xs text-muted-foreground">{obra.nombre}</div></TD><TD>{clientes.find((c) => c.id === obra.clienteId)?.razonSocial}</TD><TD>{shortDate(obra.fechaInicio)}</TD><TD>{obra.tecnicoId ? `Técnico ${obra.tecnicoId.slice(1)}` : "Sin asignar"}</TD><TD><StatusBadge status={obra.estado} /></TD></TR>)}</TBody></Table></TableWrap><div className="grid gap-3 p-4 md:hidden">{obras.slice(0, 5).map((obra) => <div className="rounded-lg border border-border p-4" key={obra.id}><div className="flex justify-between gap-2"><strong>{obra.codigo}</strong><StatusBadge status={obra.estado} /></div><div className="mt-1 text-sm">{obra.nombre}</div><div className="mt-2 text-xs text-muted-foreground">{clientes.find((c) => c.id === obra.clienteId)?.razonSocial}</div></div>)}</div></Card>
  </div>;
}
