import type { ComponentProps } from "react";

export interface StatCardProps extends ComponentProps<"div"> {
  label: string;
  value: string;
  subtitle?: string;
}

export function StatCard({ label, value, subtitle, className, ...props }: StatCardProps) {
  return (
    <div className={`rounded-lg border bg-card p-4 ${className ?? ""}`} {...props}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
