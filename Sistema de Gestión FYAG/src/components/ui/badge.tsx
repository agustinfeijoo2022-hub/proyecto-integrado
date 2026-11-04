import { cn } from "@/lib/utils";

const variants: Record<string, string> = {
  "En proceso": "bg-info-light text-info-dark", Finalizada: "bg-success-light text-success-dark",
  "Cierre comercial": "bg-success-light text-success-dark", Suspendida: "bg-muted text-muted-foreground",
  Cancelada: "bg-danger-light text-danger-dark", Pagada: "bg-success-light text-success-dark",
  Pagado: "bg-success-light text-success-dark", Pendiente: "bg-warning-light text-warning-dark",
  Vencida: "bg-danger-light text-danger-dark", Aprobado: "bg-success-light text-success-dark",
  Enviado: "bg-info-light text-info-dark", Borrador: "bg-muted text-muted-foreground",
  Rechazado: "bg-danger-light text-danger-dark",
};

export function Badge({ children, className }: { children: string; className?: string }) {
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", variants[children] ?? "bg-muted text-muted-foreground", className)}>{children}</span>;
}
