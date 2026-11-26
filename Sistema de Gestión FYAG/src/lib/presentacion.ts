
import type { Cliente, ObraDB, PresupuestoDB, Usuario } from "@/types";

const perfiles = {
  gerencia: { id: "muestra-gerencia", nombre: "Gerencia FYAG", email: "gerencia@example.invalid", rol: "Gerencia" },
  finanzas: { id: "muestra-finanzas", nombre: "Finanzas FYAG", email: "finanzas@example.invalid", rol: "Finanzas" },
  bodega: { id: "muestra-bodega", nombre: "Encargado de Bodega", email: "bodega@example.invalid", rol: "Encargado de Bodega" },
  tecnico: { id: "muestra-tecnico", nombre: "Técnico FYAG", email: "tecnico@example.invalid", rol: "Técnico", tecnicoId: "t1" },
} satisfies Record<string, Usuario>;

const clave = "fyag:perfil-presentacion";
const rutaApp = /^\/app(?:\/|$)/.test(location.pathname);
const perfilSolicitado = new URLSearchParams(location.search).get("presentacion");
const seleccionado = rutaApp ? perfilSolicitado ?? sessionStorage.getItem(clave) : null;
const perfil = seleccionado && Object.prototype.hasOwnProperty.call(perfiles, seleccionado) ? seleccionado as keyof typeof perfiles : null;

if (perfil) sessionStorage.setItem(clave, perfil);
else sessionStorage.removeItem(clave);

export const usuarioPresentacion: Usuario | null = perfil ? perfiles[perfil] : null;

const fecha = "2026-11-26T12:00:00.000Z";
const clientes: Cliente[] = [
  { id: "c1", razonSocial: "Agroindustria Río Sur", rut: "00.000.000-0", contacto: "Operaciones", email: "operaciones@example.invalid" },
  { id: "c2", razonSocial: "Frutícola Valle Norte", rut: "00.000.000-0", contacto: "Mantención", email: "mantencion@example.invalid" },
];
const presupuestos: PresupuestoDB[] = [
  { id: 104, folio: "PRE-104", cliente_id: "c1", cliente_nombre: clientes[0].razonSocial, fecha, tipo: "Mantención", total: 2320000, estado: "Aprobado" },
  { id: 105, folio: "PRE-105", cliente_id: "c2", cliente_nombre: clientes[1].razonSocial, fecha, tipo: "Proyecto", total: 485000, estado: "Enviado" },
];
const obras: ObraDB[] = [
  { id: 26, codigo: "OB-026", nombre: "Mantención de cámara frigorífica", cliente_id: "c1", cliente_nombre: clientes[0].razonSocial, presupuesto_id: 104, presupuesto_folio: "PRE-104", tipo: "Mantención", tecnico_id: "t1", inicio: fecha, avance: 65, estado: "En proceso", prioridad: "Alta", instrucciones: { trabajo: "Revisar la cámara frigorífica", alcance: "Inspeccionar filtros y comprobar la temperatura de operación" } },
  { id: 27, codigo: "OB-027", nombre: "Inspección de sensores", cliente_id: "c1", cliente_nombre: clientes[0].razonSocial, presupuesto_id: 104, presupuesto_folio: "PRE-104", tipo: "Mantención", tecnico_id: "t1", inicio: fecha, avance: 100, estado: "Finalizada", prioridad: "Normal" },
];
const articulos = [
  { _id: "a1", codigo: "REF-001", nombre: "Filtro secador", categoria: "Refrigeración", stock: 18, stockCritico: 4, unidad: "Unidad" },
  { _id: "a2", codigo: "AIS-001", nombre: "Aislante elastomérico", categoria: "Aislamiento", stock: 24, stockCritico: 6, unidad: "Metro" },
  { _id: "a3", codigo: "CTL-001", nombre: "Sonda de temperatura", categoria: "Control", stock: 2, stockCritico: 3, unidad: "Unidad" },
];
const compras = [
  { id: "38", articuloId: "a1", codigoArticulo: "REF-001", nombreArticulo: "Filtro secador", unidad: "Unidad", proveedor: "Suministros Río Sur", cantidad: 12, monto: 18000, descuento: 0, neto: 216000, iva: 41040, total: 257040, fecha, recibida: false },
];
const facturas = [{ id: 108, folio: "FAC-108", obra_id: 26, obra_codigo: "OB-026", obra_nombre: obras[0].nombre, obra_estado: obras[0].estado, cliente_nombre: clientes[0].razonSocial, fecha, vencimiento: "2026-12-15", monto: 2320000, total: 2320000, pagado: 340000, saldo: 1980000, estado: "Parcial" }];

const datos: Readonly<Record<string, unknown>> = {
  "/status": { mensaje: "Presentación FYAG" },
  "/auth/me": usuarioPresentacion,
  "/dashboard/gerencia": { facturado: 2320000, cobrado: 340000, porCobrar: 1980000, compras: 257040, obras: [{ estado: "En proceso", cantidad: 1 }, { estado: "Finalizada", cantidad: 1 }] },
  "/articulos": articulos,
  "/compras": compras,
  "/obras": obras,
  "/obras/catalogo": articulos,
  "/obras/tecnicos": [{ id: "t1", nombre: "Técnico FYAG" }],
  "/presupuestos": presupuestos,
  "/presupuestos/aprobados": presupuestos.filter(p => p.estado === "Aprobado"),
  "/clientes": clientes,
  "/facturas": facturas,
  "/reportes/finanzas": { operaciones: 1, neto: 216000, iva: 41040, total: 257040 },
  "/notificaciones/resumen": { pendientes: false },
  "/notificaciones": [],
  "/solicitudes": [],
  "/auditoria": [{ id: 1, accion: "Aprobación de presupuesto", fecha, usuario: "Gerencia FYAG", rol: "Gerencia", recurso: "PRE-104", http_status: 200 }],
};

export function respuestaPresentacion(path: string, method: string) {
  if (path === "/auth/logout" && method === "POST") {
    sessionStorage.removeItem(clave);
    location.replace("/login");
    return undefined;
  }
  if (method !== "GET") throw new Error("La presentación permite consultar datos de muestra.");
  const [ruta] = path.split("?");
  if (/^\/obras\/\d+\/materiales$/.test(ruta)) return [];
  if (!Object.prototype.hasOwnProperty.call(datos, ruta)) throw new Error("Este apartado no tiene datos de muestra.");
  return structuredClone(datos[ruta]);
}

