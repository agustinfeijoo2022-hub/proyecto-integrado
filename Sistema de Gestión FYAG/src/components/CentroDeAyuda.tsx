import { CircleHelp, Route } from "lucide-react";
import { Link } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import type { Modulo } from "@/app/access";
import type { Rol } from "@/types";

const estados = [
  { titulo: "Solicitud de presupuesto y presupuesto", secciones: ["solicitudes-presupuesto", "presupuestos"], entradas: [
    ["Solicitud recibida", "A Finanzas le llegó un aviso con los antecedentes para cotizar."],
    ["Borrador", "El presupuesto está registrado sin enviarse a revisión."],
    ["Enviado", "Gerencia debe revisar el presupuesto y decidir si lo aprueba."],
    ["Aprobado", "Bodega puede usarlo para crear una obra."],
    ["Rechazado", "El presupuesto no habilita la creación de la obra."],
  ] },
  { titulo: "Solicitud de materiales", secciones: ["solicitudes", "mis-obras"], entradas: [
    ["Pendiente", "Finanzas todavía debe revisar la cantidad solicitada."],
    ["Aprobada", "Se descuenta del stock de Bodega y se suma al saldo de materiales de la obra."],
    ["Rechazada", "No se mueve stock. Revisa el pedido antes de enviar otro."],
  ] },
  { titulo: "Obra", secciones: ["obras", "mis-obras"], entradas: [
    ["En proceso", "La obra está activa. El detalle indica si ya tiene técnico asignado."],
    ["Suspendida", "La obra está en pausa y puede reanudarse si corresponde."],
    ["Finalizada", "Se marcó el término del trabajo y el avance pasa a 100 %."],
    ["Cierre comercial", "La obra está finalizada y el sistema comprueba que no haya facturas con saldo pendiente."],
    ["Cancelada", "La obra queda fuera del flujo. Una obra con pagos asociados no se puede cancelar."],
  ] },
  { titulo: "Compra y recepción", secciones: ["compras", "recepcion"], entradas: [
    ["Pendiente de recepción", "La compra está registrada y todavía no se suma al inventario."],
    ["Recibida", "Bodega confirmó la cantidad que llegó. Solo esa cantidad se sumó al stock."],
  ] },
  { titulo: "Factura y cobranza", secciones: ["facturacion", "cobranza"], entradas: [
    ["Pendiente", "La factura tiene saldo y el plazo aún no vence."],
    ["Pago parcial", "Se registró un abono, pero queda saldo y el plazo aún no vence."],
    ["Vencida", "Queda saldo y la fecha límite ya pasó, incluso si hubo un abono."],
    ["Pagada", "Se cubrió el monto completo y el saldo es cero."],
  ] },
];

const preguntasPorRol: Record<Rol, readonly [string, string]> = {
  Gerencia: ["¿Dónde reviso una propuesta enviada por Finanzas?", "En la campana, abre Revisar presupuesto. Comprueba las partidas y decide si corresponde aprobar o rechazar."],
  Finanzas: ["¿Cómo preparo un presupuesto con lo que pidió el cliente?", "En Notificaciones, pulsa Preparar presupuesto. Revisa los antecedentes, completa las partidas y sus precios, añade los materiales previstos y guarda."],
  "Encargado de Bodega": ["¿Por qué no aparece el presupuesto al crear una obra?", "En Nueva obra solo se muestran presupuestos aprobados. Si recibiste el aviso de registro, espera el aviso de aprobación."],
  Técnico: ["¿Dónde veo lo que tengo que hacer primero?", "En Mis tareas, las obras se ordenan por prioridad. Abre el detalle para leer las instrucciones, revisar la fecha y consultar los materiales."],
};

const flujo = [
  { titulo: "Solicitud del cliente", rol: "Gerencia", texto: "Reúne el alcance, la ubicación y el plazo. Consulta el catálogo si necesitas confirmar existencias. Envía los antecedentes a Finanzas.", destino: "solicitudes-presupuesto" },
  { titulo: "Preparación del presupuesto", rol: "Finanzas", texto: "Abre el aviso, cotiza cada partida e indica los materiales previstos. Al guardar, Gerencia recibe el aviso de revisión y Bodega recibe la lista sin precios.", destino: "presupuestos" },
  { titulo: "Revisión y aprobación", rol: "Gerencia", texto: "Revisa el presupuesto desde la campana y aprueba o rechaza. Si lo apruebas, Bodega recibe el aviso para crear la obra.", destino: "notificaciones" },
  { titulo: "Creación y asignación de obra", rol: "Bodega", texto: "Crea la obra desde el presupuesto aprobado, revisa los materiales y asigna al técnico. En la primera asignación se descuentan los materiales confirmados.", destino: "obras" },
  { titulo: "Trabajo y materiales", rol: "Técnico", texto: "Abre el aviso de asignación, revisa las instrucciones y registra lo utilizado o lo que devuelves. Si faltan insumos, pide más materiales para que Finanzas revise el pedido.", destino: "mis-obras" },
  { titulo: "Facturación, cobro y cierre", rol: "Finanzas y Gerencia", texto: "Finanzas registra las facturas y los pagos. Una vez finalizada la obra, Gerencia puede realizar el cierre comercial si no hay facturas con saldo pendiente.", destino: "cobranza" },
] as const;

