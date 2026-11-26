import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const currency = (value: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value);

// --- FUNCIÓN BLINDADA PARA POSTGRESQL ---
export const shortDate = (value: string | Date | null | undefined) => {
  if (!value) return "—";

  // Si ya tiene formato ISO (ej. "2026-11-18T00:00:00.000Z"), lo usa directo.
  // Si viene como texto simple ("2026-11-18"), le agrega el mediodía.
  const dateString = typeof value === "string" && value.includes("T") 
    ? value 
    : `${value}T12:00:00`;

  const date = new Date(dateString);

  // Si la fecha es inválida o viene vacía, muestra un guion en lugar de romper la app.
  if (isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("es-CL", { 
    day: "2-digit", 
    month: "short", 
    year: "numeric" 
  }).format(date);
};