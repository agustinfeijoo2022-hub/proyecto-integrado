import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn("h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-info focus:ring-2 focus:ring-info/10", className)} {...props} />
));
Input.displayName = "Input";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...props }, ref) => (
  <select ref={ref} className={cn("h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-info focus:ring-2 focus:ring-info/10", className)} {...props}>{children}</select>
));
Select.displayName = "Select";

export function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={cn("grid gap-1.5 text-sm font-medium text-foreground", className)}><span>{label}</span>{children}</label>;
}
