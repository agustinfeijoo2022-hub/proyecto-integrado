import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { validarCreacionObra } from "@/lib/businessRules";
import { useAppStore } from "@/store/useAppStore";
import { api, mensajeError } from "@/lib/api";
import type { PresupuestoDB } from "@/types";


export default function NewWorkDialog() {
  const [presupuestos, setPresupuestos] = useState<PresupuestoDB[]>([]);
  const agregarObra = useAppStore((state) => state.agregarObra);
  
  const [open, setOpen] = useState(false);
  const [presupuestoId, setPresupuestoId] = useState("");
  const [nombre, setNombre] = useState("");
  const [cargando, setCargando] = useState(false);

  // Cada vez que se abre el modal, pedimos los presupuestos frescos a PostgreSQL
  useEffect(() => {
    if (open) {
      setCargando(true);
      api<PresupuestoDB[]>("/presupuestos/aprobados").then(setPresupuestos)
        .catch(error => toast.error(mensajeError(error))).finally(() => setCargando(false));
    }
  }, [open]);

  const presupuesto = presupuestos.find((item) => item.id === Number(presupuestoId));

  const create = async () => {
    const error = validarCreacionObra(presupuesto);
    
    if (error) return toast.error(error);
    if (!nombre.trim() || !presupuesto) return toast.error("Ingresa un nombre para la obra.");

    const inicio = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Santiago",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    setCargando(true);
    const exito = await agregarObra({
      codigo: `OB-${crypto.randomUUID().slice(0, 8)}`,
      nombre,
      cliente_id: presupuesto.cliente_id, 
      presupuesto_id: presupuesto.id,
      tipo: presupuesto.tipo,
      tecnico_id: null,
      inicio,
      estado: "En proceso",
    });

    setCargando(false);
    if (exito) {
      toast.success("Obra creada correctamente.");
      setOpen(false); 
      setNombre(""); 
      setPresupuestoId("");
    } else {
      toast.error("Error al guardar la obra en PostgreSQL.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="size-4" />Nueva Obra</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Crear nueva obra</DialogTitle>
        <DialogDescription>Solo podrás utilizar presupuestos aprobados.</DialogDescription>
        
        <div className="mt-6 grid gap-4">
          <Field label="Presupuesto de origen">
            <Select 
              value={presupuestoId} 
              onChange={(event) => {
                setPresupuestoId(event.target.value);
                const seleccionado = presupuestos.find(item => item.id === Number(event.target.value));
                setNombre(seleccionado?.instrucciones?.trabajo ?? "");
              }}
              disabled={cargando}
            >
              <option value="">{cargando ? "Cargando presupuestos..." : "Seleccionar presupuesto"}</option>
              
              {/* Filtramos solo los aprobados y mostramos más detalles */}
              {presupuestos
                .filter(p => p.estado === "Aprobado")
                .map((item) => {
                  // Buscamos el nombre del cliente real usando el ID
                  const clienteNombre = item.cliente_nombre || item.cliente_id;
                  
                  return (
                    <option key={item.id} value={item.id}>
                      {item.folio} · {clienteNombre} · {item.tipo}
                    </option>
                  );
                })
              }
            </Select>
          </Field>
          
          {presupuesto && <div className="rounded-lg border border-border bg-muted p-3 text-sm">
            {presupuesto.instrucciones && <p className="whitespace-pre-wrap">{presupuesto.instrucciones.alcance}</p>}
            <p className="font-semibold">Materiales previstos</p>
            {presupuesto.materiales_previstos?.length
              ? <ul>{presupuesto.materiales_previstos.map(m => <li key={m.codigo}>{m.codigo} · {m.cantidad}</li>)}</ul>
              : <p>Sin materiales previstos.</p>}
          </div>}
          <Field label="Nombre de la obra">
            <Input 
              value={nombre} 
              onChange={(event) => setNombre(event.target.value)} 
              placeholder="Ej. Ampliación cámara frigorífica" 
            />
          </Field>
          
          <Button onClick={create} disabled={cargando || !presupuestoId}>
            Crear obra
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}