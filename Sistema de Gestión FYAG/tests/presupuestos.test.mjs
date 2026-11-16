import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { calcularTotales as calcularTotalesServidor } from "../server/routes/presupuestos.js";

// Misma técnica que access.test.mjs: se compila el .ts a JS y se importa.
const source = readFileSync(new URL("../src/lib/presupuestos.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } });
const { calcularTotales, validarFormulario, itemsParaEnviar, aNumero, tiposServicio, estadosPresupuesto } =
  await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);

const item = (sobrescribir = {}) => ({ id: "i1", descripcion: "Cámara de frío", cantidad: "3", precioUnitario: "1450000", ...sobrescribir });

test("calcularTotales: neto, IVA 19 % y total en pesos enteros", () => {
  assert.deepEqual(calcularTotales([{ cantidad: 3, precioUnitario: 1450000 }]), { neto: 4350000, iva: 826500, total: 5176500 });
  assert.deepEqual(calcularTotales([]), { neto: 0, iva: 0, total: 0 });
});

test("el cálculo del navegador y el del servidor coinciden siempre", () => {
  let semilla = 42;
  const azar = () => (semilla = (semilla * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let i = 0; i < 500; i++) {
    const items = Array.from({ length: 1 + Math.floor(azar() * 6) }, () => ({
      cantidad: Math.round(azar() * 5000) / 100 + 0.01,
      precioUnitario: 1 + Math.floor(azar() * 5_000_000),
    }));
    assert.deepEqual(calcularTotales(items), calcularTotalesServidor(items));
  }
});

test("validarFormulario: acepta un presupuesto completo", () => {
  const r = validarFormulario("c1", [item(), item({ id: "i2", cantidad: "1.5", precioUnitario: "99000" })]);
  assert.equal(r.valido, true);
  assert.deepEqual(r.items, {});
});

test("validarFormulario: exige cliente", () => {
  const r = validarFormulario("", [item()]);
  assert.equal(r.valido, false);
  assert.ok(r.cliente);
});

test("validarFormulario: marca cada ítem inválido con su mensaje", () => {
  const casos = [
    item({ descripcion: "   " }),
    item({ descripcion: "x".repeat(161) }),
    item({ cantidad: "" }),
    item({ cantidad: "0" }),
    item({ cantidad: "-2" }),
    item({ cantidad: "abc" }),
    item({ precioUnitario: "" }),
    item({ precioUnitario: "0" }),
    item({ precioUnitario: "-100" }),
    item({ precioUnitario: "1500.5" }),
  ];
  for (const caso of casos) {
    const r = validarFormulario("c1", [caso]);
    assert.equal(r.valido, false, JSON.stringify(caso));
    assert.ok(r.items[caso.id], JSON.stringify(caso));
  }
});

test("validarFormulario: un ítem malo no oculta a los buenos", () => {
  const r = validarFormulario("c1", [item(), item({ id: "i2", descripcion: "" })]);
  assert.equal(r.valido, false);
  assert.deepEqual(Object.keys(r.items), ["i2"]);
});

test("itemsParaEnviar: convierte a número y limpia espacios", () => {
  assert.deepEqual(itemsParaEnviar([item({ descripcion: "  Filtro  ", cantidad: "2.5", precioUnitario: "1000" })]), [
    { descripcion: "Filtro", cantidad: 2.5, precioUnitario: 1000 },
  ]);
});

test("aNumero: vacío es NaN, no 0", () => {
  assert.ok(Number.isNaN(aNumero("")));
  assert.ok(Number.isNaN(aNumero("   ")));
  assert.equal(aNumero("12"), 12);
});

test("catálogos: ocho tipos de servicio y cuatro estados, igual que el servidor", async () => {
  const { TIPOS_SERVICIO, ESTADOS_PRESUPUESTO } = await import("../server/models/Presupuesto.js");
  assert.deepEqual([...tiposServicio], TIPOS_SERVICIO);
  assert.deepEqual([...estadosPresupuesto], ESTADOS_PRESUPUESTO);
});
