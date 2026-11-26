import type { Modulo } from "@/app/access";
import type { Rol } from "@/types";

export type PasoRecorrido = { id: string; titulo: string; texto: string };
export type SeccionRecorrido = Modulo | "detalle-obra";

const paso = (id: string, titulo: string, texto: string): PasoRecorrido => ({ id, titulo, texto });

const porSeccion: Record<SeccionRecorrido, readonly PasoRecorrido[]> = {
  dashboard: [],
  catalogo: [
    paso("buscar-productos", "Busca un producto", "Escribe el código o una parte del nombre. Si quieres ver solo un tipo de producto, elige una categoría. Borrar la búsqueda y escoger Todas las categorías vuelve a mostrar el catálogo completo."),
    paso("resultados-productos", "Lee las tarjetas del catálogo", "Cada tarjeta muestra el código, el nombre, la unidad y la cantidad que hay en stock. La unidad te dice cómo interpretar el número: por ejemplo, cinco metros es distinto de cinco cajas."),
  ],
  compras: [
    paso("movimientos-compras", "Encuentra una compra", "Los movimientos más recientes aparecen primero. Puedes buscar por proveedor, producto o código y combinar la búsqueda con el filtro de estado."),
    paso("lista-compras", "Distingue lo comprado de lo recibido", "Pendiente indica que la mercancía aún no se ha confirmado. Recibida indica que se registró la recepción. La cantidad comprada y la recibida pueden ser diferentes si el proveedor entregó menos unidades."),
  ],
  recepcion: [
    paso("orden-compra", "Elige la orden de compra", "Busca la compra pendiente que corresponde a la entrega del proveedor. Al seleccionarla, más abajo aparecerán sus datos para revisar el producto antes de confirmar."),
    paso("cantidad-recibida", "Confirma lo que llegó", "Cuenta las unidades y escribe la cantidad real. Al confirmar, solo esa cantidad se suma al inventario. Si todavía no seleccionaste una orden, primero vuelve al listado de compras pendientes."),
  ],
  obras: [
    paso("filtros-obras", "Encuentra una obra", "Busca por código o nombre. El filtro Estado te ayuda a encontrar, por ejemplo, las obras en proceso. El filtro Prioridad te permite revisar solo las altas, normales o bajas."),
    paso("lista-obras", "Lee una tarjeta de obra", "La tarjeta reúne el código, el estado, la prioridad y el avance. Un avance de 50 % significa que se informó la mitad del trabajo. Abre Ver detalle para consultar la obra y las acciones disponibles para tu perfil."),
  ],
  "mis-obras": [
    paso("filtros-obras", "Filtra las tareas", "Busca por código o nombre. Puedes combinar los filtros de estado y prioridad. Si no encuentras una tarea, borra la búsqueda y selecciona todos los estados y prioridades."),
    paso("lista-obras", "Ubica primero las tareas urgentes", "Las tarjetas aparecen de mayor a menor prioridad: Alta, Normal y Baja. Revisa también su estado y avance. Pulsa Ver detalle para consultar instrucciones y materiales."),
  ],
  "detalle-obra": [
    paso("estado-obra", "Entiende el estado de la obra", "El recorrido muestra las etapas desde el presupuesto aprobado hasta el cierre comercial. Finalizada indica que terminó el trabajo. El cierre comercial viene después y permite comprobar que no queden facturas pendientes."),
    paso("datos-obra", "Revisa el alcance de la obra", "Comprueba el servicio, la fecha de inicio, el presupuesto y el avance. Si la obra nació desde una solicitud, más abajo encontrarás las instrucciones del cliente y la fecha solicitada."),
    paso("materiales-obra", "Revisa los materiales y saldos", "Entregado es lo que recibió la obra. Utilizado es lo que ya se ocupó. Devuelto es lo que regresó a bodega. El saldo en obra indica lo que todavía queda disponible para trabajar."),
  ],
  solicitudes: [
    paso("lista-solicitudes", "Revisa el pedido de materiales", "La lista reúne el código del producto, la obra y la cantidad solicitada. Comprueba la disponibilidad antes de decidir. Aprobar descuenta esas unidades del stock de bodega."),
  ],
  "solicitudes-presupuesto": [
    paso("formulario-cotizar", "Describe lo que pidió el cliente", "Elige al cliente. Escribe el nombre del trabajo, dónde se realizará y qué debe incluir. Si sabes el plazo o los materiales y cantidades, anótalos para que Finanzas pueda preparar el presupuesto con esos antecedentes."),
    paso("stock-cotizar", "Comprueba las existencias", "Abrir catálogo en otra pestaña permite buscar un código y revisar el stock sin perder lo que escribiste. Consultar el catálogo no reserva unidades para la obra."),
  ],
  presupuestos: [
    paso("lista-presupuestos", "Lee un presupuesto", "Busca el folio y comprueba el cliente, el servicio, el total y el estado. Usa Ver alcance y partidas cuando esté disponible para desplegar lo que se cotizó y los materiales previstos."),
  ],
  clientes: [
    paso("buscar-clientes", "Localiza al cliente", "Escribe parte de la razón social u otro dato disponible para buscarlo. Comprueba que sea el cliente correcto antes de asociarlo a una solicitud o presupuesto."),
    paso("lista-clientes", "Revisa los datos del cliente", "La ficha reúne la razón social y los datos de identificación o contacto que se registraron. Un campo vacío significa que todavía no se ingresó ese dato."),
  ],
  facturacion: [
    paso("filtro-facturas", "Filtra las facturas", "Usa Estado para ver solo facturas pendientes, vencidas, con pago parcial o pagadas. Selecciona Todos para volver a ver el listado completo."),
    paso("lista-facturas", "Lee una factura", "El folio identifica la factura. En la tarjeta puedes comprobar la obra, el vencimiento, el monto, los pagos registrados y el saldo. Usa Descargar PDF para abrir su comprobante."),
  ],
  cobranza: [
    paso("filtro-facturas", "Encuentra los cobros pendientes", "Elige Vencida para revisar facturas cuyo plazo pasó, o Pago parcial para ver las que tienen abonos. Si buscas todas las cuentas, selecciona Todos."),
    paso("lista-facturas", "Distingue monto, pagado y saldo", "El monto es el total de la factura. Pagado es lo que ya se recibió. Saldo es lo que falta por cobrar. Por ejemplo, si una factura de $100.000 tiene un pago de $30.000, el saldo queda en $70.000."),
  ],
  reportes: [
    paso("totales-reporte", "Interpreta los importes de compras", "El monto neto es el valor antes del IVA. El IVA es el impuesto registrado. El total suma ambos valores. Estas cifras corresponden a compras, no a pagos de clientes."),
    paso("obras-reporte", "Compara los estados de obra", "El círculo se divide por estado, como En proceso o Finalizada. El porcentaje indica qué parte del total de obras está en ese estado. Por ejemplo, 25 % significa una de cada cuatro obras."),
  ],
  notificaciones: [
    paso("filtro-avisos", "Encuentra lo que queda por leer", "El punto rojo en la campana indica que tienes avisos nuevos. Marca Mostrar solo no leídas para concentrarte en ellos. Usa Actualizar avisos si esperas un mensaje que aún no aparece."),
  ],
  usuarios: [
    paso("perfiles", "Identifica los perfiles", "Aquí puedes consultar el nombre, el correo y el rol de los perfiles. El rol indica qué pantallas y acciones tiene disponibles cada usuario."),
    paso("auditoria", "Encuentra una operación en la auditoría", "Cada entrada indica quién hizo el cambio, cuándo y qué recurso se afectó. Utiliza la fecha y el nombre para ubicar una operación reciente."),
  ],
};

