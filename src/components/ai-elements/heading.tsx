import type { ComponentProps } from "react";
import { cn } from "~/lib/utils";

export interface HeadingProps extends ComponentProps<"h1" | "h2" | "h3" | "h4" | "h5" | "h6"> {
  text: string;
  level: "1" | "2" | "3" | "4" | "5" | "6";
}

const sizeClasses = {
  1: "text-2xl font-semibold tracking-tight",
  2: "text-xl font-semibold tracking-tight",
  3: "text-lg font-semibold",
  4: "text-base font-medium",
  5: "text-sm font-medium",
  6: "text-xs font-medium",
};

export function Heading({ text, level, className, ...props }: HeadingProps) {
  const Tag = `h${level || "1"}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  return (
    <Tag className={cn(sizeClasses[level || "1"], className)} {...props}>
      {text}
    </Tag>
  );
}
