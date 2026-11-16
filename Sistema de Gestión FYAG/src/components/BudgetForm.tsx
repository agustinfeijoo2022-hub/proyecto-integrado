import { useRef, useState } from "react";
import { Plus, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { clientes } from "@/data/mockData";
import { crearPresupuesto, mensajeError } from "@/lib/api";
import { aNumero, calcularTotales, itemsParaEnviar, tiposServicio, validarFormulario, type ItemEditable } from "@/lib/presupuestos";
import { currency } from "@/lib/utils";
import type { EstadoPresupuesto, Presupuesto, TipoServicio } from "@/types";

const MAX_ITEMS = 50;

export default function BudgetForm({ onCreated }: { onCreated: (presupuesto: Presupuesto) => void }) {
  const siguienteId = useRef(1);
  const nuevoItem = (): ItemEditable => ({ id: `item-${siguienteId.current++}`, descripcion: "", cantidad: "1", precioUnitario: "" });

  const [clienteId, setClienteId] = useState("");
  const [tipo, setTipo] = useState<TipoServicio>("Proyecto");
  const [items, setItems] = useState<ItemEditable[]>(() => [nuevoItem()]);
  const [intentado, setIntentado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  // Vista previa del total: valores no válidos cuentan como 0 hasta que se corrigen.
  const totales = calcularTotales(items.map((item) => {
    const cantidad = aNumero(item.cantidad), precio = aNumero(item.precioUnitario);
    return { cantidad: Number.isFinite(cantidad) && cantidad > 0 ? cantidad : 0, precioUnitario: Number.isFinite(precio) && precio > 0 ? precio : 0 };
  }));
  const validacion = validarFormulario(clienteId, items);

  const actualizar = (id: string, campo: keyof Omit<ItemEditable, "id">, valor: string) =>
    setItems((actuales) => actuales.map((item) => (item.id === id ? { ...item, [campo]: valor } : item)));

  const guardar = async (estado: Extract<EstadoPresupuesto, "Borrador" | "Enviado">) => {
    setIntentado(true);
    setError("");
    if (!validacion.valido) return;
    setGuardando(true);
    try {
      const presupuesto = await crearPresupuesto({ clienteId, tipo, estado, items: itemsParaEnviar(items) });
      toast.success(`Presupuesto ${presupuesto.folio} ${estado === "Enviado" ? "guardado y enviado" : "guardado como borrador"}.`);
      onCreated(presupuesto);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  };

  const errorCliente = intentado ? validacion.cliente : undefined;
  // El aviso de validación se calcula en cada render: desaparece solo cuando los datos ya son correctos.
  const avisoValidacion = intentado && !validacion.valido ? "Revisa los campos marcados antes de guardar." : "";

  return (
    <form className="mt-6 grid gap-5" noValidate onSubmit={(e) => { e.preventDefault(); void guardar("Borrador"); }}>
      <fieldset disabled={guardando} className="grid gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cliente">
            <Select value={clienteId} onChange={(e) => setClienteId(e.target.value)} aria-invalid={!!errorCliente}>
              <option value="">Seleccionar cliente</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.razonSocial}</option>)}
            </Select>
            {errorCliente && <span className="text-xs font-normal text-danger">{errorCliente}</span>}
          </Field>
          <Field label="Tipo de servicio">
            <Select value={tipo} onChange={(e) => setTipo(e.target.value as TipoServicio)}>
              {tiposServicio.map((value) => <option key={value}>{value}</option>)}
            </Select>
          </Field>
        </div>

        <div className="grid gap-3">
          <div className="text-sm font-bold">Ítems del presupuesto</div>
          {items.map((item, index) => {
            const mensaje = intentado ? validacion.items[item.id] : undefined;
            return (
              <div key={item.id} className={`rounded-lg border p-3 ${mensaje ? "border-danger" : "border-border"}`}>
                <div className="grid grid-cols-12 gap-2">
                  <Field label={index === 0 ? "Descripción" : ""} className="col-span-12 sm:col-span-6">
                    <Input value={item.descripcion} maxLength={160} aria-label={`Descripción del ítem ${index + 1}`} onChange={(e) => actualizar(item.id, "descripcion", e.target.value)} />
                  </Field>
                  <Field label={index === 0 ? "Cantidad" : ""} className="col-span-4 sm:col-span-2">
                    <Input type="number" min="0" step="any" value={item.cantidad} aria-label={`Cantidad del ítem ${index + 1}`} onChange={(e) => actualizar(item.id, "cantidad", e.target.value)} />
                  </Field>
                  <Field label={index === 0 ? "Valor unitario (neto)" : ""} className="col-span-6 sm:col-span-3">
                    <Input type="number" min="0" step="1" value={item.precioUnitario} aria-label={`Valor unitario del ítem ${index + 1}`} onChange={(e) => actualizar(item.id, "precioUnitario", e.target.value)} />
                  </Field>
                  <div className="col-span-2 flex items-end sm:col-span-1">
                    <Button type="button" variant="ghost" size="icon" aria-label={`Quitar ítem ${index + 1}`} disabled={items.length === 1} onClick={() => setItems((actuales) => actuales.filter((value) => value.id !== item.id))}>
                      <Trash2 className="size-4 text-danger" />
                    </Button>
                  </div>
                </div>
                {mensaje && <p className="mt-2 text-xs text-danger">{mensaje}</p>}
              </div>
            );
          })}
          <Button type="button" variant="outline" disabled={items.length >= MAX_ITEMS} onClick={() => setItems((actuales) => [...actuales, nuevoItem()])}>
            <Plus className="size-4" />Agregar ítem
          </Button>
        </div>
      </fieldset>

      <dl className="grid gap-2 rounded-lg bg-surface p-4 text-sm" aria-live="polite">
        <div className="flex justify-between"><dt className="text-muted-foreground">Neto</dt><dd>{currency(totales.neto)}</dd></div>
        <div className="flex justify-between"><dt className="text-muted-foreground">IVA (19%)</dt><dd>{currency(totales.iva)}</dd></div>
        <div className="flex justify-between border-t border-border pt-2 text-base font-bold"><dt>Total</dt><dd className="text-primary">{currency(totales.total)}</dd></div>
      </dl>

      {(avisoValidacion || error) && <p role="alert" className="fyag-error">{avisoValidacion || error}</p>}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="submit" variant="outline" disabled={guardando}>{guardando ? "Guardando…" : "Guardar borrador"}</Button>
        <Button type="button" disabled={guardando} onClick={() => void guardar("Enviado")}><Send className="size-4" />Guardar y enviar</Button>
      </div>
    </form>
  );
}
