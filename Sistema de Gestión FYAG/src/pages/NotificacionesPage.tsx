import { PuntoGuia } from "@/components/GuiaDeUso";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, BriefcaseBusiness, Check, FileText, RefreshCw } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api, ApiError, mensajeError } from "@/lib/api";
import { shortDate } from "@/lib/utils";

type Aviso = {
  id: number;
  tipo: "cotizacion" | "presupuesto" | "obra";
  titulo: string;
  mensaje: string;
  cliente_id: string | null;
  obra_id: number | null;
  presupuesto_id: number | null;
  creada_en: string;
  leida_en: string | null;
};

const etiquetas = {
  cotizacion: "Solicitud de presupuesto",
  presupuesto: "Presupuesto registrado",
  obra: "Asignación de obra",
};

export default function NotificacionesPage() {
  return <div>
    <PageHeader title="Notificaciones" />
    <Bandeja />
  </div>;
}

function Bandeja() {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [leyendo, setLeyendo] = useState<number | null>(null);
  const [soloNuevos, setSoloNuevos] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setCargando(true);
    setError("");
    api<Aviso[]>("/notificaciones", { signal: controller.signal })
      .then(setAvisos)
      .catch(error => {
        if (controller.signal.aborted) return;
        setError(error instanceof ApiError && error.status === 404
          ? "Las notificaciones aún no están disponibles en el servidor. Reinicia el backend y pulsa Actualizar avisos."
          : mensajeError(error));
      })
      .finally(() => { if (!controller.signal.aborted) setCargando(false); });
    return () => controller.abort();
  }, [revision]);

  async function marcarLeida(id: number) {
    if (leyendo !== null) return;
    setLeyendo(id);
    setError("");
    try {
      const aviso = await api<Pick<Aviso, "id" | "leida_en">>(`/notificaciones/${id}/leer`, { method: "PATCH" });
      setAvisos(actuales => actuales.map(item => item.id === aviso.id ? { ...item, ...aviso } : item));
      window.dispatchEvent(new Event("fyag:notificaciones"));
    } catch (error) { setError(mensajeError(error)); }
    finally { setLeyendo(null); }
  }

  const visibles = soloNuevos ? avisos.filter(aviso => !aviso.leida_en) : avisos;
  return <>
    <PuntoGuia id="filtro-avisos" />
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <Button variant="outline" disabled={cargando} onClick={() => setRevision(v => v + 1)}>
        <RefreshCw className="size-4" aria-hidden="true" /> Actualizar avisos
      </Button>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input type="checkbox" checked={soloNuevos} onChange={event => setSoloNuevos(event.target.checked)} className="size-5 accent-primary" />
        Mostrar solo no leídas
      </label>
    </div>
    <PuntoGuia id="lista-avisos" />
    {error && <p role="alert" className="fyag-error mb-4">{error}</p>}
    {cargando && <p role="status" className="text-muted-foreground">Cargando avisos…</p>}
    {!error && !cargando && !visibles.length && (
      <div className="grid justify-items-center gap-3 rounded-2xl border border-border bg-card px-4 py-12 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground"><Bell className="size-6" aria-hidden="true" /></span>
        <p className="font-semibold">{soloNuevos ? "No hay avisos sin leer." : "No hay notificaciones."}</p>
      </div>
    )}
    <ul className="grid gap-3">
      {visibles.map(aviso => <li key={aviso.id}>
        <Card className={aviso.leida_en ? undefined : "border-l-4 border-l-primary"}>
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted text-primary">
                {aviso.tipo === "obra" ? <BriefcaseBusiness className="size-4" aria-hidden="true" /> : <FileText className="size-4" aria-hidden="true" />}
              </span>
              <span>{aviso.presupuesto_id ? "Revisión de presupuesto" : etiquetas[aviso.tipo]}</span>
              <time dateTime={aviso.creada_en}>{shortDate(aviso.creada_en)}</time>
              {!aviso.leida_en && <span className="font-semibold text-primary">Sin leer</span>}
            </div>
            <h2 className="mt-2 break-words text-lg font-semibold">{aviso.titulo}</h2>
            <p className="mt-2 whitespace-pre-wrap break-words">{aviso.mensaje}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {aviso.tipo === "cotizacion" && aviso.cliente_id && <Link className="py-2 font-semibold text-primary underline"
                to={`/app/presupuestos?cotizar=${encodeURIComponent(aviso.cliente_id)}&solicitud=${aviso.id}`} state={{ antecedentes: aviso.mensaje }}>Preparar presupuesto</Link>}
              {aviso.presupuesto_id && <Link className="py-2 font-semibold text-primary underline"
                to={`/app/presupuestos?revisar=${aviso.presupuesto_id}`}>Revisar presupuesto</Link>}
              {aviso.tipo === "presupuesto" && !aviso.presupuesto_id && <Link className="py-2 font-semibold text-primary underline" to="/app/obras">Ir a Obras</Link>}
              {aviso.tipo === "obra" && aviso.obra_id && <Link className="py-2 font-semibold text-primary underline"
                to={`/app/obras/${aviso.obra_id}`}>Ver obra asignada</Link>}
              {!aviso.leida_en && <Button variant="outline" disabled={leyendo !== null} onClick={() => void marcarLeida(aviso.id)}>
                <Check className="size-4" aria-hidden="true" /> Marcar como leída
              </Button>}
            </div>
          </CardContent>
        </Card>
      </li>)}
    </ul>
  </>;
}
