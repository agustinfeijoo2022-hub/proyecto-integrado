import { createContext, useContext, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CentroDeAyuda from "@/components/CentroDeAyuda";
import { Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Modulo, permisos } from "@/app/access";
import type { Rol } from "@/types";
import { pasosDelApartado, type PasoRecorrido } from "@/components/pasosRecorrido";

const tamanos = ["normal", "grande", "muy-grande"] as const;
type Tamano = (typeof tamanos)[number];

const explicaciones = {
  dashboard: {
    Gerencia: "Revisa los montos facturados, cobrados, por cobrar y de compras. El gráfico muestra cuántas obras hay en cada estado. Pulsa Actualizar datos para ver los cambios recientes.",
    Finanzas: "Consulta las existencias y las alertas de stock antes de registrar una compra. Pulsa Actualizar datos para ver las cifras recientes.",
    "Encargado de Bodega": "Revisa los artículos registrados y cuáles llegaron a su nivel mínimo de stock. Pulsa Actualizar datos después de recibir mercancía para ver las existencias recientes.",
  },
  catalogo: {
    Gerencia: "Busca por código o nombre y revisa cuántas unidades hay antes de enviar la solicitud a Finanzas.",
    Finanzas: "Busca por nombre o código y comprueba las existencias antes de registrar una compra. Puedes descargar el catálogo en Excel o PDF.",
    "Encargado de Bodega": "Consulta los códigos y las existencias. Usa Nuevo ítem para registrar un artículo y revisa su unidad antes de asignarlo a una obra.",
  },
  compras: {
    Gerencia: "Consulta el historial de compras por proveedor, producto o estado. Revisa qué compras siguen pendientes o ya fueron recibidas.",
    Finanzas: "Usa Registrar compra e indica el producto, el proveedor, la cantidad y el monto. La compra quedará pendiente hasta que se confirme su recepción.",
    "Encargado de Bodega": "Busca las compras pendientes y comprueba qué productos deben llegar. Cuando llegue la mercancía, pulsa Ir a recepción para registrar la cantidad recibida.",
  },
  recepcion: {
    "Encargado de Bodega": "Compara la compra pendiente con lo que llegó. Ingresa la cantidad real y confirma. Esa cantidad se suma al stock.",
  },
  obras: {
    Gerencia: "Usa los filtros para ubicar una obra. En el detalle puedes revisar el avance, el técnico y los materiales, y gestionar los cambios de estado disponibles. Para cerrar comercialmente, revisa que no queden facturas con saldo pendiente.",
    "Encargado de Bodega": "Crea una obra a partir de un presupuesto aprobado. En el detalle puedes guardar su prioridad, asignar un técnico y seleccionar los materiales que se descontarán del stock al guardar la primera asignación.",
  },
  "mis-obras": {
    Gerencia: "Consulta las tareas y fíltralas por prioridad o estado. Abre Ver detalle para revisar el avance y los materiales de una obra.",
    Técnico: "Revisa tus obras asignadas de mayor a menor prioridad. Busca por código o nombre y filtra por prioridad o estado. En el detalle de una obra activa puedes registrar materiales usados, devolver sobrantes o solicitar más unidades.",
  },
  solicitudes: {
    Finanzas: "Revisa qué obra pidió materiales y cuántas unidades necesita. Comprueba el stock antes de aprobar o rechazar la solicitud.",
  },
  presupuestos: {
    Gerencia: "Revisa el cliente, el tipo de servicio y el monto de cada propuesta. Usa Aprobar o Rechazar según corresponda. Cuando un presupuesto se aprueba, queda disponible para crear una obra.",
    Finanzas: "Usa Nuevo presupuesto o abre una solicitud recibida en Notificaciones. Agrega los conceptos que se cobrarán, como mano de obra y traslados. Usa Pegar varias partidas para cargar cantidades y precios desde Excel. Revisa el total antes de enviar a aprobación.",
  },
  clientes: {
    Gerencia: "Busca al cliente y consulta los datos registrados para verificar a quién pertenecen los presupuestos y obras.",
    Finanzas: "Busca al cliente antes de crear un registro nuevo. Puedes agregar clientes y corregir sus datos de contacto.",
  },
  facturacion: {
    Gerencia: "Consulta las facturas vinculadas a obras y fíltralas por estado. Usa Descargar PDF para abrir e imprimir el comprobante.",
    Finanzas: "Usa Nueva factura y selecciona la obra, el folio, las fechas y el monto. Usa Descargar PDF para imprimir el comprobante.",
  },
  cobranza: {
    Gerencia: "Revisa los saldos, vencimientos y estados de pago. Usa los filtros para ubicar cuentas vencidas o con pagos parciales.",
    Finanzas: "Busca la factura y revisa su saldo antes de registrar un pago. Ingresa un monto positivo que no supere lo que queda por cobrar.",
  },
  reportes: {
    Gerencia: "Consulta gastos de compras y gráficos de obras y presupuestos. Exporta PDF para presentar el resumen o Excel para analizarlo.",
    Finanzas: "Revisa los importes de compras y los estados de presupuestos. Exporta a Excel para comprobar los valores y a PDF para compartir el resumen.",
    "Encargado de Bodega": "Consulta el resumen de compras y los estados de obras. Usa Exportar Excel o Exportar PDF para descargar el reporte disponible.",
  },
  "solicitudes-presupuesto": {
    Gerencia: "Selecciona al cliente, describe el trabajo y su ubicación, y agrega los materiales y el plazo si los conoces. Consulta el stock desde el mismo apartado y envía los antecedentes a Finanzas.",
  },
  notificaciones: {
    Gerencia: "Aquí llegan los avisos de los presupuestos que Finanzas envía a revisión. Pulsa Revisar presupuesto para consultar sus partidas y aprobarlo o rechazarlo.",
    Finanzas: "Aquí llegan las solicitudes de presupuesto que te envía Gerencia. Abre Preparar presupuesto para cargar el cliente y consultar los antecedentes. Cuando revises un aviso, márcalo como leído.",
    "Encargado de Bodega": "Revisa el folio, el cliente y la lista de materiales de los presupuestos registrados. Cuando llegue el aviso de aprobación, podrás crear la obra.",
    Técnico: "Aquí recibes un aviso cuando te asignan una obra. Revisa el alcance y abre Ver obra asignada para consultar las instrucciones, el plazo y los materiales disponibles.",
  },
  usuarios: {
    Gerencia: "En Auditoría reciente puedes consultar quién realizó una operación, qué registro se afectó, cuándo ocurrió y cuál fue el resultado.",
  },
} satisfies { [M in Modulo]: Record<(typeof permisos)[M][number], string> };

function explicacionDelRol(modulo: Modulo, rol: Rol) {
  const porRol: Partial<Record<Rol, string>> = explicaciones[modulo];
  return porRol[rol];
}

type Recorrido = {
  paso: PasoRecorrido;
  indice: number;
  total: number;
  seccion: string;
  desplazar: boolean;
  anterior?: () => void;
  siguiente?: () => void;
  destino?: string;
  cerrar: () => void;
};

const ContextoGuia = createContext<Recorrido | null>(null);

export function PuntoGuia({ id }: { id: string }) {
  const recorrido = useContext(ContextoGuia);
  return recorrido?.paso.id === id ? <TarjetaGuia key={id} recorrido={recorrido} /> : null;
}

function TarjetaGuia({ recorrido }: { recorrido: Recorrido }) {
  const titulo = useRef<HTMLHeadingElement>(null);
  const { paso, indice, total, seccion, desplazar, anterior, siguiente, destino, cerrar } = recorrido;

  useLayoutEffect(() => {
    if (!desplazar || !titulo.current) return;
    const encabezado = titulo.current;
    encabezado.focus({ preventScroll: true });
    encabezado.closest("aside")?.scrollIntoView({
      block: "start",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }, [paso.id, seccion, desplazar]);

  return (
    <aside id="guia-del-apartado" aria-labelledby="titulo-guia-del-apartado"
      className="my-3 min-w-0 scroll-mt-4 rounded-xl border border-primary bg-card px-4 py-4 text-foreground sm:px-6">
      <p className="text-sm text-muted-foreground">{seccion} · Paso {indice + 1} de {total}</p>
      <h2 ref={titulo} id="titulo-guia-del-apartado" tabIndex={-1} className="mt-1 text-lg font-semibold">
        {paso.titulo}
      </h2>
      <p className="mt-1 leading-relaxed">{paso.texto}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {anterior && <Button type="button" variant="outline" className="min-h-11" onClick={anterior}>Anterior</Button>}
        {siguiente ? <>
          <Button type="button" className="min-h-11 max-w-full whitespace-normal text-left" onClick={siguiente}>
            {destino ? `Siguiente: ${destino}` : "Siguiente"}
          </Button>
          <Button type="button" variant="ghost" className="min-h-11" onClick={cerrar}>Cerrar guía</Button>
        </> : <Button type="button" className="min-h-11" onClick={cerrar}>Finalizar guía</Button>}
      </div>
    </aside>
  );
}

export default function GuiaDeUso({ usuarioId, rol, modulos, children }: {
  usuarioId: string;
  rol: Rol;
  modulos: readonly { path: Modulo; label: string }[];
  children: ReactNode;
}) {
  const claveTexto = "fyag.texto-grande." + usuarioId;
  const [abierta, setAbierta] = useState(false);
  const [ayudaAbierta, setAyudaAbierta] = useState(false);
  const [posicion, setPosicion] = useState<{ ruta: string; indice: number }>();
  const [tamano, setTamano] = useState<Tamano>(() => {
    try {
      const valor = localStorage.getItem(claveTexto);
      return valor === "1" ? "grande" : tamanos.find(t => t === valor) ?? "normal";
    } catch { return "normal"; }
  });
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const iniciandoRecorrido = useRef(false);
  const barraAyuda = useRef<HTMLDivElement>(null);
  const detalle = /^\/app\/obras\/[^/]+/.test(pathname);
  const ruta = detalle && rol === "Técnico" ? "/app/mis-obras" : pathname;
  const indiceModulo = modulos.findIndex(({ path }) => ruta === `/app/${path}` || ruta.startsWith(`/app/${path}/`));
  const actual = modulos[indiceModulo];
  const anteriorModulo = modulos[indiceModulo - 1];
  const siguienteModulo = modulos[indiceModulo + 1];
  const nombre = detalle ? "Detalle de la obra" : actual?.label === "Dashboard" ? "Panel principal" : actual?.label ?? "";
  const pasos = actual ? [{
    id: "introduccion",
    titulo: nombre,
    texto: detalle ? "Aquí puedes comprobar qué se acordó para la obra, su progreso y los materiales disponibles. Avanza por la guía para revisar cada parte." : explicacionDelRol(actual.path, rol) ?? "",
  }, ...pasosDelApartado(detalle ? "detalle-obra" : actual.path, rol)] : [];
  const indice = posicion?.ruta === pathname ? Math.min(posicion.indice, pasos.length - 1) : 0;

  useLayoutEffect(() => {
    const raiz = document.documentElement;
    raiz.dataset.fyagTexto = tamano;
    return () => { delete raiz.dataset.fyagTexto; };
  }, [tamano]);

  function cerrar() {
    setAbierta(false);
    setPosicion(undefined);
    barraAyuda.current?.querySelector("button")?.focus();
  }

  function cambiarApartado(path: Modulo, ultimo = false) {
    const destino = `/app/${path}`;
    setPosicion({ ruta: destino, indice: ultimo ? pasosDelApartado(path, rol).length : 0 });
    navigate(destino);
  }

  const recorrido: Recorrido | null = abierta && pasos[indice] ? {
    paso: pasos[indice],
    indice,
    total: pasos.length,
    seccion: nombre,
    desplazar: posicion?.ruta === pathname,
    anterior: indice > 0 ? () => setPosicion({ ruta: pathname, indice: indice - 1 })
      : anteriorModulo ? () => cambiarApartado(anteriorModulo.path, true) : undefined,
    siguiente: indice < pasos.length - 1 ? () => setPosicion({ ruta: pathname, indice: indice + 1 })
      : siguienteModulo ? () => cambiarApartado(siguienteModulo.path) : undefined,
    destino: indice === pasos.length - 1 ? siguienteModulo?.label : undefined,
    cerrar,
  } : null;

  return (
    <ContextoGuia.Provider value={recorrido}>
      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <label className="flex flex-wrap items-center gap-2 text-sm font-medium">
          Tamaño del texto
          <Select className="min-h-11 w-auto" value={tamano} onChange={event => {
            const valor = tamanos.find(t => t === event.target.value);
            if (!valor) return;
            try { localStorage.setItem(claveTexto, valor); } catch { /* Se conserva durante esta sesión. */ }
            setTamano(valor);
          }}>
            <option value="normal">Normal</option>
            <option value="grande">Grande</option>
            <option value="muy-grande">Muy grande</option>
          </Select>
        </label>
        <div ref={barraAyuda}>
          <CentroDeAyuda abierta={ayudaAbierta} cambiar={setAyudaAbierta} rol={rol}
            modulo={actual?.path} nombre={nombre} explicacion={pasos[0]?.texto ?? ""} modulos={modulos}
            iniciar={() => {
              iniciandoRecorrido.current = true;
              setPosicion({ ruta: pathname, indice: 0 });
              setAyudaAbierta(false);
              setAbierta(true);
            }}
            evitarRestaurarFoco={() => {
              const iniciar = iniciandoRecorrido.current;
              iniciandoRecorrido.current = false;
              return iniciar;
            }} />
        </div>
      </div>
      <PuntoGuia id="introduccion" />
      {children}
    </ContextoGuia.Provider>
  );
}