export default function CentroDeAyuda({ abierta, cambiar, nombre, explicacion, modulo, rol, modulos, iniciar, evitarRestaurarFoco }: {
  abierta: boolean;
  cambiar: (abierta: boolean) => void;
  nombre: string;
  explicacion: string;
  modulo?: Modulo;
  rol: Rol;
  modulos: readonly { path: Modulo; label: string }[];
  iniciar: () => void;
  evitarRestaurarFoco: () => boolean;
}) {
  const grupos = [...estados].sort((a, b) => Number(b.secciones.includes(modulo ?? "")) - Number(a.secciones.includes(modulo ?? "")));
  return (
    <Dialog.Root open={abierta} onOpenChange={cambiar}>
      <Dialog.Trigger asChild>
        <Button type="button" variant="outline" className="min-h-11">
          <CircleHelp className="size-4" aria-hidden="true" /> Centro de ayuda
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fyag-workspace fixed inset-y-0 right-0 z-50 w-full max-w-xl overflow-y-auto overscroll-contain border-l border-border bg-card text-foreground shadow-xl"
          onCloseAutoFocus={event => { if (evitarRestaurarFoco()) event.preventDefault(); }}>
          <header className="flex items-start justify-between gap-3 border-b border-border bg-card px-5 py-5 sm:px-7">
            <div>
              <Dialog.Title className="text-xl font-semibold">Centro de ayuda</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">Ayuda para el perfil de {rol}.</Dialog.Description>
            </div>
            <Dialog.Close asChild><Button type="button" variant="outline">Cerrar</Button></Dialog.Close>
          </header>
          <div className="grid gap-4 p-5 sm:p-7">
            {modulo && <section className="rounded-xl border border-border bg-muted p-4">
              <p className="text-sm text-muted-foreground">En esta pantalla</p>
              <h2 className="mt-1 text-lg font-semibold">{nombre}</h2>
              <p className="mt-2 leading-relaxed">{explicacion}</p>
              <Button type="button" onClick={iniciar} className="mt-4 min-h-11">
                <Route className="size-4" aria-hidden="true" /> Iniciar recorrido guiado
              </Button>
            </section>}
            <details className="rounded-xl border border-border p-4">
              <summary className="cursor-pointer font-semibold">Preguntas frecuentes</summary>
              <dl className="mt-4 grid gap-3 text-sm">
                {[preguntasPorRol[rol],
                  ["¿Qué significa el punto rojo en la campana?", "Hay al menos un aviso sin leer. Abre Notificaciones y marca como leído lo que ya revisaste."],
                  ["¿Cómo aumento el tamaño del texto?", "Usa el selector Tamaño del texto, junto al Centro de ayuda. El navegador recuerda tu elección."],
                  ["¿Por qué no veo algunas pantallas?", "El menú muestra las secciones que están disponibles para tu rol."],
                ].map(([pregunta, respuesta]) => (
                  <div key={pregunta}><dt className="font-semibold">{pregunta}</dt><dd className="mt-1 text-muted-foreground">{respuesta}</dd></div>
                ))}
              </dl>
            </details>
            <details className="rounded-xl border border-border p-4">
              <summary className="cursor-pointer font-semibold">Estados y qué significan</summary>
              <div className="mt-4 grid gap-4">
                {grupos.map(grupo => <details key={grupo.titulo} className="rounded-lg bg-muted p-3">
                  <summary className="cursor-pointer font-medium">{grupo.titulo}</summary>
                  <dl className="mt-3 grid gap-3 text-sm">
                    {grupo.entradas.map(([estado, texto]) => <div key={estado}>
                      <dt className="font-semibold">{estado}</dt><dd className="text-muted-foreground">{texto}</dd>
                    </div>)}
                  </dl>
                </details>)}
              </div>
            </details>
            <details className="rounded-xl border border-border p-4">
              <summary className="cursor-pointer font-semibold">Flujo de trabajo completo</summary>
              <ol className="mt-4 grid gap-4">
                {flujo.map((etapa, index) => {
                  const destino = modulos.find(m => m.path === etapa.destino);
                  return <li key={etapa.titulo} className="flex gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted font-semibold text-primary">{index + 1}</span>
                    <div className="min-w-0">
                      <p className="font-semibold">{etapa.titulo}</p>
                      <p className="text-sm text-muted-foreground">{etapa.rol}</p>
                      <p className="mt-1 text-sm leading-relaxed">{etapa.texto}</p>
                      {destino && <Link to={`/app/${destino.path}`} onClick={() => cambiar(false)} className="mt-2 inline-block text-sm font-semibold text-primary underline">
                        Abrir {destino.label}
                      </Link>}
                    </div>
                  </li>;
                })}
              </ol>
              <div className="mt-5 grid gap-3 border-t border-border pt-4 text-sm">
                <div>
                  <h3 className="font-semibold">Reposición de stock</h3>
                  <p className="mt-1">Si faltan existencias, Finanzas registra la compra y Bodega confirma la cantidad recibida. Esa cantidad queda disponible en Catálogo.</p>
                </div>
                <div>
                  <h3 className="font-semibold">Seguimiento y auditoría</h3>
                  <p className="mt-1">Los reportes muestran indicadores de la operación según el rol. Gerencia puede revisar quién registró cambios desde Usuarios y auditoría.</p>
                </div>
              </div>
            </details>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
