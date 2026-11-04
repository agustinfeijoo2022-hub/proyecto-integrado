import { useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { AlertTriangle, CalendarClock, CircleDollarSign } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR, TableWrap } from "@/components/ui/table";
import { clientes, facturas } from "@/data/mockData";
import { cn, currency, shortDate } from "@/lib/utils";

export default function CollectionsPage() {
  const [paid, setPaid] = useState<string[]>([]);
  const pending = facturas.filter((item) => item.estado !== "Pagada" && !paid.includes(item.id));
  const done = facturas.filter((item) => item.estado === "Pagada" || paid.includes(item.id));
  const total = pending.reduce((sum, item) => sum + item.monto, 0);
  const summaries = [
    { label: "Total por cobrar", value: currency(total), icon: CircleDollarSign, tone: "text-primary bg-primary-light" },
    { label: "Facturas vencidas", value: currency(pending.filter((f) => f.estado === "Vencida").reduce((s, f) => s + f.monto, 0)), icon: AlertTriangle, tone: "text-danger bg-danger-light" },
    { label: "Por vencer", value: currency(pending.filter((f) => f.estado === "Pendiente").reduce((s, f) => s + f.monto, 0)), icon: CalendarClock, tone: "text-warning-dark bg-warning-light" },
  ];
  const rows = (items: typeof facturas, canPay: boolean) => <TableWrap><Table><THead><TR><TH>Factura</TH><TH>Cliente</TH><TH>Vencimiento</TH><TH>Monto</TH><TH>Estado</TH>{canPay && <TH>Acción</TH>}</TR></THead><TBody>{items.map((item) => <TR key={item.id}><TD className="font-semibold text-primary">{item.folio}</TD><TD>{clientes.find((c) => c.id === item.clienteId)?.razonSocial}</TD><TD>{shortDate(item.fechaVencimiento)}</TD><TD className="font-semibold">{currency(item.monto)}</TD><TD><StatusBadge status={paid.includes(item.id) ? "Pagada" : item.estado} /></TD>{canPay && <TD><Button size="sm" variant="outline" onClick={() => { setPaid((value) => [...value, item.id]); toast.success(`Pago registrado para ${item.folio}.`); }}>Registrar pago</Button></TD>}</TR>)}</TBody></Table></TableWrap>;
  return <div><PageHeader title="Cobranza" description="Seguimiento de facturación y cuentas por cobrar." />
    <div className="grid gap-4 md:grid-cols-3">{summaries.map((item) => { const Icon = item.icon; return <Card key={item.label}><CardContent className="flex items-center gap-4 p-5"><div className={cn("grid size-11 place-items-center rounded-xl", item.tone)}><Icon className="size-5" /></div><div><div className="text-xl font-bold">{item.value}</div><div className="text-sm text-muted-foreground">{item.label}</div></div></CardContent></Card>; })}</div>
    <Tabs.Root defaultValue="pending" className="mt-6"><Tabs.List className="mb-4 inline-flex rounded-lg border border-border bg-white p-1"><Tabs.Trigger value="pending" className="rounded-md px-4 py-2 text-sm font-semibold text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-white">Cuentas por cobrar ({pending.length})</Tabs.Trigger><Tabs.Trigger value="paid" className="rounded-md px-4 py-2 text-sm font-semibold text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-white">Pagadas ({done.length})</Tabs.Trigger></Tabs.List><Tabs.Content value="pending"><Card>{rows(pending, true)}</Card></Tabs.Content><Tabs.Content value="paid"><Card>{rows(done, false)}</Card></Tabs.Content></Tabs.Root>
  </div>;
}
