# FYAG — Sistema de Gestión Logística

Proyecto completo y unificado: frontend React/TypeScript/Tailwind, backend Express, inventario MongoDB, conexión PostgreSQL, tabla auditoria y permisos actualizados. Esta entrega se abre como una carpeta nueva; no requiere copiar parches ni combinar entregas anteriores.

## 1. Requisitos

- Node.js 22.12 o posterior compatible con Vite (recomendado: una versión LTS).
- PostgreSQL local iniciado, con la base `fyag_db` ya creada.
- MongoDB local iniciado. La base predeterminada del inventario es `fyag_logs`.

La carpeta `FYAG` dentro del ZIP es la raíz del proyecto. Allí están package.json, package-lock.json, vite.config.ts y .env.example. No se incluyen node_modules ni dist: se generan con npm.

## 2. Instalación y configuración

Abre la carpeta `FYAG` en Visual Studio Code y ejecuta en su terminal:

```powershell
npm install
Copy-Item .env.example .env
```

El ejemplo ya contiene tu conexión PostgreSQL local:

```dotenv
DATABASE_URL=postgresql://postgres:admin123@localhost:5432/fyag_db
```

Abre `.env` y completa las contraseñas de las cuentas que utilizarás. Cada contraseña debe tener entre 12 y 256 caracteres. Debes configurar al menos una cuenta para iniciar el servidor; las cuentas con contraseña vacía quedan deshabilitadas. No existen contraseñas de acceso predeterminadas.

| Cuenta | Variable que debes completar | Inicio |
| --- | --- | --- |
| gerencia@fyag.cl | FYAG_GERENCIA_PASSWORD | /dashboard |
| finanzas@fyag.cl | FYAG_FINANZAS_PASSWORD | /dashboard |
| supervisor@fyag.cl | FYAG_SUPERVISOR_PASSWORD | /dashboard |
| tecnico@fyag.cl | FYAG_TECNICO_PASSWORD | /mis-obras |

El `.env` completo utiliza estas variables, todas incluidas y comentadas en `.env.example`:

| Variable | Valor o finalidad |
| --- | --- |
| PORT | 3001 |
| FRONTEND_ORIGIN | http://localhost:8443 |
| VITE_API_URL | http://localhost:3001/api |
| DATABASE_URL | postgresql://postgres:admin123@localhost:5432/fyag_db |
| MONGODB_URI | mongodb://127.0.0.1:27017/fyag_logs |
| COOKIE_SECURE | false para desarrollo local HTTP |
| FYAG_GERENCIA_PASSWORD | Tu contraseña para Gerencia |
| FYAG_FINANZAS_PASSWORD | Tu contraseña para Finanzas |
| FYAG_SUPERVISOR_PASSWORD | Tu contraseña para Supervisor |
| FYAG_TECNICO_PASSWORD | Tu contraseña para Técnico |

Si tu MongoDB requiere autenticación o utiliza otra dirección, modifica MONGODB_URI. El archivo `.env` debe quedar junto a package.json. No hace falta modificar código de conexión. `.env` está excluido de Git; no pongas contraseñas en variables VITE_* porque estas se incluyen en el navegador.

## 3. Ejecución

Con PostgreSQL y MongoDB iniciados, abre dos terminales en la carpeta `FYAG`.

**Terminal 1 — backend:**

```powershell
npm run server
```

**Terminal 2 — frontend:**

```powershell
npm run dev
```

Abre http://localhost:8443. La API está en http://localhost:3001/api.

Al conectar PostgreSQL y crear/verificar la tabla, el servidor muestra:

```text
✅ [PostgreSQL] Conexión establecida correctamente
```

Si PostgreSQL falla, el servidor muestra una advertencia y continúa con MongoDB. MongoDB sigue siendo obligatorio para los endpoints de inventario/compras. Si falla MongoDB o no se configura ninguna cuenta, el servidor informa el problema y no inicia.

Para comprobar PostgreSQL desde pgAdmin puedes ejecutar:

```sql
SELECT * FROM auditoria;
```

El servidor ejecuta automáticamente este SQL al arrancar:

```sql
CREATE TABLE IF NOT EXISTS auditoria (id SERIAL PRIMARY KEY, accion VARCHAR(255), fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
```

Esta versión crea la tabla como verificación de la arquitectura híbrida. No añade registros de auditoría de todas las operaciones; una tabla vacía tras el primer arranque es normal.

## 4. Roles y separación de funciones

| Rol | Menú y rutas |
| --- | --- |
| Gerencia | Dashboard, Catálogo, Compras, Obras, Presupuestos, Cobranza, Reportes, Usuarios |
| Finanzas | Dashboard, Compras, Presupuestos, Cobranza, Reportes |
| Supervisor | Dashboard, Catálogo, Obras |
| Técnico | Únicamente Mis Tareas (/mis-obras) |

- Gerencia puede consultar Catálogo y Compras, pero no ve el botón Nuevo Artículo ni el formulario de registro de compras. La API también rechaza sus intentos de crear artículos o compras.
- Supervisor puede crear artículos; Finanzas puede registrar compras. Se conservan los permisos de acceso de cada módulo; Finanzas no obtiene la pantalla Catálogo ni Supervisor obtiene Compras.
- El Técnico no ve Dashboard. El login lo envía a /mis-obras y las rutas administrativas, aunque se escriban a mano, lo redirigen a /mis-obras antes de montar sus pantallas. Sin sesión, las rutas protegidas llevan a /login.
- La navegación y los guards usan src/app/access.ts. Las pantallas obtienen el rol desde useAppStore.
- El servidor valida la sesión y el rol en cada endpoint administrativo. Enviar un rol distinto en el cuerpo de una solicitud no otorga permisos.

