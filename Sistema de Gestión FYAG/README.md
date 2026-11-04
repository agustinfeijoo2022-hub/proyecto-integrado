# FYAG — Sistema de Gestión de Obras y Presupuestos (MVP)

Prototipo funcional frontend para **Frío y Agroindustria SpA (FYAG)**, empresa de refrigeración y climatización industrial.

> Proyecto Integrado TIHI43 — Unidad 2: Diseño de la solución de software
> INACAP — Analista Programador / Ingeniería en Informática

---

## Descripción

El sistema centraliza el ciclo comercial y operativo:

Cliente → Presupuesto → Aprobación → Obra → Técnico → Ejecución → Facturación → Cobro → Cierre

Resuelve la fragmentación de información y entrega visibilidad gerencial en tiempo real.

---

## Stack

- React 18 + Vite
- TypeScript (strict)
- TailwindCSS + shadcn/ui
- React Router v6
- Zustand
- Recharts
- lucide-react

---

## Estructura
src/
├── components/ # UI reutilizable
├── pages/ # Vistas por ruta
├── hooks/ # Custom hooks
├── store/ # Zustand (auth, obras)
├── data/ # mockData.ts
├── types/ # Interfaces TS
├── lib/ # Reglas de negocio
└── App.tsx

---

## Ejecución

```bash
pnpm install
pnpm dev
pnpm exec tsc --noEmit
pnpm build