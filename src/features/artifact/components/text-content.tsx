import type { ComponentProps } from "react";
import { Streamdown } from "streamdown";
import { cn } from "~/lib/utils";
import { streamdownPlugins } from "~/lib/streamdown-plugins";

export interface TextContentProps extends ComponentProps<"div"> {
  content: string;
}

export function TextContent({ content, className, ...props }: TextContentProps) {
  return (
    <div className={cn("w-full", className)} {...props}>
      <Streamdown className={cn("min-w-full! prose prose-sm dark:prose-invert")} plugins={streamdownPlugins}>
        {content}
      </Streamdown>
    </div>
  );
}
