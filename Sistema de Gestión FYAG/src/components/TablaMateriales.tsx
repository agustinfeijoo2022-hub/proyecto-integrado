import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { SectionTitle } from "@/components/ui/typography";

export interface MaterialObra {
  codigo: string;
  nombre: string;
  unidad: string;
  entregados: number;
  devueltos: number;
  utilizados: number;
  saldo: number;
}

export function TablaMateriales({ materiales, error }: { materiales: MaterialObra[]; error: string }) {
  return <Card className="mt-6">
    <CardHeader><SectionTitle>Materiales de la obra</SectionTitle></CardHeader>
    <CardContent>
      {error ? <p role="alert">{error}</p> : !materiales.length ? <p>No hay movimientos de materiales registrados.</p> :
        <div className="overflow-x-auto">
          <Table>
            <THead><TR>{["Artículo", "Unidad", "Entregado registrado", "Devuelto", "Utilizado", "Saldo en obra"].map(titulo => <TH key={titulo}>{titulo}</TH>)}</TR></THead>
            <TBody>{materiales.map(item => <TR key={item.codigo}>
              <TD>{item.codigo} · {item.nombre}</TD><TD>{item.unidad}</TD>
              {[item.entregados, item.devueltos, item.utilizados, item.saldo].map((cantidad, indice) => <TD key={indice}>{cantidad.toLocaleString("es-CL")}</TD>)}
            </TR>)}</TBody>
          </Table>
        </div>}
    </CardContent>
  </Card>;
}
