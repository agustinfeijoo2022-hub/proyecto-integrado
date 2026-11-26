
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
const facturas = [{ id: 108, folio: "FAC-108", obra_id: 26, obra_codigo: "OB-026", obra_nombre: obras[0].nombre, obra_estado: obras[0].estado, cliente_nombre: clientes[0].razonSocial, fecha, emision: fecha, vencimiento: "2026-12-15", monto: 2320000, total: 2320000, pagado: 340000, saldo: 1980000, estado: "Parcial" }];


type Aviso = { id: number; rol: Usuario["rol"]; tipo: "cotizacion" | "presupuesto" | "obra"; titulo: string; mensaje: string; cliente_id: string | null; obra_id: number | null; presupuesto_id: number | null; creada_en: string; leida_en: string | null; instrucciones?: NonNullable<ObraDB["instrucciones"]> };
type Solicitud = { id: string; codigo: string; nombreArticulo: string; obraId: number; tecnicoId: string; cantidad: number; fecha: string; estado: string };
type Material = { codigo: string; nombre: string; unidad: string; entregados: number; utilizados: number; devueltos: number; saldo: number };

const claveDatos = "fyag:presentacion-datos-v1";
const inicial = {
  clientes, presupuestos, obras, articulos, compras, facturas,
  avisos: [] as Aviso[], solicitudes: [] as Solicitud[],
  materiales: { 26: [{ codigo: "REF-001", nombre: "Filtro secador", unidad: "Unidad", entregados: 4, utilizados: 1, devueltos: 0, saldo: 3 }] } as Record<number, Material[]>,
  auditoria: [{ id: 1, accion: "Aprobación de presupuesto", fecha, usuario: "Gerencia FYAG", rol: "Gerencia", recurso: "PRE-104", http_status: 200 }],
};

function leerDatos(): typeof inicial {
  const guardados = localStorage.getItem(claveDatos);
  return guardados ? JSON.parse(guardados) as typeof inicial : structuredClone(inicial);
}

function buscar<T>(elemento: T | undefined, mensaje = "No se encontró el registro de presentación."): T {
  if (!elemento) throw new Error(mensaje);
  return elemento;
}

function siguiente(filas: { id: number }[]) {
  return Math.max(0, ...filas.map(fila => fila.id)) + 1;
}

