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
}

export function TextContent({ content, className, ...props }: TextContentProps) {
  return (
    <div className={cn("w-full", className)} {...props}>
      <Streamdown className="min-w-full! prose prose-sm dark:prose-invert" plugins={plugins}>
        {content}
      </Streamdown>
    </div>
  );
}
