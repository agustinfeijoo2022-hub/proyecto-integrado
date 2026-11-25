import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { api, mensajeError } from "@/lib/api";
import type { Cliente } from "@/types";
import { currency } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import type { ItemPresupuesto, TipoServicio } from "@/types";

export default function BudgetForm({ onDone }: { onDone: () => void }) {
  const agregarPresupuestoDB = useAppStore((state) => state.agregarPresupuesto);
  const presupuestosExistentes = useAppStore((state) => state.presupuestos);

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [errorClientes, setErrorClientes] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    api<Cliente[]>("/clientes", { signal: controller.signal }).then(setClientes)
      .catch(error => { if (!controller.signal.aborted) setErrorClientes(mensajeError(error)); });
    return () => controller.abort();
  }, []);
  const [clienteId, setClienteId] = useState("");
  const [tipo, setTipo] = useState<TipoServicio>("Proyecto");
  const [items, setItems] = useState<ItemPresupuesto[]>([{ id: "new-1", descripcion: "", cantidad: 1, precioUnitario: 0 }]);
  const [guardando, setGuardando] = useState(false);

  const total = items.reduce((sum, item) => sum + item.cantidad * item.precioUnitario, 0);
  const update = (id: string, key: keyof ItemPresupuesto, value: string | number) =>
    setItems((current) => current.map((item) => item.id === id ? { ...item, [key]: value } : item));

  const save = async () => {
    if (!clienteId || items.some((item) => !item.descripcion || item.precioUnitario <= 0)) {
      return toast.error("Completa el cliente y todos los ítems del presupuesto.");
    }
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
      estado: "Enviado"
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
          <Select value={clienteId} onChange={(e) => setClienteId(e.target.value)} disabled={guardando}>
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
        <div className="text-sm font-bold">Ítems del presupuesto</div>
        {items.map((item, index) => (
          <div className="grid grid-cols-12 gap-2 rounded-lg border border-border p-3" key={item.id}>
            <Field label={index === 0 ? "Descripción" : ""} className="col-span-12 sm:col-span-6">
              <Input value={item.descripcion} onChange={(e) => update(item.id, "descripcion", e.target.value)} disabled={guardando} />
            </Field>
            <Field label={index === 0 ? "Cantidad" : ""} className="col-span-4 sm:col-span-2">
              <Input type="number" min="1" value={item.cantidad} onChange={(e) => update(item.id, "cantidad", Number(e.target.value))} disabled={guardando} />
            </Field>
            <Field label={index === 0 ? "Valor unitario" : ""} className="col-span-6 sm:col-span-3">
              <Input type="number" min="0" value={item.precioUnitario} onChange={(e) => update(item.id, "precioUnitario", Number(e.target.value))} disabled={guardando} />
            </Field>
            <div className="col-span-2 flex items-end">
              <Button variant="ghost" size="icon" disabled={items.length === 1 || guardando} onClick={() => setItems((current) => current.filter((value) => value.id !== item.id))}>
                <Trash2 className="size-4 text-danger" />
              </Button>
            </div>
          </div>
        ))}
        <Button variant="outline" onClick={() => setItems((current) => [...current, { id: `new-${Date.now()}`, descripcion: "", cantidad: 1, precioUnitario: 0 }])} disabled={guardando}>
          <Plus className="size-4" />Agregar ítem
        </Button>
      </div>
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