export function respuestaPresentacion(path: string, method: string, body?: BodyInit | null) {
  if (path === "/auth/logout" && method === "POST") {
    sessionStorage.removeItem(clave);
    location.replace("/login");
    return undefined;
  }

  const usuario = buscar(usuarioPresentacion ?? undefined);
  const db = leerDatos();
  const [ruta, query] = path.split("?");
  const [, recurso, identificador, accion] = ruta.split("/");
  const id = Number(identificador);
  const avisos = db.avisos.filter(aviso => aviso.rol === usuario.rol);
  const esTecnico = usuario.rol === "Técnico";
  if (method === "GET") {
    const resumen = db.compras.reduce((s, c) => ({ operaciones: s.operaciones + 1, neto: s.neto + c.neto, iva: s.iva + c.iva, total: s.total + c.total }), { operaciones: 0, neto: 0, iva: 0, total: 0 });
    const estados = db.obras.reduce<Record<string, number>>((s, o) => ({ ...s, [o.estado]: (s[o.estado] ?? 0) + 1 }), {});
    const datos: Record<string, unknown> = {
      "/status": { mensaje: "Presentación FYAG" },
      "/auth/me": usuario,
      "/dashboard/gerencia": {
        facturado: db.facturas.reduce((s, f) => s + f.monto, 0),
        cobrado: db.facturas.reduce((s, f) => s + f.pagado, 0),
        porCobrar: db.facturas.reduce((s, f) => s + f.saldo, 0),
        compras: resumen.total, obras: Object.entries(estados).map(([estado, cantidad]) => ({ estado, cantidad })),
      },
      "/articulos": db.articulos,
      "/compras": new URLSearchParams(query).get("pendientes") === "true" ? db.compras.filter(c => !c.recibida) : db.compras,
      "/obras": esTecnico ? db.obras.filter(o => o.tecnico_id === usuario.tecnicoId) : db.obras,
      "/obras/catalogo": db.articulos,
      "/obras/tecnicos": [{ id: "t1", nombre: "Técnico FYAG" }],
      "/presupuestos": db.presupuestos,
      "/presupuestos/aprobados": db.presupuestos.filter(p => p.estado === "Aprobado"),
      "/clientes": db.clientes,
      "/facturas": db.facturas,
      "/reportes/finanzas": resumen,
      "/notificaciones/resumen": { pendientes: avisos.some(a => !a.leida_en) },
      "/notificaciones": avisos,
      "/solicitudes": esTecnico ? db.solicitudes.filter(s => s.tecnicoId === usuario.tecnicoId) : db.solicitudes,
      "/auditoria": db.auditoria,
    };
    if (recurso === "obras" && accion === "materiales") return db.materiales[id] ?? [];
    if (Object.prototype.hasOwnProperty.call(datos, ruta)) return datos[ruta];
    throw new Error("Este apartado no existe en la presentación.");
  }

  // Solo se procesan las acciones que ofrece cada rol. No hay llamadas al servidor.
  const nuevo = JSON.parse(typeof body === "string" ? body : "{}");
  const ahora = new Date().toISOString();
  const aviso = (rol: Aviso["rol"], tipo: Aviso["tipo"], titulo: string, mensaje: string, extra: Partial<Aviso> = {}) => {
    db.avisos.unshift({ id: siguiente(db.avisos), rol, tipo, titulo, mensaje, cliente_id: null, obra_id: null, presupuesto_id: null, creada_en: ahora, leida_en: null, ...extra });
  };
  const guardar = <T,>(resultado: T) => {
    db.auditoria.unshift({ id: siguiente(db.auditoria), accion: method, fecha: ahora, usuario: usuario.nombre, rol: usuario.rol, recurso: ruta, http_status: 200 });
    localStorage.setItem(claveDatos, JSON.stringify(db));
    return resultado;
  };
  const articuloPorCodigo = (codigo: string) => buscar(db.articulos.find(a => a.codigo === codigo), "El código no existe en el catálogo.");
  const { rol } = usuario;
  const esFinanzas = rol === "Finanzas";
  const esBodega = rol === "Encargado de Bodega";
  const esGerencia = rol === "Gerencia";

  if (ruta === "/articulos" && method === "POST" && esBodega) {
    if (db.articulos.some(a => a.codigo === nuevo.codigo)) throw new Error("Ese código ya existe.");
    const articulo = { ...nuevo, _id: crypto.randomUUID() };
    db.articulos.unshift(articulo);
    return guardar({ articulo });
  }
  if (recurso === "clientes" && esFinanzas && ["POST", "PATCH"].includes(method)) {
    if (method === "POST") {
      const cliente = { ...nuevo, id: crypto.randomUUID() };
      db.clientes.unshift(cliente);
      return guardar(cliente);
    }
    return guardar(Object.assign(buscar(db.clientes.find(c => c.id === identificador)), nuevo, { id: identificador }));
  }
  if (ruta === "/notificaciones/cotizaciones" && method === "POST" && esGerencia) {
    const cliente = buscar(db.clientes.find(c => c.id === nuevo.clienteId));
    aviso("Finanzas", "cotizacion", nuevo.asunto, nuevo.alcance, { cliente_id: cliente.id, instrucciones: { trabajo: nuevo.asunto, alcance: nuevo.alcance, plazo: nuevo.plazo, materiales_solicitados: nuevo.materiales } });
    return guardar({});
  }
  if (recurso === "notificaciones" && accion === "leer" && method === "PATCH") {
    const a = buscar(avisos.find(item => item.id === id));
    a.leida_en = ahora;
    return guardar(a);
  }
  if (ruta === "/presupuestos" && method === "POST" && esFinanzas) {
    const cliente = buscar(db.clientes.find(c => c.id === nuevo.cliente_id));
    const solicitud = avisos.find(a => a.id === nuevo.solicitud_id);
    const presupuesto = { ...nuevo, id: siguiente(db.presupuestos), cliente_nombre: cliente.razonSocial, instrucciones: solicitud?.instrucciones };
    db.presupuestos.unshift(presupuesto);
    aviso("Gerencia", "presupuesto", "Presupuesto para revisión", presupuesto.folio, { presupuesto_id: presupuesto.id });
    aviso("Encargado de Bodega", "presupuesto", "Nuevo presupuesto registrado", presupuesto.folio);
    return guardar(presupuesto);
  }
  if (recurso === "presupuestos" && method === "PATCH" && esGerencia) {
    const p = buscar(db.presupuestos.find(item => item.id === id));
    if (p.estado !== "Enviado" || !["Aprobado", "Rechazado"].includes(nuevo.estado)) throw new Error("El presupuesto no admite esa decisión.");
    p.estado = nuevo.estado;
    if (p.estado === "Aprobado") aviso("Encargado de Bodega", "presupuesto", "Presupuesto aprobado", p.folio);
    return guardar(p);
  }
  if (ruta === "/obras" && method === "POST" && esBodega) {
    const p = buscar(db.presupuestos.find(item => item.id === nuevo.presupuesto_id && item.estado === "Aprobado"), "Se necesita un presupuesto aprobado.");
    if (db.obras.some(o => o.presupuesto_id === p.id)) throw new Error("Ese presupuesto ya tiene una obra.");
    const obra = { ...nuevo, id: siguiente(db.obras), avance: 0, prioridad: "Normal", cliente_nombre: p.cliente_nombre, presupuesto_folio: p.folio, materiales_previstos: p.materiales_previstos, instrucciones: p.instrucciones };
    db.obras.unshift(obra);
    return guardar(obra);
  }
  if (recurso === "obras" && method === "PATCH" && (esBodega || esGerencia || esTecnico)) {
    const obra = buscar(db.obras.find(o => o.id === id && (!esTecnico || o.tecnico_id === usuario.tecnicoId)));
    if (esBodega && "tecnico_id" in nuevo) {
      const asignacion = (nuevo.materiales ?? []) as { codigo: string; cantidad: number }[];
      const resumen = db.materiales[id] ??= [];
      for (const { codigo, cantidad } of asignacion) {
        const a = articuloPorCodigo(codigo);
        if (cantidad <= 0 || a.stock < cantidad) throw new Error("Stock insuficiente para la asignación.");
        const m = resumen.find(item => item.codigo === codigo);
        if (m) { m.entregados += cantidad; m.saldo += cantidad; }
        else resumen.push({ codigo, nombre: a.nombre, unidad: a.unidad, entregados: cantidad, utilizados: 0, devueltos: 0, saldo: cantidad });
        a.stock -= cantidad;
      }
      obra.tecnico_id = nuevo.tecnico_id;
      if (obra.tecnico_id) aviso("Técnico", "obra", "Nueva obra asignada", obra.nombre, { obra_id: obra.id });
    }
    if (esBodega && nuevo.prioridad) obra.prioridad = nuevo.prioridad;
    if (nuevo.estado) {
      if (nuevo.estado === "Cierre comercial" && (obra.estado !== "Finalizada" || db.facturas.some(f => f.obra_id === id && f.saldo > 0))) throw new Error("Finaliza la obra y resuelve los saldos pendientes antes de cerrar.");
      obra.estado = nuevo.estado;
      if (obra.estado === "Finalizada") obra.avance = 100;
      db.facturas.filter(f => f.obra_id === id).forEach(f => { f.obra_estado = obra.estado; });
    }
    if (typeof nuevo.avance === "number") obra.avance = nuevo.avance;
    obra.historial = [...(obra.historial ?? []), { fecha: ahora, detalle: "Obra actualizada en presentación" }];
    return guardar(obra);
  }
  if (ruta === "/compras" && method === "POST" && esFinanzas) {
    const articulo = articuloPorCodigo(nuevo.codigoArticulo);
    const neto = Math.round(nuevo.monto * (1 - nuevo.descuento / 100));
    const iva = Math.round(neto * 0.19);
    const compra = { ...nuevo, id: crypto.randomUUID(), articuloId: articulo._id, nombreArticulo: articulo.nombre, unidad: articulo.unidad, neto, iva, total: neto + iva, fecha: ahora, recibida: false };
    db.compras.unshift(compra);
    return guardar({ articulo, total: compra.total, compra });
  }
  if (recurso === "compras" && accion === "recibir" && method === "POST" && esBodega) {
    const compra = buscar(db.compras.find(c => c.id === ruta.split("/")[4] && c.articuloId === identificador && !c.recibida));
    if (nuevo.cantidad <= 0 || nuevo.cantidad > compra.cantidad) throw new Error("Revisa la cantidad recibida.");
    articuloPorCodigo(compra.codigoArticulo).stock += nuevo.cantidad;
    Object.assign(compra, { recibida: true, cantidadRecibida: nuevo.cantidad });
    return guardar(compra);
  }
  if (recurso === "facturas" && method === "POST" && esFinanzas) {
    if (accion === "pagos") {
      const f = buscar(db.facturas.find(item => item.id === id));
      if (nuevo.monto <= 0 || nuevo.monto > f.saldo) throw new Error("El monto supera el saldo pendiente o no es válido.");
      f.pagado += nuevo.monto;
      f.saldo -= nuevo.monto;
      f.estado = f.saldo ? "Parcial" : "Pagada";
      return guardar(f);
    }
    const obra = buscar(db.obras.find(o => o.id === nuevo.obraId));
    if (db.facturas.some(f => f.folio === nuevo.folio)) throw new Error("El folio ya existe.");
    const factura = { ...nuevo, id: siguiente(db.facturas), obra_id: obra.id, obra_codigo: obra.codigo, obra_nombre: obra.nombre, obra_estado: obra.estado, cliente_nombre: obra.cliente_nombre ?? "", fecha: ahora, total: nuevo.monto, pagado: 0, saldo: nuevo.monto, estado: "Pendiente" };
    db.facturas.unshift(factura);
    return guardar(factura);
  }
  if (ruta === "/solicitudes" && method === "POST" && esTecnico) {
    buscar(db.obras.find(o => o.id === nuevo.obraId && o.tecnico_id === usuario.tecnicoId));
    const a = articuloPorCodigo(nuevo.codigo);
    const solicitud = { ...nuevo, id: crypto.randomUUID(), nombreArticulo: a.nombre, tecnicoId: usuario.tecnicoId, fecha: ahora, estado: "Pendiente" };
    db.solicitudes.unshift(solicitud);
    return guardar(solicitud);
  }
  if (recurso === "solicitudes" && method === "PATCH" && esFinanzas) {
    const solicitud = buscar(db.solicitudes.find(s => s.id === identificador && s.estado === "Pendiente"));
    solicitud.estado = nuevo.estado;
    return guardar(solicitud);
  }
  if (["/consumos", "/devoluciones"].includes(ruta) && method === "POST" && esTecnico) {
    const obra = buscar(db.obras.find(o => o.id === nuevo.obraId && o.tecnico_id === usuario.tecnicoId));
    const material = buscar(db.materiales[obra.id]?.find(m => m.codigo === nuevo.codigo));
    if (nuevo.cantidad <= 0 || nuevo.cantidad > material.saldo) throw new Error("La cantidad supera el saldo en la obra o no es válida.");
    material.saldo -= nuevo.cantidad;
    if (ruta === "/consumos") material.utilizados += nuevo.cantidad;
    else { material.devueltos += nuevo.cantidad; articuloPorCodigo(nuevo.codigo).stock += nuevo.cantidad; }
    return guardar(material);
  }
  throw new Error("Esta acción no está disponible para el perfil seleccionado.");
}