export function pasosDelApartado(seccion: SeccionRecorrido, rol: Rol): readonly PasoRecorrido[] {
  if (seccion === "dashboard") {
    return rol === "Gerencia" ? [
      paso("indicadores-gerencia", "Lee las cuatro cifras del panel", "Facturado es el importe total registrado. Cobrado suma los pagos recibidos. Por cobrar es el saldo que queda. Compras registradas muestra el gasto de compras y se consulta por separado."),
      paso("grafico-gerencia", "Lee el gráfico de obras por estado", "Cada barra representa un estado. Cuanto más larga es, más obras hay en ese grupo. Si En proceso marca 4, son cuatro obras activas. El número cuenta obras, no porcentaje de avance ni dinero."),
    ] : [
      paso("indicadores-stock", "Lee los indicadores de inventario", "Artículos registrados cuenta los tipos de producto. Stock crítico cuenta los que están en su mínimo o por debajo. Categorías indica cuántos grupos de productos hay."),
      paso("grafico-categorias", "Compara los productos por categoría", "En el gráfico de barras, cada categoría agrupa un tipo de producto. La altura de la barra indica cuántos artículos distintos hay en ese grupo, no cuántas unidades quedan."),
      paso("grafico-stock", "Entiende el gráfico de existencias", "El gráfico circular divide los artículos en Disponible y Stock crítico. Una parte más grande representa más artículos de ese grupo. Puedes consultar el número en el gráfico."),
      paso("alertas-stock", "Revisa qué productos necesitan atención", "Aquí aparecen los artículos que llegaron a su mínimo de stock. Compara las unidades que quedan con el mínimo indicado antes de planificar una compra o asignar materiales."),
    ];
  }
  if (seccion === "reportes" && rol !== "Encargado de Bodega") {
    const [totales, obras] = porSeccion.reportes;
    return [totales, paso("presupuestos-reporte", "Lee el gráfico de presupuestos", "Cada barra corresponde a un estado, como Enviado, Aprobado o Rechazado. Cuanto más alta es, más presupuestos hay en ese estado. El gráfico cuenta propuestas, no pesos."), obras];
  }
  if (seccion === "notificaciones") {
    const acciones: Record<Rol, string> = {
      Gerencia: "Pulsa Revisar presupuesto para abrir la propuesta que espera tu aprobación.",
      Finanzas: "Pulsa Preparar presupuesto para abrir el formulario con el cliente seleccionado y los antecedentes de Gerencia.",
      "Encargado de Bodega": "Lee el folio y los materiales. Usa Ir a Obras cuando el presupuesto esté aprobado.",
      Técnico: "Pulsa Ver obra asignada para consultar el alcance, la fecha solicitada y sus materiales.",
    };
    return [
      porSeccion.notificaciones[0],
      paso("lista-avisos", "Abre un aviso", `Cada aviso muestra su título, fecha y mensaje. ${acciones[rol]} Marca como leída para quitarlo de los pendientes.`),
    ];
  }
  if (seccion === "detalle-obra") {
    const [estado, datos, materiales] = porSeccion["detalle-obra"];
    const instrucciones = paso("instrucciones-obra", "Lee las instrucciones antes de empezar", "Aquí se indica lo que pidió el cliente, dónde se hará el trabajo y la fecha solicitada, cuando se registró. Revisa también los materiales previstos. Esos materiales son los planificados: la tabla siguiente muestra lo que realmente se entregó.");
    const historial = paso("historial-obra", "Consulta qué cambió y cuándo", "El historial reúne los cambios guardados, como asignaciones, prioridades y avances. Usa las fechas para ver en qué orden ocurrieron.");
    const pasos = [estado, datos];

    if (rol === "Técnico") {
      pasos[0] = paso("estado-obra", "Comprueba si la obra sigue activa", "En proceso significa que la obra sigue activa. Finalizada significa que el trabajo ya terminó. Revisa las instrucciones antes de registrar cualquier movimiento de materiales.");
    }
    if (rol === "Encargado de Bodega") {
      pasos.push(paso("gestion-obra", "Asigna al técnico y sus materiales", "Define la prioridad y elige quién hará el trabajo. Revisa las cantidades antes de guardar la primera asignación. Al guardarla, esas cantidades se descuentan de bodega y el técnico recibe un aviso."));
    }

    pasos.push(instrucciones, materiales);
    if (rol === "Técnico") {
      pasos.push(paso("registro-materiales-obra", "Registra cada movimiento de materiales", "En una obra activa, anota lo que usaste, devuelve lo que sobró o pide más unidades. El saldo en obra cambia cuando registras un uso o una devolución. Una solicitud queda pendiente hasta que se revise."));
    }
    pasos.push(historial);
    return pasos;
  }
  return porSeccion[seccion];
}
