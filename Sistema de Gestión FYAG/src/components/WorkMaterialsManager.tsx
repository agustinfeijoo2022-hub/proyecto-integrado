import { useEffect, useState } from "react";
import { PlusCircle, ArrowDownToLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/typography";
import { api, mensajeError } from "@/lib/api";
import MaterialCatalogField, { type ArticuloMaterial } from "./MaterialCatalogField";
import { toast } from "sonner";

interface SolicitudObra {
  id: string;
  obraId: number;
  codigo: string;
  cantidad: number;
  estado: string;
}

export default function WorkMaterialsManager({ obraId, catalogo, onMovimiento }: { obraId: number; catalogo: ArticuloMaterial[]; onMovimiento: () => void }) {
  const [solicitudes, setSolicitudes] = useState<SolicitudObra[]>([]);
  const [actualizacion, setActualizacion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    api<SolicitudObra[]>("/solicitudes", { signal: controller.signal })
      .then(items => setSolicitudes(items.filter(item => item.obraId === obraId)))
      .catch(error => { if (!controller.signal.aborted) toast.error(mensajeError(error)); });
    return () => controller.abort();
  }, [obraId, actualizacion]);

  const [guardando, setGuardando] = useState(false);
  const [cantidadSobrante, setCantidadSobrante] = useState("");
  const [articuloSobrante, setArticuloSobrante] = useState("");

  const [articuloSolicitud, setArticuloSolicitud] = useState("");
  const [cantidadSolicitud, setCantidadSolicitud] = useState("");

  const [articuloConsumo, setArticuloConsumo] = useState("");
  const [cantidadConsumo, setCantidadConsumo] = useState("");
  const normalizar = (codigo: string) =>
    catalogo.find(a => a.codigo.toLowerCase() === codigo.trim().toLowerCase())?.codigo ?? codigo.trim();

  const handleConsumo = async () => {
    if (!articuloConsumo.trim() || !(Number(cantidadConsumo) > 0)) return toast.error("Ingresa un código y una cantidad positiva.");
    setGuardando(true);
    try {
      await api("/consumos", { method: "POST", body: JSON.stringify({ obraId, codigo: normalizar(articuloConsumo), cantidad: Number(cantidadConsumo) }) });
      toast.success("Consumo registrado.");
      setCantidadConsumo("");
      onMovimiento();
    } catch (error) { toast.error(mensajeError(error)); }
    finally { setGuardando(false); }
  };

  const handleDevolver = async () => {
    if (!articuloSobrante.trim() || !(Number(cantidadSobrante) > 0)) return toast.error("Ingresa un código y una cantidad positiva.");
    setGuardando(true);
    try {
      await api("/devoluciones", { method: "POST", body: JSON.stringify({ obraId, codigo: normalizar(articuloSobrante), cantidad: Number(cantidadSobrante) }) });
      toast.success("Sobrante devuelto al inventario.");
      setCantidadSobrante("");
      onMovimiento();
    } catch (err) { toast.error(mensajeError(err)); }
    finally { setGuardando(false); }
  };

  const handleSolicitar = async () => {
    if (!articuloSolicitud.trim() || !(Number(cantidadSolicitud) > 0)) return toast.error("Ingresa un código y una cantidad positiva.");
    setGuardando(true);
    try {
      await api("/solicitudes", { method: "POST", body: JSON.stringify({ obraId, codigo: normalizar(articuloSolicitud), cantidad: Number(cantidadSolicitud) }) });
      toast.success("Solicitud enviada a Finanzas.");
      setCantidadSolicitud("");
      setActualizacion(valor => valor + 1);
    } catch (err) { toast.error(mensajeError(err)); }
    finally { setGuardando(false); }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader><SectionTitle><ArrowDownToLine className="inline size-4 mr-2"/> Devolver Sobrante</SectionTitle></CardHeader>
        <CardContent className="space-y-3">
          <MaterialCatalogField etiqueta="Artículo a devolver" catalogo={catalogo} codigo={articuloSobrante} onChange={setArticuloSobrante} />
          <Input type="number" min="0" step="any" placeholder="Cantidad sobrante" value={cantidadSobrante} onChange={e => setCantidadSobrante(e.target.value)} />
          <Button disabled={guardando} onClick={handleDevolver} className="w-full" variant="outline">Registrar Devolución</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><SectionTitle><PlusCircle className="inline size-4 mr-2"/> Solicitar más Productos</SectionTitle></CardHeader>
        <CardContent className="space-y-3">
          <MaterialCatalogField etiqueta="Artículo a solicitar" catalogo={catalogo} codigo={articuloSolicitud} onChange={setArticuloSolicitud} />
          <Input type="number" min="0" step="any" placeholder="Cantidad requerida" value={cantidadSolicitud} onChange={e => setCantidadSolicitud(e.target.value)} />
          <Button disabled={guardando} onClick={handleSolicitar} className="w-full">Enviar Solicitud a Finanzas</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><SectionTitle>Registrar material utilizado</SectionTitle></CardHeader>
        <CardContent className="space-y-3">
          <MaterialCatalogField etiqueta="Artículo utilizado" catalogo={catalogo} codigo={articuloConsumo} onChange={setArticuloConsumo} />
          <Input type="number" min="0" step="any" aria-label="Cantidad utilizada" placeholder="Cantidad utilizada" value={cantidadConsumo} onChange={e => setCantidadConsumo(e.target.value)} />
          <Button disabled={guardando} onClick={handleConsumo} className="w-full">Registrar consumo</Button>
        </CardContent>
      </Card>
      {solicitudes.length > 0 && <Card className="sm:col-span-2">
        <CardHeader><SectionTitle>Solicitudes de esta obra</SectionTitle></CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {solicitudes.map(item => <li className="flex justify-between gap-4 py-2" key={item.id}>
              <span>{item.codigo} · {item.cantidad}</span><span>{item.estado}</span>
            </li>)}
          </ul>
        </CardContent>
      </Card>}
    </div>
  );
}