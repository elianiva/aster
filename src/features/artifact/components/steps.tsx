import type { ComponentProps } from "react";
import { Streamdown } from "streamdown";
import { cn } from "~/lib/utils";
import { streamdownPlugins } from "~/lib/streamdown-plugins";

export interface StepsProps extends ComponentProps<"ol"> {
  items: string[];
}

export function Steps({ items, className, ...props }: StepsProps) {
  return (
    <ol className={cn("space-y-4", className)} {...props}>
      {items.map((item, i) => (
        <li key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              {i + 1}
            </div>
            {i < items.length - 1 && (
              <div className="w-px flex-1 bg-border mt-2" />
            )}
          </div>
          <div className="flex-1 pb-4 pt-0.5 text-sm">
            <Streamdown className="prose prose-sm dark:prose-invert" plugins={streamdownPlugins}>
              {item}
            </Streamdown>
          </div>
        </li>
      ))}
    </ol>
  );
}
