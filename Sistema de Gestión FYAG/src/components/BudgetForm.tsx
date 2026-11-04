import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { clientes } from "@/data/mockData";
import { currency } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import type { ItemPresupuesto, TipoServicio } from "@/types";

export default function BudgetForm({ onDone }: { onDone: () => void }) {
  const agregar = useAppStore((state) => state.agregarPresupuesto);
  const [clienteId, setClienteId] = useState("");
  const [tipo, setTipo] = useState<TipoServicio>("Proyecto");
  const [items, setItems] = useState<ItemPresupuesto[]>([{ id: "new-1", descripcion: "", cantidad: 1, precioUnitario: 0 }]);
  const total = items.reduce((sum, item) => sum + item.cantidad * item.precioUnitario, 0);
  const update = (id: string, key: keyof ItemPresupuesto, value: string | number) => setItems((current) => current.map((item) => item.id === id ? { ...item, [key]: value } : item));
  const save = () => {
    if (!clienteId || items.some((item) => !item.descripcion || item.precioUnitario <= 0)) return toast.error("Completa el cliente y todos los ítems del presupuesto.");
    agregar({ id: `p${Date.now()}`, folio: `PRE-${2500 + Math.floor(Math.random() * 99)}`, clienteId, fecha: new Date().toISOString().slice(0, 10), estado: "Borrador", tipo, items, total });
    toast.success("Presupuesto guardado como borrador."); onDone();
  };
  return <div className="mt-6 grid gap-5"><div className="grid gap-4 sm:grid-cols-2"><Field label="Cliente"><Select value={clienteId} onChange={(e) => setClienteId(e.target.value)}><option value="">Seleccionar cliente</option>{clientes.map((c) => <option key={c.id} value={c.id}>{c.razonSocial}</option>)}</Select></Field><Field label="Tipo de servicio"><Select value={tipo} onChange={(e) => setTipo(e.target.value as TipoServicio)}>{["Proyecto", "Mantención", "Climatización", "Proyecto eléctrico", "Emergencia", "Garantía", "Venta de repuestos", "Mejoras"].map((value) => <option key={value}>{value}</option>)}</Select></Field></div>
    <div className="grid gap-3"><div className="text-sm font-bold">Ítems del presupuesto</div>{items.map((item, index) => <div className="grid grid-cols-12 gap-2 rounded-lg border border-border p-3" key={item.id}><Field label={index === 0 ? "Descripción" : ""} className="col-span-12 sm:col-span-6"><Input value={item.descripcion} onChange={(e) => update(item.id, "descripcion", e.target.value)} /></Field><Field label={index === 0 ? "Cantidad" : ""} className="col-span-4 sm:col-span-2"><Input type="number" min="1" value={item.cantidad} onChange={(e) => update(item.id, "cantidad", Number(e.target.value))} /></Field><Field label={index === 0 ? "Valor unitario" : ""} className="col-span-6 sm:col-span-3"><Input type="number" min="0" value={item.precioUnitario} onChange={(e) => update(item.id, "precioUnitario", Number(e.target.value))} /></Field><div className="col-span-2 flex items-end"><Button variant="ghost" size="icon" disabled={items.length === 1} onClick={() => setItems((current) => current.filter((value) => value.id !== item.id))}><Trash2 className="size-4 text-danger" /></Button></div></div>)}<Button variant="outline" onClick={() => setItems((current) => [...current, { id: `new-${Date.now()}`, descripcion: "", cantidad: 1, precioUnitario: 0 }])}><Plus className="size-4" />Agregar ítem</Button></div>
    <div className="rounded-lg bg-surface p-4 text-right"><div className="text-sm text-muted-foreground">Total neto</div><div className="text-2xl font-bold text-primary">{currency(total)}</div></div><Button onClick={save}>Guardar presupuesto</Button>
  </div>;
}
