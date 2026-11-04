import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Card = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => <div className={cn("rounded-xl border border-border bg-white shadow-card", className)} {...props} />;
export const CardHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => <div className={cn("flex items-center justify-between gap-4 p-5 pb-3", className)} {...props} />;
export const CardContent = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => <div className={cn("p-5 pt-2", className)} {...props} />;
