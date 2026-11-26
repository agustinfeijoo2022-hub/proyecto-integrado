import { useEffect, useState } from "react";
import { ClipboardPaste, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import MaterialCatalogField, { type ArticuloMaterial } from "@/components/MaterialCatalogField";
import { api, mensajeError } from "@/lib/api";
import type { Cliente } from "@/types";
import { currency } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import type { ItemPresupuesto, TipoServicio } from "@/types";

const maxPartidas = 100;
const partidaVacia = (): ItemPresupuesto => ({
  id: crypto.randomUUID(), descripcion: "", cantidad: 1, precioUnitario: 0,
});

function numeroPegado(texto: string, moneda = false) {
  const limpio = moneda ? texto.replace(/^\$\s*/, "").replace(/\s+/g, "") : texto;
  const normalizado = moneda && /^\d{1,3}(\.\d{3})+$/.test(limpio)
    ? limpio.replace(/\./g, "") : limpio.replace(",", ".");
  return /^\d+(\.\d+)?$/.test(normalizado) ? Number(normalizado) : NaN;
}

export default function BudgetForm({ onDone, clienteInicial = "", solicitudId }: { onDone: () => void; clienteInicial?: string; solicitudId?: number }) {
  const agregarPresupuestoDB = useAppStore((state) => state.agregarPresupuesto);
  const presupuestosExistentes = useAppStore((state) => state.presupuestos);
  
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [errorClientes, setErrorClientes] = useState("");
  const [catalogo, setCatalogo] = useState<ArticuloMaterial[]>([]);
  const [errorCatalogo, setErrorCatalogo] = useState("");
  const [materiales, setMateriales] = useState<{ id: string; codigo: string; cantidad: string }[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    api<Cliente[]>("/clientes", { signal: controller.signal }).then(setClientes)
      .catch(error => { if (!controller.signal.aborted) setErrorClientes(mensajeError(error)); });
    api<ArticuloMaterial[]>("/articulos", { signal: controller.signal }).then(setCatalogo)
      .catch(error => { if (!controller.signal.aborted) setErrorCatalogo(mensajeError(error)); });
    return () => controller.abort();
  }, []);
  const [clienteId, setClienteId] = useState(clienteInicial);
  const [tipo, setTipo] = useState<TipoServicio>("Proyecto");
  const [items, setItems] = useState<ItemPresupuesto[]>([{ id: "new-1", descripcion: "", cantidad: 1, precioUnitario: 0 }]);
  const [guardando, setGuardando] = useState(false);
  const [cargaAbierta, setCargaAbierta] = useState(false);
  const [textoPartidas, setTextoPartidas] = useState("");
  const [errorCarga, setErrorCarga] = useState("");
  
  const total = Math.round(items.reduce((sum, item) => sum + item.cantidad * item.precioUnitario, 0));
  const update = (id: string, key: keyof ItemPresupuesto, value: string | number) => 
    setItems((current) => current.map((item) => item.id === id ? { ...item, [key]: value } : item));

  function agregarVarias() {
    setErrorCarga("");
    const filas = textoPartidas.split(/\r?\n/).map((texto, indice) => ({ texto, linea: indice + 1 }))
      .filter(fila => fila.texto.trim());
    if (!filas.length) {
      setErrorCarga("Pega al menos una partida.");
      return;
    }
    const existentes = items.filter(item => item.descripcion.trim() || item.cantidad !== 1 || item.precioUnitario !== 0);
    if (filas.length + existentes.length > maxPartidas) {
      setErrorCarga(`El presupuesto permite hasta ${maxPartidas} partidas en total.`);
      return;
    }
    const nuevas = [];
    for (const { texto, linea } of filas) {
      const columnas = texto.split(texto.includes("\t") ? "\t" : "|").map(celda => celda.trim());
      const [descripcion, cantidadTexto = "", precioTexto = ""] = columnas;
      const cantidad = numeroPegado(cantidadTexto);
      const precioUnitario = numeroPegado(precioTexto, true);
      if (columnas.length !== 3 || !descripcion || descripcion.length > 250 ||
          !(cantidad > 0 && cantidad <= 1e9) || !(precioUnitario > 0 && precioUnitario <= 2147483647)) {
        setErrorCarga(`Línea ${linea}. Revisa que tenga descripción, cantidad y precio unitario. Usa números positivos.`);
        return;
      }
      nuevas.push({ id: crypto.randomUUID(), descripcion, cantidad, precioUnitario });
    }
    setItems([...existentes, ...nuevas]);
    setTextoPartidas("");
    setCargaAbierta(false);
    toast.success(`${nuevas.length} ${nuevas.length === 1 ? "partida agregada" : "partidas agregadas"}.`);
  }

  const save = async () => {
    if (!clienteId || !(total > 0) || items.some(item => !item.descripcion.trim() || !(item.cantidad > 0) || !(item.precioUnitario > 0))) {
      return toast.error("Selecciona un cliente y completa la descripción, cantidad y precio de cada partida.");
    }
    const previstos = materiales.map(item => ({
      codigo: catalogo.find(a => a.codigo.toLowerCase() === item.codigo.trim().toLowerCase())?.codigo,
      cantidad: Number(item.cantidad),
    }));
    if (previstos.some(item => !item.codigo || !(item.cantidad > 0)))
      return toast.error("Selecciona códigos válidos y cantidades positivas para los materiales.");
    if (new Set(previstos.map(item => item.codigo)).size !== previstos.length)
      return toast.error("Agrupa las cantidades por código de material.");
    setGuardando(true);

    let siguienteNumero = 1;
    if (presupuestosExistentes.length > 0) {
      const numeros = presupuestosExistentes.map(p => parseInt(p.folio.replace(/[^0-9]/g, ""), 10) || 0);
      siguienteNumero = Math.max(...numeros) + 1;
    }
    const nuevoFolio = `PRE-${String(siguienteNumero).padStart(4, "0")}`;

    const exito = await agregarPresupuestoDB({
      folio: nuevoFolio,
      cliente_id: clienteId, 
      fecha: new Date().toISOString().slice(0, 10),
      tipo: tipo,
      total: total,
      estado: "Enviado",
      solicitud_id: solicitudId,
      partidas: items.map(({ descripcion, cantidad, precioUnitario }) => ({ descripcion, cantidad, precioUnitario })),
      materiales_previstos: previstos.map(({ codigo, cantidad }) => ({ codigo: codigo!, cantidad }))
    });

    if (exito) {
      toast.success(`Presupuesto ${nuevoFolio} enviado a Gerencia.`);
      onDone();
    } else {
      toast.error("Hubo un error al guardar en PostgreSQL.");
    }
    setGuardando(false);
  };

  return (
    <div className="mt-6 grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Cliente">
          <Select value={clienteId} onChange={(e) => setClienteId(e.target.value)} disabled={guardando || Boolean(solicitudId && clienteInicial)}>
            <option value="">Seleccionar cliente</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.razonSocial}</option>)}
          </Select>
        </Field>
        {errorClientes && <p role="alert" className="fyag-error">{errorClientes}</p>}
        <Field label="Tipo de servicio">
          <Select value={tipo} onChange={(e) => setTipo(e.target.value as TipoServicio)} disabled={guardando}>
            {["Proyecto", "Mantención", "Climatización", "Proyecto eléctrico", "Emergencia", "Garantía", "Venta de repuestos", "Mejoras"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="grid gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold">Partidas que se cobrarán al cliente</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Incluye conceptos como mano de obra, visitas, traslados y repuestos. Indica cuántas unidades cobrarás y el precio de cada una en pesos chilenos.
            </p>
          </div>
          <Button type="button" variant="outline" disabled={guardando} aria-expanded={cargaAbierta}
            onClick={() => setCargaAbierta(abierta => !abierta)}>
            <ClipboardPaste className="size-4" aria-hidden="true" /> Pegar varias partidas
          </Button>
        </div>
        {cargaAbierta && <div className="grid gap-3 rounded-xl border border-border bg-muted p-4">
          <Field label="Lista de partidas">
            <textarea className="fyag-input font-mono" value={textoPartidas} rows={4} maxLength={40000}
              onChange={event => setTextoPartidas(event.target.value)}
              placeholder={"Mano de obra | 2 | 25000\nTraslado | 1 | 15000"} />
          </Field>
          <p className="text-sm text-muted-foreground">Copia tres columnas de Excel sin encabezados o escribe una partida por línea en el orden descripción, cantidad y precio unitario, separadas por |.</p>
          {errorCarga && <p role="alert" className="fyag-error">{errorCarga}</p>}
          <Button type="button" className="justify-self-start" disabled={guardando} onClick={agregarVarias}>Agregar partidas de la lista</Button>
        </div>}
        {items.map(item => (
          <div className="grid grid-cols-12 items-end gap-2 rounded-lg border border-border p-3" key={item.id}>
            <Field label="Concepto a cobrar" className="col-span-12 md:col-span-5">
              <Input placeholder="Ej. Mano de obra de mantención" maxLength={250} value={item.descripcion} onChange={(e) => update(item.id, "descripcion", e.target.value)} disabled={guardando} />
            </Field>
            <Field label="Cantidad" className="col-span-5 md:col-span-2">
              <Input type="number" step="any" min="0" value={item.cantidad || ""} onChange={(e) => update(item.id, "cantidad", Number(e.target.value))} disabled={guardando} />
            </Field>
            <Field label="Precio unitario (CLP)" className="col-span-5 md:col-span-4">
              <Input type="number" min="0" placeholder="25000" value={item.precioUnitario || ""} onChange={(e) => update(item.id, "precioUnitario", Number(e.target.value))} disabled={guardando} />
            </Field>
            <div className="col-span-2 flex items-end justify-end md:col-span-1">
              <Button aria-label="Quitar partida" variant="ghost" size="icon" disabled={items.length === 1 || guardando} onClick={() => setItems((current) => current.filter((value) => value.id !== item.id))}>
                <Trash2 className="size-4 text-danger" />
              </Button>
            </div>
          </div>
        ))}
        <Button variant="outline" onClick={() => setItems((current) => [...current, partidaVacia()])} disabled={guardando || items.length >= maxPartidas}>
          <Plus className="size-4" />Agregar una partida
        </Button>
      </div>
      <section className="grid gap-3 rounded-lg border border-border p-3">
        <h3 className="font-semibold">Materiales previstos para Bodega</h3>
        <p className="text-sm text-muted-foreground">Agrega los códigos y cantidades que se usarán en la obra. Bodega recibe esta lista sin precios.</p>
        {errorCatalogo && <p role="alert" className="fyag-error">{errorCatalogo}</p>}
        {materiales.map(item => <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_8rem_auto] sm:items-end" key={item.id}>
          <MaterialCatalogField etiqueta="Código del material previsto" catalogo={catalogo} codigo={item.codigo}
            onChange={codigo => setMateriales(lista => lista.map(m => m.id === item.id ? { ...m, codigo } : m))} />
          <Field label="Cantidad prevista">
            <Input type="number" step="any" min="0" value={item.cantidad} disabled={guardando}
              onChange={e => setMateriales(lista => lista.map(m => m.id === item.id ? { ...m, cantidad: e.target.value } : m))} />
          </Field>
          <Button type="button" variant="outline" disabled={guardando} onClick={() => setMateriales(lista => lista.filter(m => m.id !== item.id))}>Quitar</Button>
        </div>)}
        <Button type="button" variant="outline" className="justify-self-start" disabled={guardando || !!errorCatalogo || materiales.length >= 50}
          onClick={() => setMateriales(lista => [...lista, { id: crypto.randomUUID(), codigo: "", cantidad: "" }])}>
          <Plus className="size-4" /> Agregar material
        </Button>
      </section>
      <div className="rounded-lg bg-surface p-4 text-right">
        <div className="text-sm text-muted-foreground">Total neto</div>
        <div className="text-2xl font-bold text-primary">{currency(total)}</div>
      </div>
      <Button onClick={save} disabled={guardando}>
        {guardando ? "Guardando en Postgres..." : "Guardar presupuesto"}
      </Button>
    </div>
  );
}