| Endpoint | Roles permitidos |
| --- | --- |
| GET /api/articulos | Gerencia, Finanzas, Supervisor |
| POST /api/articulos | Supervisor |
| GET /api/compras | Gerencia, Finanzas |
| POST /api/compras | Finanzas |

Finanzas lee artículos desde la API para el Dashboard y el selector de productos en Compras. Ese acceso no permite crear artículos.

## 5. Qué incluye la interfaz

Layout oscuro adaptable con navegación móvil, iconos y estado activo; tarjetas de KPIs y gráfico con inventario real; catálogo con búsqueda y tabla; modal accesible centrado con fondo oscuro; formulario de compras y tabla de los últimos 50 movimientos guardados. Las pantallas se cargan mediante lazy/Suspense.

La API común verifica errores HTTP, envía cookies y permite configurar la URL. El catálogo usa _id de MongoDB y respeta stockCritico=0. Los formularios validan y bloquean los envíos mientras esperan respuesta.

Cada compra recalcula su total en el servidor y guarda el movimiento con el incremento de stock en una sola escritura MongoDB ($inc y $push). No necesita un replica set para esa operación. Los importes del lote se expresan en pesos enteros y mantienen la convención del MVP de IVA 19%; las cantidades pueden ser fraccionarias según la unidad.

## 6. Alcance de los módulos del MVP

Inventario y compras usan MongoDB. PostgreSQL se conecta al arrancar y crea la tabla auditoria. No hay datos ni credenciales de sesión preexistentes empaquetados.

Obras, presupuestos, cobranza, reportes y usuarios conservan las pantallas y datos de demostración del proyecto, identificados como tales en la interfaz. Sus cambios no se guardan en el backend. Mis Tareas filtra por tecnicoId en esos datos; todavía no hay una API de obras con autorización por asignación. Usuarios no modifica las cuentas configuradas en .env. Las exportaciones de reportes continúan identificadas como simuladas.

Los datos de demostración incluidos en el bundle no son información privada protegida por API. Al conectar esos módulos con datos reales, su servidor debe autorizar cada operación y asignación.

La autenticación utiliza las cuentas del backend configuradas en .env, scrypt y cookies HttpOnly/SameSite=Strict. Las sesiones duran ocho horas y viven en memoria: reiniciar Node cierra las sesiones. Para múltiples instancias se necesita un almacén compartido; para HTTPS utiliza COOKIE_SECURE=true.

## 7. Estructura

```text
FYAG/
  package.json
  package-lock.json
  vite.config.ts
  tsconfig.json
  index.html
  .env.example
  .gitignore
  README.md
  public/
  src/
    app/
    components/
    data/
    hooks/
    layouts/
    lib/
    pages/
    store/
    types/
    main.tsx
    App.tsx
    index.css
  server/
    index.js
    app.js
    app.test.js
    config/
      mongo.js
      postgres.js
      postgres.test.js
    models/
      Articulo.js
  scripts/
    repair-router-types.mjs
  tests/
    access.test.mjs
```

El script de reparación de tipos se conserva para instalaciones antiguas cuyo react-router contenía un archivo dañado. Una instalación nueva con npm install no reutiliza el node_modules del ZIP original. No se incluyen parches ni pasos de combinación.

## 8. Verificación

```powershell
npm run check
```

Ejecuta TypeScript, las pruebas de permisos/API/PostgreSQL y la compilación de producción.

Verificado en el proyecto unificado: TypeScript sin errores, 21 pruebas aprobadas y build correcto. Las pruebas de bases de datos utilizan dobles de prueba; no acceden a tu PostgreSQL o MongoDB local. La conexión real se comprueba al arrancar el servidor en tu equipo. También se comprobó previamente el HTML renderizado de los formularios por rol; no se completó una revisión visual en navegador desde este entorno.

## 9. Resolución de problemas

- **No inicia porque faltan cuentas:** crea .env desde .env.example y completa al menos una contraseña FYAG_*_PASSWORD.
- **PostgreSQL advierte ECONNREFUSED:** inicia el servicio y verifica localhost:5432. La aplicación puede continuar con MongoDB.
- **PostgreSQL rechaza la contraseña/base:** revisa DATABASE_URL y que exista fyag_db. Reinicia el backend tras editar .env.
- **MongoDB no conecta:** inicia el servicio y revisa MONGODB_URI. El inventario requiere esa conexión.
- **8443 ocupado:** cierra el Vite anterior o cambia el puerto en vite.config.ts y FRONTEND_ORIGIN conjuntamente. Vite usa strictPort.
- **Sesión/cookie no funciona:** abre la aplicación con localhost, igual que las URLs de ejemplo; no mezcles localhost y 127.0.0.1 en las URLs del navegador. MongoDB sí puede usar 127.0.0.1 en su URI.
- **Código de artículo repetido:** la API responde 409. Si existen duplicados históricos, resuélvelos antes de construir el índice único; esta entrega no elimina datos.
