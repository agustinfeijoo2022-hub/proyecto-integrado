# FYAG — Sistema de Gestión Logística

React + TypeScript + Tailwind CSS 4, Express, MongoDB y PostgreSQL.

## Inicio paso a paso

Requisitos: Node.js 22.12 o posterior (recomendado Node 24 LTS), npm, MongoDB y PostgreSQL locales en ejecución.
Extrae el ZIP y abre una terminal dentro de la carpeta `FYAG`, donde está `package.json`.

### 1. Haz npm install

```powershell
npm install
```

### 2. Configura el .env con estas variables

Copia `.env.example` a `.env` (en PowerShell: `Copy-Item .env.example .env`).

```dotenv
PORT=3001
FRONTEND_ORIGIN=http://localhost:8443
VITE_API_URL=http://localhost:3001/api
MONGODB_URI=mongodb://127.0.0.1:27017/fyag_logs
DATABASE_URL=postgresql://postgres:TU_CLAVE_POSTGRES@127.0.0.1:5432/fyag_db
COOKIE_SECURE=false
FYAG_GERENCIA_PASSWORD=
FYAG_SUPERVISOR_PASSWORD=
FYAG_FINANZAS_PASSWORD=
FYAG_TECNICO_PASSWORD=
```

Sustituye TU_CLAVE_POSTGRES por la contraseña de tu instalación; si contiene caracteres especiales, codifícala para una URL. Completa las cuatro contraseñas de acceso con valores propios de 12 a 256 caracteres. Las cuentas vacías quedan deshabilitadas y debe existir al menos una configurada. No hay credenciales de acceso predeterminadas. Nunca pongas secretos en variables `VITE_*`.

En pgAdmin o psql, conectado a la base `postgres`, crea la base una sola vez:

```sql
CREATE DATABASE fyag_db;
```

El usuario de DATABASE_URL debe tener permisos para conectarse y crear la tabla `auditoria`. MongoDB crea `fyag_logs` y la colección al inicializar el modelo. No hace falta replica set: la compra y el ingreso de stock se guardan en una sola escritura atómica.

Comprueba ambas conexiones reales con:

```powershell
npm run db:check
```

Este comando conecta a los dos servicios y devuelve un código de error si alguno no responde. También inicializa la tabla de PostgreSQL. El backend exige ambas bases disponibles antes de escuchar peticiones.

### 3. Ejecuta npm run server

```powershell
npm run server
```

### 4. Ejecuta npm run dev

En una segunda terminal, dentro de la misma carpeta:

```powershell
npm run dev
```

Abre http://localhost:8443. API: http://localhost:3001/api. Usa siempre `localhost` en el navegador y en FRONTEND_ORIGIN para que coincidan origen y cookies. Reinicia ambos procesos después de modificar `.env`.

## Cuentas y permisos

| Correo | Rol | Acceso |
| --- | --- | --- |
| gerencia@fyag.cl | Gerencia | Todos los módulos, incluida la vista de tareas; artículos y compras solo lectura |
| supervisor@fyag.cl | Supervisor | Dashboard, crear artículos, Obras |
| finanzas@fyag.cl | Finanzas | Dashboard, crear compras, reportes financieros, Presupuestos y Cobranza |
| tecnico@fyag.cl | Técnico | Únicamente Mis Tareas, en `/mis-obras` |

La contraseña de cada cuenta es la definida por ti en su variable FYAG_*_PASSWORD.

Las rutas, el menú y los formularios respetan los roles. Cualquier ruta distinta de `/mis-obras` redirige allí al Técnico autenticado, incluido `/login` y rutas desconocidas. Sin sesión se redirige a `/login`.

La API autentica cookies HttpOnly, SameSite=Strict y sesiones de ocho horas. El rol se resuelve en el servidor; enviar un rol en JSON no cambia los permisos. Gerencia no puede crear, actualizar ni eliminar artículos o compras, incluso mediante llamadas manuales POST/PUT/PATCH/DELETE. Solo Supervisor puede crear artículos y solo Finanzas registrar compras. Técnico no accede a endpoints administrativos. El inicio de sesión limita intentos y verifica contraseñas mediante scrypt.

Las sesiones viven en memoria: reiniciar el servidor exige ingresar otra vez. COOKIE_SECURE=false corresponde a HTTP local; para un despliegue HTTPS cambia a true y configura sus orígenes.

## Diseño

Menú lateral oscuro con degradado, navegación activa y menú móvil accesible. Dashboard con tarjetas oscuras, acentos celestes y ámbar, bordes suaves, gráfico con tooltip oscuro y estados de carga/error/vacío. Tailwind CSS se integra mediante el plugin oficial de Vite. Respeta la preferencia de movimiento reducido.

## Persistencia y alcance del código original

