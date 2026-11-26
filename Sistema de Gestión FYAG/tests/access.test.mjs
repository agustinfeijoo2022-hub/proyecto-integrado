import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
const source = readFileSync(new URL("../src/app/access.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } });
const { permisos, inicioPorRol, puedeAcceder, destinoSiDenegado } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
const matriz = {
  Gerencia: ["dashboard", "catalogo", "compras", "obras", "mis-obras", "presupuestos", "clientes", "facturacion", "cobranza", "reportes", "usuarios", "solicitudes-presupuesto", "notificaciones"],
  Finanzas: ["dashboard", "catalogo", "compras", "solicitudes", "presupuestos", "clientes", "facturacion", "cobranza", "reportes", "notificaciones"],
  "Encargado de Bodega": ["dashboard", "catalogo", "compras", "recepcion", "obras", "reportes", "notificaciones"],
  Técnico: ["mis-obras", "notificaciones"],
};
for (const [rol, esperados] of Object.entries(matriz)) {
  test(`Menú y autorización de ${rol}: matriz exacta`, () => {
    assert.deepEqual(Object.keys(permisos).filter(modulo => puedeAcceder(rol, modulo)).sort(), [...esperados].sort());
    for (const [modulo, roles] of Object.entries(permisos)) {
      const destino = destinoSiDenegado(rol, roles);
      assert.equal(destino, esperados.includes(modulo) ? null : inicioPorRol(rol));
    }
  });
}
test("Técnico: Mis Tareas y Notificaciones disponibles; otras rutas redirigen a /app/mis-obras", () => {
  assert.equal(inicioPorRol("Técnico"), "/app/mis-obras");
  for (const [modulo, roles] of Object.entries(permisos)) {
    assert.equal(destinoSiDenegado("Técnico", roles), ["mis-obras", "notificaciones"].includes(modulo) ? null : "/app/mis-obras");
  }
});
test("Sin sesión no se monta el layout protegido", () => {
  assert.equal(destinoSiDenegado(null), "/login");
  for (const roles of Object.values(permisos)) assert.equal(destinoSiDenegado(null, roles), "/login");
});
test("Login: los demás roles inician en /app/dashboard", () => {
  for (const rol of ["Gerencia", "Finanzas", "Encargado de Bodega"]) assert.equal(inicioPorRol(rol), "/app/dashboard");
});
