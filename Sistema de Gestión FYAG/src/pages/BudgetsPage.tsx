import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { toast } from "sonner";
import BudgetForm from "@/components/BudgetForm";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TBody, TD, TH, THead, TR, TableWrap } from "@/components/ui/table";
import { clientes } from "@/data/mockData";
import { usePermissions } from "@/hooks/usePermissions";
import { currency, shortDate } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

export default function BudgetsPage() {
  const [open, setOpen] = useState(false);
  const presupuestos = useAppStore((state) => state.presupuestos);
  const { puedeAprobarPresupuestos } = usePermissions();
  const actualizar = useAppStore((state) => state.actualizarPresupuesto);
  return <div><PageHeader title="Presupuestos" description="Gestión comercial y aprobación de propuestas." actions={<Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button><Plus className="size-4" />Nuevo presupuesto</Button></DialogTrigger><DialogContent className="max-w-3xl"><DialogTitle>Nuevo presupuesto</DialogTitle><DialogDescription>Agrega servicios o materiales. El total se calcula automáticamente.</DialogDescription><BudgetForm onDone={() => setOpen(false)} /></DialogContent></Dialog>} />
      <Card><TableWrap><Table><THead><TR><TH>Folio</TH><TH>Cliente</TH><TH>Fecha</TH><TH>Servicio</TH><TH>Total</TH><TH>Estado</TH><TH>Acción</TH></TR></THead><TBody>{presupuestos.map((item) => <TR key={item.id}><TD className="font-semibold text-primary">{item.folio}</TD><TD>{clientes.find((c) => c.id === item.clienteId)?.razonSocial}</TD><TD>{shortDate(item.fecha)}</TD><TD>{item.tipo}</TD><TD className="font-semibold">{currency(item.total)}</TD><TD><StatusBadge status={item.estado} /></TD><TD>{puedeAprobarPresupuestos && item.estado === "Enviado" ? <Button size="sm" onClick={() => { actualizar(item.id, { estado: "Aprobado" }); toast.success("Presupuesto aprobado por Gerencia."); }}><Check className="size-4" />Aprobar</Button> : <span className="text-xs text-muted-foreground">{item.estado === "Enviado" ? "Solo Gerencia" : "—"}</span>}</TD></TR>)}</TBody></Table></TableWrap></Card>
  </div>;
}
