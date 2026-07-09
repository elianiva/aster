import type { ComponentProps, ReactNode } from "react";
import { cn } from "~/lib/utils";

export interface SectionProps extends ComponentProps<"div"> {
  title?: string;
  children: ReactNode;
}

export function Section({ title, children, className, ...props }: SectionProps) {
  return (
    <div className={cn("rounded-lg bg-secondary/70 p-4 space-y-3", className)} {...props}>
      {title && <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>}
      {children}
    </div>
  );
}
