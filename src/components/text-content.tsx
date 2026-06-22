import type { ComponentProps } from "react";
import { Streamdown } from "streamdown";
import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import { cn } from "~/lib/utils";

const plugins = { cjk, code, math, mermaid };

export interface TextContentProps extends ComponentProps<"div"> {
  content: string;
  variant?: "default" | "large-heavy" | "large" | "heavy" | "muted";
}

const styleClasses: Record<string, string> = {
  default: "prose prose-sm dark:prose-invert",
  "large-heavy": "prose prose-base dark:prose-invert font-bold",
  large: "prose prose-base dark:prose-invert",
  heavy: "prose prose-sm dark:prose-invert font-medium",
  muted: "prose prose-sm dark:prose-invert text-muted-foreground",
};

export function TextContent({
  content,
  variant = "default",
  className,
  ...props
}: TextContentProps) {
  return (
    <div className={cn("w-full", className)} {...props}>
      <Streamdown className={cn("min-w-full!", styleClasses[variant])} plugins={plugins}>
        {content}
      </Streamdown>
    </div>
  );
}
