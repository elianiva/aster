import type { ComponentProps } from "react";
import { Streamdown } from "streamdown";
import { cn } from "~/lib/utils";
import { streamdownPlugins } from "~/lib/streamdown-plugins";

export interface DefinitionProps extends ComponentProps<"div"> {
  term: string;
  definition: string;
}

export function Definition({ term, definition, className, ...props }: DefinitionProps) {
  return (
    <div
      className={cn(
        "rounded-lg border-l-2 border-primary/50 pl-4 py-2 space-y-1",
        className,
      )}
      {...props}
    >
      <dt className="text-sm font-semibold text-foreground">{term}</dt>
      <dd className="text-sm text-muted-foreground">
        <Streamdown className="prose prose-sm dark:prose-invert" plugins={streamdownPlugins}>
          {definition}
        </Streamdown>
      </dd>
    </div>
  );
}
