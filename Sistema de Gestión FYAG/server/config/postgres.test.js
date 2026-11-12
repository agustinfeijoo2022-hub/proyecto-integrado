import test from "node:test";
import assert from "node:assert/strict";
import { conectarPostgres, SQL_AUDITORIA, pool } from "./postgres.js";

test("PostgreSQL: inicialización opcional y tabla auditoria", async t => {
  const anterior = process.env.DATABASE_URL;
  process.env.DATABASE_URL = "postgresql://postgres:test@localhost:5432/test";
  t.after(async () => {
    if (anterior === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = anterior;
    await pool.end();
  });
  await t.test("conexión correcta: SQL exacto, log y liberación", async () => {
    let released = 0;
    const queries = [], logs = [], warnings = [];
    const fake = { connect: async () => ({ query: async sql => queries.push(sql), release: () => released++ }) };
    assert.equal(await conectarPostgres(fake, {log: m => logs.push(m), warn: (...m) => warnings.push(m)}), true);
    assert.deepEqual(queries, ["CREATE TABLE IF NOT EXISTS auditoria (id SERIAL PRIMARY KEY, accion VARCHAR(255), fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"]);
    assert.equal(queries[0], SQL_AUDITORIA);
    assert.deepEqual(logs, ["✅ [PostgreSQL] Conexión establecida correctamente"]);
    assert.equal(warnings.length, 0);
    assert.equal(released, 1);
  });
  await t.test("fallo de conexión: advertencia sin propagar error", async () => {
    const warnings = [];
    const fake = { connect: async () => { throw new Error("ECONNREFUSED"); } };
    assert.equal(await conectarPostgres(fake, {log: () => assert.fail("No debe registrar éxito"), warn: (...m) => warnings.push(m)}), false);
    assert.match(warnings[0].join(" "), /ECONNREFUSED/);
  });
  await t.test("fallo del CREATE TABLE: se libera la conexión y continúa", async () => {
    let released = 0;
    const warnings = [];
    const fake = { connect: async () => ({query: async () => {throw new Error("permission denied");}, release: () => released++}) };
    assert.equal(await conectarPostgres(fake, {log: () => assert.fail("No debe registrar éxito"), warn: (...m) => warnings.push(m)}), false);
    assert.equal(released, 1);
    assert.match(warnings[0].join(" "), /permission denied/);
  });
  await t.test("DATABASE_URL ausente: advertencia sin intentar conexión", async () => {
    delete process.env.DATABASE_URL;
    const fake = { connect: async () => assert.fail("No debe conectar sin configuración") };
    assert.equal(await conectarPostgres(fake, {log: () => assert.fail("No debe registrar éxito"), warn: () => {}}), false);
    process.env.DATABASE_URL = "postgresql://postgres:test@localhost:5432/test";
  });
});
