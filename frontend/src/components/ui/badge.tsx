import * as React from "react";

import { cn } from "../../lib/utils";

export type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

const variants: Record<BadgeVariant, string> = {
  default:
    "border-transparent bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900",
  secondary:
    "border-transparent bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50",
  destructive: "border-transparent bg-red-600 text-white",
  outline: "text-slate-950 dark:text-slate-50",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: BadgeVariant }) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        "transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
        "dark:focus:ring-slate-400 dark:focus:ring-offset-slate-950",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

