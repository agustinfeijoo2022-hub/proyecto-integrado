import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const PageTitle = ({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) => <h1 className={cn("text-2xl font-bold tracking-tight text-foreground", className)} {...props} />;
export const SectionTitle = ({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) => <h2 className={cn("text-base font-bold text-foreground", className)} {...props} />;
export const Muted = ({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) => <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
