import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { validarCreacionObra } from "@/lib/businessRules";
import { useAppStore } from "@/store/useAppStore";

export default function NewWorkDialog() {
  const presupuestos = useAppStore((state) => state.presupuestos);
  const agregarObra = useAppStore((state) => state.agregarObra);
  const [open, setOpen] = useState(false);
  const [presupuestoId, setPresupuestoId] = useState("");
  const [nombre, setNombre] = useState("");
  const create = () => {
    const presupuesto = presupuestos.find((item) => item.id === presupuestoId);
    const error = validarCreacionObra(presupuesto);
    if (error) return toast.error(error);
    if (!nombre.trim() || !presupuesto) return toast.error("Ingresa un nombre para la obra.");
    agregarObra({
      id: `o${Date.now()}`, codigo: `OB-${1100 + Math.floor(Math.random() * 99)}`, nombre,
      clienteId: presupuesto.clienteId, presupuestoId, estado: "En proceso", tipo: presupuesto.tipo,
      fechaInicio: new Date().toISOString().slice(0, 10), avance: 0,
    });
    toast.success("Obra creada correctamente.");
    setOpen(false); setNombre(""); setPresupuestoId("");
  };
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button><Plus className="size-4" />Nueva Obra</Button></DialogTrigger><DialogContent><DialogTitle>Crear nueva obra</DialogTitle><DialogDescription>Solo podrás utilizar presupuestos aprobados.</DialogDescription><div className="mt-6 grid gap-4"><Field label="Presupuesto de origen"><Select value={presupuestoId} onChange={(event) => setPresupuestoId(event.target.value)}><option value="">Seleccionar presupuesto</option>{presupuestos.map((item) => <option key={item.id} value={item.id}>{item.folio} · {item.estado}</option>)}</Select></Field><Field label="Nombre de la obra"><Input value={nombre} onChange={(event) => setNombre(event.target.value)} placeholder="Ej. Ampliación cámara frigorífica" /></Field><Button onClick={create}>Crear obra</Button></div></DialogContent></Dialog>;
}
