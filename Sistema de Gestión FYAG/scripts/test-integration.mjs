import mongoose from 'mongoose';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { createApp } from '../server/app.js';
import Articulo from '../server/models/Articulo.js';
const database = 'fyag_verificacion_' + randomBytes(6).toString('hex');
const origin = 'http://localhost:8443';
const env = { FRONTEND_ORIGIN: origin };
for (const role of ['GERENCIA','FINANZAS','SUPERVISOR','TECNICO']) env[`FYAG_${role}_PASSWORD`] = randomBytes(24).toString('hex');
let server, app;
try {
  await mongoose.connect(`mongodb://127.0.0.1:27017/${database}`, {serverSelectionTimeoutMS:3000});
  await Articulo.init();
  app = createApp(Articulo, env);
  server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  const url = `http://127.0.0.1:${server.address().port}/api`;
  const req = (path, cookie, method='GET', data) => fetch(url+path, {method, headers:{Origin:origin, ...(cookie?{Cookie:cookie}:{}), ...(data?{'Content-Type':'application/json'}:{})}, ...(data?{body:JSON.stringify(data)}:{})});
  const cookies = {};
  for (const role of ['GERENCIA','FINANZAS','SUPERVISOR','TECNICO']) {
    const response = await req('/auth/login', null, 'POST', {email:(role === 'SUPERVISOR' ? 'bodega' : role.toLowerCase())+'@fyag.cl', password:env[`FYAG_${role}_PASSWORD`]});
    assert.equal(response.status, 200);
    cookies[role] = response.headers.get('set-cookie').split(';')[0];
  }
  let r = await req('/articulos', cookies.SUPERVISOR, 'POST', {codigo:'VERIFY-1',nombre:'Artículo de verificación',stock:0});
  assert.equal(r.status,201);
  r = await req('/compras', cookies.FINANZAS, 'POST', {codigoArticulo:'VERIFY-1',cantidad:3,proveedor:'Proveedor de prueba',monto:10000,descuento:10});
  assert.equal(r.status,201);
  const {total, compra} = await r.json();
  assert.equal(total,10710);
  r = await req('/articulos',cookies.GERENCIA);
  assert.equal((await r.json())[0].stock,0);
  const recepcion = `/compras/${compra.articuloId}/recibir/${compra.id}`;
  assert.equal((await req(recepcion,cookies.FINANZAS,'POST',{cantidad:3})).status,403);
  assert.equal((await req(recepcion,cookies.SUPERVISOR,'POST',{cantidad:3})).status,200);
  assert.equal((await req(recepcion,cookies.SUPERVISOR,'POST',{cantidad:3})).status,409);
  r = await req('/reportes/finanzas',cookies.FINANZAS);
  assert.deepEqual(await r.json(),{operaciones:1,neto:9000,iva:1710,total:10710});
  r = await req('/articulos',cookies.GERENCIA);
  assert.equal((await r.json())[0].stock,3);
  assert.equal((await req('/articulos',cookies.GERENCIA,'POST',{codigo:'DENEGADO'})).status,403);
  assert.equal((await req('/compras',cookies.TECNICO)).status,403);
  console.log('Integración HTTP + MongoDB real OK: login 4 roles, creación, compra, recepción, reporte consolidado, stock y RBAC.');
} finally {
  if (app) app.locals.dispose();
  if (server) await new Promise(resolve => server.close(resolve));
  if (mongoose.connection.readyState === 1 && mongoose.connection.name === database && database.startsWith('fyag_verificacion_')) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
}
