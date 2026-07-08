import type { ComponentProps, ReactNode } from "react";
import { Streamdown } from "streamdown";
import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { cn } from "~/lib/utils";

const plugins = { cjk, code };

export type CalloutVariant = "info" | "warning" | "tip" | "key";

export interface CalloutProps extends ComponentProps<"div"> {
  variant?: CalloutVariant;
  title?: string;
  children: ReactNode;
}

const variantStyles: Record<CalloutVariant, { border: string; bg: string; badge: string; label: string }> = {
  info: {
    border: "border-l-primary",
    bg: "bg-primary/5",
    badge: "bg-primary/10 text-primary",
    label: "Info",
  },
  warning: {
    border: "border-l-warning",
    bg: "bg-warning/5",
    badge: "bg-warning/10 text-warning",
    label: "Warning",
  },
  tip: {
    border: "border-l-success",
    bg: "bg-success/5",
    badge: "bg-success/10 text-success",
    label: "Tip",
  },
  key: {
    border: "border-l-purple-500",
    bg: "bg-purple-500/5",
    badge: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
    label: "Key",
  },
};

export function Callout({ variant = "info", title, children, className, ...props }: CalloutProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "rounded-r-lg border-l-4 p-4",
        styles.border,
        styles.bg,
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", styles.badge)}>
          {title ?? styles.label}
        </span>
      </div>
      <div className="text-sm">
        {typeof children === "string" ? (
          <Streamdown className="prose prose-sm dark:prose-invert" plugins={plugins}>
            {children}
          </Streamdown>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
