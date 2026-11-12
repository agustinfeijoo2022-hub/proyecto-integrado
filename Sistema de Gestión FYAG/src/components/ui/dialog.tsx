import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export function DialogContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm" />
    <DialogPrimitive.Content className={cn("fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%_-_2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl", className)}>
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:bg-muted" aria-label="Cerrar"><X className="size-5" /></DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>;
}
export const DialogTitle = ({ children }: { children: React.ReactNode }) => <DialogPrimitive.Title className="text-lg font-bold text-foreground">{children}</DialogPrimitive.Title>;
export const DialogDescription = ({ children }: { children: React.ReactNode }) => <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">{children}</DialogPrimitive.Description>;
