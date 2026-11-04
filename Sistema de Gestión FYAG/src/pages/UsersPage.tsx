import { ShieldCheck, UserCog } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR, TableWrap } from "@/components/ui/table";
import { SectionTitle } from "@/components/ui/typography";
import { auditoria, usuarios } from "@/data/mockData";

export default function UsersPage() {
  return <div><PageHeader title="Usuarios y auditoría" description="Control de accesos y trazabilidad del sistema." />
    <div className="grid gap-6 xl:grid-cols-2"><Card><CardHeader><SectionTitle><span className="flex items-center gap-2"><UserCog className="size-5 text-primary" />Usuarios activos</span></SectionTitle></CardHeader><TableWrap><Table><THead><TR><TH>Usuario</TH><TH>Rol</TH><TH>Estado</TH></TR></THead><TBody>{usuarios.map((user) => <TR key={user.id}><TD><strong>{user.nombre}</strong><div className="text-xs text-muted-foreground">{user.email}</div></TD><TD>{user.rol}</TD><TD><span className="text-sm font-semibold text-success-dark">Activo</span></TD></TR>)}</TBody></Table></TableWrap></Card>
      <Card><CardHeader><SectionTitle><span className="flex items-center gap-2"><ShieldCheck className="size-5 text-primary" />Auditoría reciente</span></SectionTitle></CardHeader><CardContent className="max-h-[28rem] overflow-y-auto"><div className="space-y-4">{auditoria.map((item) => <div className="border-l-2 border-primary-light pl-4" key={item.id}><div className="text-sm font-semibold">{item.accion} · {item.entidad}</div><div className="mt-1 text-xs text-muted-foreground">{item.usuario} · {item.fecha}</div></div>)}</div></CardContent></Card>
    </div>
  </div>;
}
