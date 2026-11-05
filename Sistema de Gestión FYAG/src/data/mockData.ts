import type { Auditoria, Cliente, Factura, Obra, Pago, Presupuesto, Tecnico, Usuario } from "@/types";

export const clientes: Cliente[] = [
  ["c1", "Agrovalle del Sur SpA", "76.345.120-1", "María Soto", "maria@agrovalle.cl"],
  ["c2", "Frutícola Los Andes Ltda.", "77.102.456-3", "Felipe Ríos", "felipe@fruticola.cl"],
  ["c3", "Exportadora Campo Norte", "76.890.234-7", "Ana Vera", "ana@camponorte.cl"],
  ["c4", "Lácteos Santa Elisa", "78.231.987-5", "Pablo Díaz", "pablo@santaelisa.cl"],
  ["c5", "Viña Cordillera SpA", "77.654.321-9", "Laura Pérez", "laura@cordillera.cl"],
  ["c6", "Packing Central Ltda.", "76.112.334-8", "Diego Muñoz", "diego@packing.cl"],
  ["c7", "Pesquera Horizonte", "79.442.110-2", "Camila Silva", "camila@horizonte.cl"],
  ["c8", "Semillas del Pacífico", "76.721.903-4", "Tomás León", "tomas@semillas.cl"],
].map(([id, razonSocial, rut, contacto, email]) => ({ id, razonSocial, rut, contacto, email }));

export const tecnicos: Tecnico[] = [
  ["t1", "Matías González", "Refrigeración industrial", "matias@fyag.cl"],
  ["t2", "Carolina Reyes", "Climatización", "carolina@fyag.cl"],
  ["t3", "Benjamín Torres", "Electricidad", "benjamin@fyag.cl"],
  ["t4", "Ignacio Fuentes", "Control industrial", "ignacio@fyag.cl"],
  ["t5", "Josefina Castro", "Mantención", "josefina@fyag.cl"],
  ["t6", "Sebastián Vidal", "Emergencias", "sebastian@fyag.cl"],
].map(([id, nombre, especialidad, email]) => ({ id, nombre, especialidad, email, activo: true }));

const estados = ["Aprobado", "Aprobado", "Aprobado", "Enviado", "Borrador", "Rechazado"] as const;
const tipos = ["Proyecto", "Mantención", "Climatización", "Proyecto eléctrico", "Emergencia", "Garantía", "Venta de repuestos", "Mejoras"] as const;

export const presupuestos: Presupuesto[] = Array.from({ length: 12 }, (_, index) => {
  const cantidad = (index % 3) + 1;
  const precioUnitario = 1450000 + index * 175000;
  return {
    id: `p${index + 1}`,
    folio: `PRE-${String(2401 + index)}`,
    clienteId: `c${(index % 8) + 1}`,
    // CAMBIADO A 2026
    fecha: `2026-${String((index % 6) + 1).padStart(2, "0")}-${String(4 + index).padStart(2, "0")}`,
    estado: estados[index % estados.length],
    tipo: tipos[index % tipos.length],
    items: [{ id: `i${index + 1}`, descripcion: `Servicio de ${tipos[index % tipos.length].toLowerCase()}`, cantidad, precioUnitario }],
    total: cantidad * precioUnitario,
  };
});

const obraEstados = ["En proceso", "Finalizada", "Suspendida", "Cancelada"] as const;
export const obras: Obra[] = Array.from({ length: 15 }, (_, index) => ({
  id: `o${index + 1}`,
  codigo: `OB-${String(1051 + index)}`,
  nombre: [
    "Ampliación cámara de frío", "Mantención túnel IQF", "Climatización sala de procesos",
    "Tablero eléctrico planta", "Reparación compresor", "Renovación evaporadores",
    "Automatización sala de máquinas", "Cambio de refrigerante",
  ][index % 8],
  clienteId: `c${(index % 8) + 1}`,
  presupuestoId: `p${(index % 3) + 1}`,
  tecnicoId: index === 8 ? undefined : `t${(index % 6) + 1}`,
  estado: obraEstados[index % obraEstados.length],
  tipo: tipos[index % tipos.length],
  // CAMBIADO A 2026
  fechaInicio: `2026-${String((index % 6) + 1).padStart(2, "0")}-${String(3 + (index % 20)).padStart(2, "0")}`,
  fechaFin: index % 4 === 1 ? "2026-06-20" : undefined,
  avance: [68, 100, 42, 15][index % 4],
}));

export const facturas: Factura[] = Array.from({ length: 10 }, (_, index) => ({
  id: `f${index + 1}`,
  folio: `F-${String(8801 + index)}`,
  obraId: `o${index + 1}`,
  clienteId: `c${(index % 8) + 1}`,
  // CAMBIADO A 2026
  fechaEmision: `2026-0${(index % 6) + 1}-05`,
  fechaVencimiento: `2026-0${(index % 6) + 1}-28`,
  monto: 2200000 + index * 410000,
  estado: index < 4 ? "Pagada" : index < 7 ? "Vencida" : "Pendiente",
}));

export const pagos: Pago[] = Array.from({ length: 8 }, (_, index) => ({
  id: `pa${index + 1}`, facturaId: `f${(index % 4) + 1}`, obraId: `o${(index % 4) + 1}`,
  // CAMBIADO A 2026
  fecha: `2026-0${(index % 6) + 1}-22`, monto: 1200000 + index * 250000,
  metodo: index % 2 ? "Transferencia" : "Cheque",
}));

export const auditoria: Auditoria[] = Array.from({ length: 20 }, (_, index) => ({
  id: `a${index + 1}`, 
  // CAMBIADO A 2026
  fecha: `2026-11-${String(15 - (index % 10)).padStart(2, "0")} 10:${String(index * 3).padStart(2, "0")}`,
  usuario: ["Camila Gerencia", "Felipe Finanzas", "Sofía Supervisora"][index % 3],
  accion: ["Actualizó estado", "Creó registro", "Asignó técnico", "Registró pago"][index % 4],
  entidad: `${index % 2 ? "Obra" : "Presupuesto"} #${1051 + index}`,
}));

export const usuarios: Usuario[] = [
  { id: "u1", nombre: "Camila Ortega", email: "gerencia@fyag.cl", rol: "Gerencia" },
  { id: "u2", nombre: "Felipe Herrera", email: "finanzas@fyag.cl", rol: "Finanzas" },
  { id: "u3", nombre: "Sofía Contreras", email: "supervisor@fyag.cl", rol: "Supervisor" },
  { id: "u4", nombre: "Matías González", email: "tecnico@fyag.cl", rol: "Técnico", tecnicoId: "t1" },
];

export const ventasMensuales = [
  { mes: "Ene", ventas: 32 }, { mes: "Feb", ventas: 41 }, { mes: "Mar", ventas: 38 },
  { mes: "Abr", ventas: 56 }, { mes: "May", ventas: 62 }, { mes: "Jun", ventas: 74 },
];

export const distribucionServicios = [
  { name: "Proyecto", value: 35 }, { name: "Mantención", value: 28 },
  { name: "Climatización", value: 22 }, { name: "Otros", value: 15 },
];