- **Inventario y compras:** conectados a MongoDB; datos reales, validación de servidor, índice único por código, historial y actualización atómica de stock. Los montos son enteros en CLP; IVA 19% calculado por el servidor.
- **Reporte financiero:** consolida todo el historial real de compras en MongoDB (neto, IVA, total y cantidad de operaciones); exportación CSV funcional. No depende del límite de 50 registros de la pantalla Compras.
- **PostgreSQL:** conexión obligatoria, pool configurado, tiempos máximos y creación de tabla `auditoria` al iniciar. La tabla conserva el alcance original: está preparada, pero no registra automáticamente operaciones. MongoDB es la fuente de inventario y compras.
- **PostgreSQL:** presupuestos, obras, clientes, facturas, pagos, historial y eventos de auditoría. El backend prepara sus tablas al iniciar.
- **Clientes, Facturación y Cobranza:** Gerencia consulta los registros y Finanzas puede crear o editar clientes, registrar facturas vinculadas a obras y aplicar pagos parciales o completos. El saldo se calcula desde los pagos guardados. La lista inicial conserva los nombres de clientes de ejemplo asociados a los presupuestos existentes. No se importan facturas ficticias.
- **Obras:** la API valida los cambios de estado. Una obra con pagos asociados no se puede cancelar y una obra con facturas pendientes no puede pasar a cierre comercial.
- **Usuarios:** la lista de la interfaz es de referencia. La administración de cuentas se realiza mediante la configuración del servidor.

## Prototipo en Docker

La configuración adicional sirve el frontend compilado y la API desde un contenedor, con MongoDB y PostgreSQL del Compose base. Usa el archivo `.env` de la instalación y conserva los volúmenes existentes. Se publica solamente en el equipo local.

```powershell
docker compose -f docker-compose.yml -f docker-compose.prototipo.yml up -d --build
```

Abre http://localhost:8080. Para consultar los registros del contenedor, usa el mismo par de archivos Compose con el comando `logs fyag`. Continúa usando dos terminales en VS Code si trabajas en desarrollo.


## Estructura

```text
FYAG/
  .env.example
  .gitignore
  package.json
  package-lock.json
  README.md
  VALIDACION.md
  vite.config.ts
  tsconfig.json
  index.html
  public/
  src/
    app/          # Router y matriz de acceso
    components/   # Componentes y formularios
    data/         # Ejemplos originales
    hooks/
    layouts/      # Navegación adaptable
    lib/          # Cliente API y utilidades
    pages/
    store/
    types/
    main.tsx
    index.css
  server/
    app.js        # Sesiones, validación y RBAC
    index.js      # Inicio y cierre de conexiones
    config/       # MongoDB y PostgreSQL
    models/       # Artículo e historial de compras
  scripts/
    check-db.mjs
  tests/
```

El ZIP no incluye node_modules, dist, cachés ni credenciales. `npm install` y `npm run build` los generan cuando corresponda.

## Validación

```powershell
npm run check
```

Ejecuta TypeScript, pruebas de autorización/API/configuración y build de producción. Consulta `VALIDACION.md` para los resultados de esta entrega y el alcance de las comprobaciones locales.

Prueba adicional contra MongoDB local real:

```powershell
npm run test:integration
```

Crea una base temporal `fyag_verificacion_*`, verifica login de los cuatro roles, creación de artículo, compra, reporte, stock y rechazos RBAC por HTTP. Elimina únicamente esa base temporal al finalizar. Usa MongoDB local sin autenticación; no modifica `fyag_logs` ni requiere tus contraseñas. Para tu configuración de bases usa `npm run db:check`.

## Problemas habituales

- **ECONNREFUSED:** inicia ambos servicios locales, revisa puertos 27017 y 5432 y ejecuta `npm run db:check`.
- **PostgreSQL rechaza la conexión:** revisa usuario, contraseña, base y permisos. El servidor no inicia si una base falla.
- **No hay cuentas configuradas:** completa al menos una FYAG_*_PASSWORD de 12 a 256 caracteres.
- **Puerto 8443 ocupado:** libera el puerto o cambia conjuntamente vite.config.ts y FRONTEND_ORIGIN.
- **Sesión no funciona:** no mezcles localhost y 127.0.0.1 en las URLs del navegador; COOKIE_SECURE debe ser false en HTTP.
- **Artículo duplicado:** el servidor devuelve 409. Si tu base ya contiene códigos repetidos, corrígelos antes de crear el índice; el proyecto no elimina tus datos.

## Portada y acceso

La aplicación abre en la portada de FYAG. El botón **Iniciar sesión** lleva al formulario de acceso con cuenta de trabajo. En el menú de la aplicación, el Centro de ayuda reúne el recorrido por pantalla, preguntas frecuentes y el flujo por perfil.
