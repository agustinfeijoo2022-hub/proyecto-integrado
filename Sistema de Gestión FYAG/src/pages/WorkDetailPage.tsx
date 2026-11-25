import { useState, useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Check, Clock3, UserRound } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { Muted, SectionTitle } from "@/components/ui/typography";
import { usePermissions } from "@/hooks/usePermissions";
import { api, mensajeError } from "@/lib/api";
import { shortDate } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import type { EstadoObra } from "@/types";
import MaterialCatalogField, { type ArticuloMaterial } from "@/components/MaterialCatalogField";
import { TablaMateriales, type MaterialObra } from "@/components/TablaMateriales";
import WorkMaterialsManager from "@/components/WorkMaterialsManager";

const steps = ["Presupuesto Aprobado", "En proceso", "Finalizada", "Cierre comercial"];

const accionesEstado: { estado: EstadoObra; etiqueta: string }[] = [
  { estado: "Finalizada", etiqueta: "Marcar como finalizada" },
  { estado: "Suspendida", etiqueta: "Suspender obra" },
  { estado: "En proceso", etiqueta: "Reanudar obra" },
  { estado: "Cierre comercial", etiqueta: "Realizar cierre comercial" },
  { estado: "Cancelada", etiqueta: "Cancelar obra" },
];

