import type { ComponentProps } from "react";
import { cn } from "~/lib/utils";

export interface StatCardProps extends ComponentProps<"div"> {
  label: string;
  value: string;
  subtitle?: string;
}

export function StatCard({ label, value, subtitle, className, ...props }: StatCardProps) {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-4", className)} {...props}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-lg mt-1 font-semibold">{value}</p>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
