import type { ComponentProps } from "react";
import { Streamdown } from "streamdown";
import { cn } from "~/lib/utils";
import { streamdownPlugins } from "~/lib/streamdown-plugins";

export interface StepsProps extends ComponentProps<"ol"> {
  items: string[];
}

export function Steps({ items, className, ...props }: StepsProps) {
  return (
    <ol className={cn("space-y-2", className)} {...props}>
      {items.map((item, i) => (
        <li key={i} className="flex items-center gap-2">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
            {i + 1}
          </div>
          <Streamdown
            className="flex-1 text-sm prose prose-sm max-w-full"
            plugins={streamdownPlugins}
          >
            {item}
          </Streamdown>
        </li>
      ))}
    </ol>
  );
}
