import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { readdirSync, readFileSync, copyFileSync, existsSync } from "node:fs";
import ts from "typescript";
const require = createRequire(import.meta.url);
const root = dirname(require.resolve("react-router/package.json"));
const dev = join(root, "dist", "development");
const prod = join(root, "dist", "production");
let repaired = 0;
for (const name of readdirSync(dev).filter(n => /^context-.*\.d\.mts$/.test(n))) {
  const target = join(dev, name);
  const current = readFileSync(target, "utf8");
  if (!current.includes("export const router") || !current.includes("RutaProtegida")) continue;
  const source = join(prod, name);
  if (!existsSync(source)) throw new Error(`No existe la declaración original para ${name}. Reinstala las dependencias con npm ci.`);
  const valid = readFileSync(source, "utf8");
  const parsed = ts.createSourceFile(name, valid, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  if (parsed.parseDiagnostics.length || valid.includes("export const router")) throw new Error("La copia de producción tampoco es válida. Ejecuta npm ci.");
  copyFileSync(target, `${target}.fyag-backup`);
  copyFileSync(source, target);
  console.log(`Restaurado ${name} usando la declaración de producción de la misma versión instalada.`);
  repaired++;
}
console.log(repaired ? `${repaired} declaración reparada. Ejecuta npm run typecheck.` : "No se detectó la corrupción conocida en react-router.");