export default function WorkDetailPage() {
  const { id } = useParams();
  const obras = useAppStore((state) => state.obras);
  const fetchObras = useAppStore((state) => state.fetchObras);
  const usuario = useAppStore((state) => state.usuario);
  const { puedeGestionarObras } = usePermissions();
  const actualizar = useAppStore((state) => state.actualizarObra);

  const obra = obras.find((item) => item.id === Number(id));
  const [tecnicos, setTecnicos] = useState<{ id: string; nombre: string }[]>([]);
  const [tecnico, setTecnico] = useState("");
  const [catalogo, setCatalogo] = useState<ArticuloMaterial[]>([]);
  const [resumen, setResumen] = useState<MaterialObra[]>([]);
  const [errorMateriales, setErrorMateriales] = useState("");
  const [versionMateriales, setVersionMateriales] = useState(0);
  const obraId = obra?.id;

  useEffect(() => {
    if (!obraId) return;
    const controller = new AbortController();
    setErrorMateriales("");
    Promise.all([
      api<ArticuloMaterial[]>("/obras/catalogo", { signal: controller.signal }),
      api<MaterialObra[]>(`/obras/${obraId}/materiales`, { signal: controller.signal }),
    ]).then(([articulos, materiales]) => { setCatalogo(articulos); setResumen(materiales); })
      .catch(error => { if (!controller.signal.aborted) setErrorMateriales(mensajeError(error)); });
    return () => controller.abort();
  }, [obraId, versionMateriales]);

  const refrescarMateriales = () => setVersionMateriales(version => version + 1);

  const [materiales, setMateriales] = useState([{ codigo: "", cantidad: "" }]);
  const [avance, setAvance] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    let vigente = true;
    void fetchObras().finally(() => { if (vigente) setCargado(true); });
    return () => { vigente = false; };
  }, [fetchObras]);

  useEffect(() => {
    if (!puedeGestionarObras) return;
    api<{ id: string; nombre: string }[]>("/obras/tecnicos").then(setTecnicos)
      .catch(error => toast.error(mensajeError(error)));
  }, [puedeGestionarObras]);

  // Usamos un useEffect para actualizar el estado local del técnico cuando la obra cambie
  useEffect(() => {
    if (obra) {
      setTecnico(obra.tecnico_id || "");
      setAvance(String(obra.avance));
    }
  }, [obra]);

  // Validaciones de seguridad DESPUÉS de los hooks
  const regreso = usuario?.rol === "Técnico" ? "/app/mis-obras" : "/app/obras";
  if (!cargado) return <p role="status">Cargando obra…</p>;
  if (!obra) return <Navigate to={regreso} replace />;

  if (usuario?.rol === "Técnico" && obra.tecnico_id !== usuario.tecnicoId) {
    return <Navigate to={regreso} replace />;
  }

  const destinos = ("transiciones_disponibles" in obra && Array.isArray(obra.transiciones_disponibles))
    ? obra.transiciones_disponibles as EstadoObra[] : null;
  const current = obra.estado === "En proceso" ? 1 : obra.estado === "Finalizada" ? 2 : obra.estado === "Cierre comercial" ? 3 : 1;

  const guardar = async (cambios: Parameters<typeof actualizar>[1], mensaje: string) => {
    if (guardando) return;
    setGuardando(true);
    try {
      await actualizar(obra.id, cambios);
      if (cambios.materiales?.length) refrescarMateriales();
      toast.success(mensaje);
    } catch (error) { toast.error(mensajeError(error)); }
    finally { setGuardando(false); }
  };

  const transition = (destino: EstadoObra) => {
    void guardar({ estado: destino }, `Obra actualizada a ${destino}.`);
  };

  const guardarTecnico = () => {
    const lista = materiales.filter(item => item.codigo.trim() || item.cantidad)
      .map(item => ({
        codigo: catalogo.find(a => a.codigo.toLowerCase() === item.codigo.trim().toLowerCase())?.codigo ?? "",
        cantidad: Number(item.cantidad),
      }));
    if (!tecnico || lista.some(item => !item.codigo || !(item.cantidad > 0)))
      return toast.error("Selecciona un técnico y usa códigos del catálogo con cantidades positivas.");
    void guardar({ tecnico_id: tecnico, materiales: obra.tecnico_id ? [] : lista }, "Asignación guardada.");
  };

  return (
    <div>
      <PageHeader area="seguimiento"
        title={`${obra.codigo} · ${obra.nombre}`}
        description={`${obra.cliente_nombre || obra.cliente_id} · Inicio ${shortDate(obra.inicio)}`}
        actions={<StatusBadge status={obra.estado} />}
      />

      <Card>
        <CardContent className="p-5 sm:p-7">
          <div className="grid grid-cols-4">
            {steps.map((step, index) => (
              <div key={step} className="relative text-center">
                <div className={`absolute left-0 top-4 h-0.5 w-full ${index <= current ? "bg-primary" : "bg-border"} ${index === 0 ? "left-1/2 w-1/2" : index === 3 ? "w-1/2" : ""}`} />
                <div className={`relative mx-auto grid size-8 place-items-center rounded-full border-2 ${index <= current ? "border-primary bg-primary text-white" : "border-border bg-white dark:bg-slate-800 text-muted-foreground"}`}>
                  {index < current ? <Check className="size-4" /> : <span className="text-xs font-bold">{index + 1}</span>}
                </div>
                <div className={`mt-2 text-xs font-medium ${index <= current ? "text-primary" : "text-muted-foreground"}`}>{step}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><SectionTitle>Información de la obra</SectionTitle></CardHeader>
          <CardContent>
            <div className="grid gap-5 sm:grid-cols-2">
              <Info label="Tipo de servicio" value={obra.tipo} />
              <Info label="Fecha de inicio" value={shortDate(obra.inicio)} />
              <Info label="Presupuesto origen" value={obra.presupuesto_folio ?? (obra.presupuesto_id ? "Folio no disponible" : "—")} />
              <Info label="Avance informado" value={`${obra.avance}%`} />
            </div>
            <div className="mt-6">
              <div className="mb-2 h-2.5 rounded-full bg-muted">
                <div className="h-full rounded-full bg-info" style={{ width: `${obra.avance}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><SectionTitle>Gestión operacional</SectionTitle></CardHeader>
          <CardContent className="grid gap-4">
            {puedeGestionarObras ? (
              <Field label="Técnico asignado">
                <Select value={tecnico} onChange={(event) => setTecnico(event.target.value)}>
                  <option value="">Sin asignar</option>
                  {obra.tecnico_id && !tecnicos.some(item => item.id === obra.tecnico_id) &&
                    <option value={obra.tecnico_id}>{obra.tecnico_id}</option>}
                  {tecnicos.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                </Select>
              </Field>
            ) : (
              <Info label="Técnico asignado" value={usuario?.tecnicoId === obra.tecnico_id && usuario ? usuario.nombre : "Sin asignar"} />
            )}

            {puedeGestionarObras && (
              <>
                {!obra.tecnico_id && (
                  <div className="grid gap-2">
                    <p className="text-sm font-medium">Materiales que se descontarán al asignar</p>
                    {materiales.map((item, indice) => (
                      <div key={indice} className="grid grid-cols-2 gap-2">
                        <MaterialCatalogField etiqueta={`Código del material ${indice + 1}`} catalogo={catalogo} codigo={item.codigo}
                          onChange={codigo => setMateriales(items => items.map((valor, i) => i === indice ? { ...valor, codigo } : valor))} />
                        <Input aria-label={`Cantidad del material ${indice + 1}`} placeholder="Cantidad" type="number" min="0" step="any" value={item.cantidad}
                          onChange={event => setMateriales(items => items.map((valor, i) => i === indice ? { ...valor, cantidad: event.target.value } : valor))} />
                      </div>
                    ))}
                    <Button variant="outline" onClick={() => setMateriales(items => [...items, { codigo: "", cantidad: "" }])}>Añadir material</Button>
                  </div>
                )}
                <Button disabled={guardando || !tecnico} onClick={guardarTecnico} variant="outline"><UserRound className="size-4" />Guardar asignación</Button>
                <Field label="Avance informado (%)">
                  <Input type="number" min="0" max="100" value={avance} onChange={event => setAvance(event.target.value)} />
                </Field>
                <Button variant="outline" disabled={guardando || !avance || !Number.isInteger(Number(avance)) || Number(avance) < 0 || Number(avance) > 100}
                  onClick={() => void guardar({ avance: Number(avance) }, "Avance guardado.")}>Guardar avance</Button>
                <div className="border-t border-border pt-4">
                  <Muted className="mb-3">Cambiar estado</Muted>
                  <div className="grid gap-2">
                    {accionesEstado.filter(accion => destinos?.includes(accion.estado)).map(({ estado, etiqueta }) => (
                      <Button key={estado} disabled={guardando} variant={estado === "Cancelada" ? "danger" : "outline"}
                        onClick={() => transition(estado)}>{etiqueta}</Button>
                    ))}
                    {destinos === null ? (
                      <p role="alert" className="fyag-error">El servidor todavía no informa los cambios de estado. Reinicia el backend de FYAG y recarga esta página.</p>
                    ) : !destinos.length && <Muted>No hay cambios de estado disponibles para esta obra.</Muted>}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <TablaMateriales materiales={resumen} error={errorMateriales} />
      {usuario?.rol === "Técnico" && ["En proceso", "Suspendida"].includes(obra.estado) &&
        <div className="mt-6"><WorkMaterialsManager obraId={obra.id} catalogo={catalogo} onMovimiento={refrescarMateriales} /></div>}

      <Card className="mt-6">
        <CardHeader><SectionTitle>Historial de cambios</SectionTitle></CardHeader>
        <CardContent>
          <div className="space-y-5">
            {!obra.historial?.length && <Muted>Todavía no hay cambios registrados.</Muted>}
            {obra.historial?.slice().reverse().map(({ detalle, fecha }, index) => (
              <div className="flex gap-3" key={`${fecha}-${index}`}>
                <div className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-light text-primary"><Clock3 className="size-4" /></div>
                <div><div className="text-sm font-semibold">{detalle}</div><Muted>{new Date(fecha).toLocaleString("es-CL")}</Muted></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><Muted>{label}</Muted><div className="mt-1 font-semibold">{value}</div></div>;
}