import * as React from "react";
import { cn } from "@/lib/utils";

type Variant =
  | "default"
  | "green"
  | "amber"
  | "red"
  | "gray"
  | "blue"
  | "indigo";

const styles: Record<Variant, string> = {
  default: "bg-gray-100 text-gray-700",
  green: "bg-emerald-100 text-emerald-800",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-800",
  gray: "bg-slate-100 text-slate-600",
  blue: "bg-brand-50 text-brand-700",
  indigo: "bg-indigo-100 text-indigo-800",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}
