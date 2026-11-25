import { useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { Modulo } from "@/app/access";

const explicaciones: Record<Modulo, string> = {
  dashboard: "Consulta un resumen de inventario o de las cifras de la empresa, según tu rol.",
  catalogo: "Busca un producto por su nombre o código y revisa cuántas unidades quedan.",
  compras: "Consulta qué compró la empresa y qué productos siguen pendientes de recibir.",
  recepcion: "Confirma la cantidad de productos que llegó para sumarla al inventario.",
  obras: "Revisa el estado de cada obra, su técnico asignado y los materiales usados.",
  "mis-obras": "Abre una tarea para ver su avance y los movimientos de materiales.",
  solicitudes: "Revisa los pedidos de materiales y resuélvelos según su estado.",
  presupuestos: "Consulta los presupuestos de los clientes y su estado.",
  clientes: "Busca los clientes de la empresa y consulta sus datos.",
  facturacion: "Consulta las facturas vinculadas a obras y descarga una copia en PDF.",
  cobranza: "Revisa cuánto falta por cobrar y cuándo vencen las facturas.",
  reportes: "Consulta los resultados y descarga los informes disponibles.",
  usuarios: "Consulta los accesos del sistema y el registro de operaciones recientes.",
};

function leerPreferencia(clave: string) {
  try { return localStorage.getItem(clave) === "1"; }
  catch { return false; }
}

function guardarPreferencia(clave: string, activa: boolean) {
  try { localStorage.setItem(clave, activa ? "1" : "0"); }
  catch { /* El control sigue disponible durante esta sesión. */ }
}

export default function GuiaDeUso({ usuarioId, modulos }: {
  usuarioId: string;
  modulos: readonly { path: Modulo; label: string }[];
}) {
  const claveGuia = "fyag.guia.v1." + usuarioId;
  const claveTexto = "fyag.texto-grande." + usuarioId;
  const [abierta, setAbierta] = useState(() => !leerPreferencia(claveGuia));
  const [textoGrande, setTextoGrande] = useState(() => leerPreferencia(claveTexto));
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const titulo = useRef<HTMLHeadingElement>(null);
  const activar = useRef<HTMLButtonElement>(null);
  const enfocarAyuda = useRef(false);
  const paso = modulos.findIndex(({ path }) => pathname === `/app/${path}` || pathname.startsWith(`/app/${path}/`));
  const actual = modulos[paso];
  const anterior = modulos[paso - 1];
  const siguiente = modulos[paso + 1];

  useLayoutEffect(() => {
    const raiz = document.documentElement;
    raiz.classList.toggle("fyag-texto-grande", textoGrande);
    return () => raiz.classList.remove("fyag-texto-grande");
  }, [textoGrande]);

  useLayoutEffect(() => {
    if (abierta && enfocarAyuda.current && titulo.current) {
      titulo.current.focus();
      enfocarAyuda.current = false;
    }
  }, [abierta, pathname]);

  function cerrar() {
    guardarPreferencia(claveGuia, true);
    setAbierta(false);
    activar.current?.focus();
  }

  function cambiarApartado(path: Modulo) {
    enfocarAyuda.current = true;
    navigate(`/app/${path}`);
  }

  return (
    <div className="mb-4">
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" aria-pressed={textoGrande} className="min-h-11"
          onClick={() => {
            guardarPreferencia(claveTexto, !textoGrande);
            setTextoGrande(!textoGrande);
          }}>
          Texto grande
        </Button>
        {actual && <Button ref={activar} type="button" variant="outline" className="min-h-11"
          aria-expanded={abierta} aria-controls={abierta ? "guia-del-apartado" : undefined}
          onClick={() => {
            if (abierta) cerrar();
            else {
              enfocarAyuda.current = true;
              setAbierta(true);
            }
          }}>
          Guía de uso
        </Button>}
      </div>
      {abierta && actual && (
        <aside id="guia-del-apartado" aria-labelledby="titulo-guia-del-apartado"
          className="mt-3 rounded-xl border border-primary bg-card px-4 py-4 sm:px-6">
          <p className="text-sm text-muted-foreground">Guía de uso · Paso {paso + 1} de {modulos.length}</p>
          <h2 ref={titulo} id="titulo-guia-del-apartado" tabIndex={-1} className="mt-1 text-lg font-semibold">
            {actual.label === "Dashboard" ? "Panel principal" : actual.label}
          </h2>
          <p className="mt-1 leading-relaxed">{explicaciones[actual.path]}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {anterior && <Button type="button" variant="outline" className="min-h-11" onClick={() => cambiarApartado(anterior.path)}>
              Anterior
            </Button>}
            {siguiente ? (
              <>
                <Button type="button" className="min-h-11" onClick={() => cambiarApartado(siguiente.path)}>
                  Siguiente: {siguiente.label}
                </Button>
                <Button type="button" variant="ghost" className="min-h-11" onClick={cerrar}>Cerrar guía</Button>
              </>
            ) : <Button type="button" className="min-h-11" onClick={cerrar}>Finalizar guía</Button>}
          </div>
        </aside>
      )}
    </div>
  );
}
