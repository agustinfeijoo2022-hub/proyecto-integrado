# Validación de la entrega

Fecha: 17 de noviembre de 2026.

- Instalación limpia con `npm ci --no-audit --no-fund`: correcta.
- `npm run typecheck`: TypeScript sin errores.
- `npm test`: 22 pruebas aprobadas, 0 fallos.
- `npm run build`: build de producción correcto.
- `npm run test:integration`: correcta contra MongoDB local real y servidor HTTP Express. Verificó las cuatro cuentas, creación de artículo, compra atómica, stock, totales financieros y denegaciones de rol. La base temporal creada para la prueba se eliminó al terminar.
- MongoDB local: ping real `{ok: 1}`.
- PostgreSQL: configuración de pool y creación/liberación de tabla verificadas con dobles de prueba. Se detectó un puerto TCP local disponible en 5432, pero no se verificó una sesión PostgreSQL autenticada porque no se proporcionó DATABASE_URL con credenciales. Un puerto TCP disponible no demuestra una conexión autenticada. Debes configurar `.env` y ejecutar `npm run db:check`.
- Inicio: el servidor cancela el arranque si no se configura una cuenta o falla cualquiera de las dos bases.
- Diseño: CSS Tailwind y componentes compilan correctamente; no se realizó revisión visual automatizada en navegador.

Las pruebas de roles cubren cookies, sesión falsa, origen no autorizado, roles enviados en JSON, permisos de lectura/creación, validación, compra, cálculo financiero, logout y bloqueo de POST/PUT/PATCH/DELETE para Gerencia sobre artículos y compras. Los guards se prueban con la matriz de acceso de los cuatro roles.

Obras, Mis Tareas, Presupuestos, Cobranza y Usuarios conservan datos de demostración del código recibido. Este alcance se indica en la interfaz y en README; no se verifican como módulos persistentes.
