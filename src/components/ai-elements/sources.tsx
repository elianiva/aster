"use client";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import { cn } from "~/lib/utils";
import { BookIcon, ChevronDownIcon } from "lucide-react";

export type SourcesProps = React.ComponentProps<typeof Collapsible>;

export const Sources = ({ className, children, ...props }: SourcesProps) => (
  <Collapsible
    data-slot="sources"
    className={cn("w-full text-sm", className)}
    defaultOpen={false}
    {...props}
  >
    {children}
  </Collapsible>
);

export type SourcesTriggerProps = React.ComponentProps<typeof CollapsibleTrigger> & {
  count: number;
};

export const SourcesTrigger = ({ count, className, children, ...props }: SourcesTriggerProps) => (
  <CollapsibleTrigger
    data-slot="sources-trigger"
    className={cn(
      "inline-flex items-center gap-1.5 rounded-md border bg-card px-2 py-1 text-xs text-muted-foreground hover:bg-accent",
      "[&[aria-expanded=true]>svg:last-child]:rotate-180",
      className,
    )}
    {...props}
  >
    <BookIcon className="size-3.5" />
    <span>{children ?? `${count} source${count === 1 ? "" : "s"}`}</span>
    <ChevronDownIcon className="size-3.5 transition-transform" />
  </CollapsibleTrigger>
);

export type SourcesContentProps = React.ComponentProps<typeof CollapsibleContent>;

export const SourcesContent = ({ className, children, ...props }: SourcesContentProps) => (
  <CollapsibleContent
    data-slot="sources-content"
    className={cn("mt-1 flex flex-col gap-1", className)}
    {...props}
  >
    {children}
  </CollapsibleContent>
);

export type SourceProps = React.AnchorHTMLAttributes<HTMLAnchorElement>;

export const Source = ({ className, children, href, ...props }: SourceProps) => (
  <a
    data-slot="source"
    href={href}
    target="_blank"
    rel="noreferrer noopener"
    className={cn(
      "inline-flex items-center gap-1.5 rounded-md border bg-card px-2 py-1 text-xs hover:bg-accent",
      className,
    )}
    {...props}
  >
    <BookIcon className="size-3 shrink-0 text-muted-foreground" />
    <span className="truncate">{children ?? href}</span>
  </a>
);
