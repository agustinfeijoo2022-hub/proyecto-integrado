import type { HTMLAttributes, TableHTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const TableWrap = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => <div className={cn("overflow-x-auto", className)} {...props} />;
export const Table = ({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) => <table className={cn("w-full text-left text-sm", className)} {...props} />;
export const THead = (props: HTMLAttributes<HTMLTableSectionElement>) => <thead className="border-b border-border bg-surface text-xs uppercase tracking-wide text-muted-foreground" {...props} />;
export const TBody = (props: HTMLAttributes<HTMLTableSectionElement>) => <tbody className="divide-y divide-border" {...props} />;
export const TR = ({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) => <tr className={cn("transition-colors hover:bg-surface", className)} {...props} />;
export const TH = ({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) => <th className={cn("px-5 py-3 font-semibold", className)} {...props} />;
export const TD = ({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) => <td className={cn("px-5 py-4", className)} {...props} />;
