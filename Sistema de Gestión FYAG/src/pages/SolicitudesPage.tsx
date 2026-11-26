import { PuntoGuia } from "@/components/GuiaDeUso";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { api, mensajeError } from "@/lib/api";
import { shortDate } from "@/lib/utils";

interface Solicitud {
  id: string;
  codigo: string;
  nombreArticulo: string;
  obraId: number;
  tecnicoId: string;
  cantidad: number;
  fecha: string;
  estado: "Pendiente" | "Aprobada" | "Rechazada";
}

export default function SolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [resolviendo, setResolviendo] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    api<Solicitud[]>("/solicitudes", { signal: controller.signal })
      .then(setSolicitudes)
      .catch(error => { if (!controller.signal.aborted) setError(mensajeError(error)); })
      .finally(() => { if (!controller.signal.aborted) setCargando(false); });
    return () => controller.abort();
  }, []);

  const resolver = async (id: string, estado: "Aprobada" | "Rechazada") => {
    setResolviendo(true);
    try {
      await api(`/solicitudes/${id}`, { method: "PATCH", body: JSON.stringify({ estado }) });
      setSolicitudes(items => items.map(item => item.id === id ? { ...item, estado } : item));
      toast.success(`Solicitud ${estado.toLocaleLowerCase("es")}.`);
    } catch (error) { toast.error(mensajeError(error)); }
    finally { setResolviendo(false); }
  };

  return (
    <div>
      <PageHeader area="bodega" title="Solicitudes de materiales" />
      <PuntoGuia id="lista-solicitudes" />
      <Card className="overflow-x-auto">
        {error ? <p role="alert" className="p-6">{error}</p> : cargando ? <p role="status" className="p-6">Cargando solicitudes…</p> :
          solicitudes.length === 0 ? <p className="p-6">No hay solicitudes registradas.</p> : (
            <Table>
              <THead><TR>{["Fecha", "Obra", "Técnico", "Artículo", "Cantidad", "Estado", "Acciones"].map(texto => <TH key={texto}>{texto}</TH>)}</TR></THead>
              <TBody>
                {solicitudes.map(item => (
                  <TR key={item.id}>
                    <TD>{shortDate(item.fecha)}</TD><TD>{item.obraId}</TD><TD>{item.tecnicoId}</TD>
                    <TD>{item.codigo} · {item.nombreArticulo}</TD><TD>{item.cantidad}</TD><TD>{item.estado}</TD>
                    <TD>{item.estado === "Pendiente" && <div className="flex gap-2">
                      <Button disabled={resolviendo} onClick={() => void resolver(item.id, "Aprobada")}>Aprobar</Button>
                      <Button disabled={resolviendo} variant="outline" onClick={() => void resolver(item.id, "Rechazada")}>Rechazar</Button>
                    </div>}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
      </Card>
    </div>
  );
}
