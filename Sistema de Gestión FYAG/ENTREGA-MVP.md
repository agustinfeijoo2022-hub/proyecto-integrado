# FYAG · Guía técnica, manual breve y demo final

## Instalación y operación local

- Requisitos: Node.js 22.12 o superior, npm, Docker Desktop y los servicios de MongoDB y PostgreSQL configurados para el proyecto.
- Instala las dependencias con `npm ci`. Los archivos `docker-compose.yml` y `docker-compose.prototipo.yml` describen las configuraciones de contenedores disponibles.
- Conserva la configuración local del archivo `.env`. El backend usa `DATABASE_URL`, `MONGODB_URI`, el origen del frontend y las contraseñas de cada rol. Mantén las credenciales en tu equipo.
- Ejecuta `npm run db:check` para verificar ambas bases. En dos terminales usa `npm run server` y `npm run dev`. Abre la dirección que indique Vite. Reinicia la terminal del backend después de cambios en el servidor.
- Ejecuta `npm run typecheck`, `npm test`, `npm run build` y `npm run test:integration` para verificar código, compilación e integración.
- PostgreSQL conserva obras, clientes, presupuestos, facturas, pagos y auditoría. MongoDB conserva catálogo y compras, junto con los movimientos de inventario asociados.
- El panel de Gerencia usa `GET /api/dashboard/gerencia`. PostgreSQL agrega los importes de facturas y pagos y agrupa las obras por estado. MongoDB agrega el importe de compras. La página recibe un resumen, con importes acumulados en CLP.
- La API comprueba la sesión y los permisos en el servidor. Gerencia y Finanzas consultan clientes y facturación. Finanzas registra facturas y pagos. Gerencia consulta la auditoría desde Usuarios. La auditoría registra las operaciones de escritura exitosas con usuario, rol, recurso y resultado.

## Manual por rol

1. **Gerencia.** Abre Dashboard para revisar facturación, cobranza, compras y obras por estado. Usa **Actualizar datos** para recargar el resumen. Abre **Usuarios** para consultar los movimientos de auditoría y **Reportes** para exportar datos.
2. **Finanzas.** Selecciona un cliente para registrar un presupuesto. Desde **Facturación**, crea una factura asociada a una obra vigente y usa **Descargar PDF** para imprimirla. En **Cobranza**, revisa vencimientos y registra pagos hasta el saldo disponible.
3. **Encargado de Bodega.** Consulta existencias en **Catálogo**. En **Recepción Mercancía**, confirma las compras recibidas. En **Obras**, revisa materiales y el avance de cada trabajo.
4. **Técnico.** Abre **Mis Tareas** y entra al detalle de una obra. Desde el apartado de materiales puedes registrar consumo, pedir productos y devolver sobrantes en las obras asignadas que admiten la operación.

## Guion para la demostración

1. Abrir una sesión de Bodega y mostrar un código de catálogo, una compra y su estado de recepción.
2. Entrar como Técnico, abrir una obra asignada y mostrar los controles de consumo y solicitud de materiales.
3. Entrar como Finanzas, abrir una factura vinculada, descargar su PDF y mostrar en Cobranza cómo se refleja un pago parcial.
4. Entrar como Gerencia, actualizar el panel, revisar el gráfico de obras, abrir la auditoría y descargar un reporte en Excel.
5. Mostrar el modo nocturno y una vista móvil. Usar datos de prueba para cualquier cambio durante la demo.

## Revisión del tablero

| Tarea | Evidencia de cierre |
| --- | --- |
| T21 | Consulta de indicadores agregados desde PostgreSQL y MongoDB. |
| T22 | Panel de Gerencia en React con cuatro importes y gráfico de obras. |
| T26 | Permisos de interfaz y servidor para facturación, cobranza y panel gerencial. |
| T27 | Auditoría persistente, consultable por Gerencia. |
| T31 | Medición local del endpoint con datos del prototipo y revisión de la compilación. |
| T34 | Validación de acceso por rol y flujos de inventario y facturación contra las bases locales. |
| T35 | Guía técnica y manual de uso por rol en este documento. |
| T36 | Guion de demostración y revisión de tareas listos para la presentación. La exposición corresponde al equipo. |

Si la entrega exige alojamiento público, el despliegue público de T33 requiere su propia verificación.

## Evidencia de la revisión local

- 23 pruebas automatizadas aprobadas y compilación del frontend correcta.
- Verificación de conexiones autenticadas con PostgreSQL y MongoDB.
- Prueba del flujo comercial en un esquema PostgreSQL temporal: alta de cliente, facturas, pago parcial, control de exceso, cierre de obra, permisos y auditoría.
- Panel abierto en Chrome en escritorio y a 390 px de ancho, con indicadores y gráfico renderizados.
- Medición del endpoint del panel con MongoDB y PostgreSQL locales: 15 solicitudes secuenciales después de una primera llamada, mediana de 6 ms y percentil 95 de 8 ms. El resultado corresponde al volumen de datos del prototipo.
