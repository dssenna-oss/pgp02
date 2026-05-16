import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "primary" | "success" | "warning" | "destructive" | "ghost";

const styles: Record<Variant, string> = {
  default: "bg-gray-100 text-gray-700",
  primary: "bg-brand-50 text-brand-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  destructive: "bg-red-50 text-red-700",
  ghost: "bg-transparent text-gray-500 border border-gray-200",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium",
        styles[variant],
        className
      )}
      {...props}
    />
  );
}
