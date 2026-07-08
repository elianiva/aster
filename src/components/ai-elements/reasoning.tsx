"use client";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import { Spinner } from "~/components/ui/spinner";
import { cn } from "~/lib/utils";
import { streamdownPlugins } from "~/lib/streamdown-plugins";
import { BrainIcon, ChevronDownIcon } from "lucide-react";
import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Streamdown } from "streamdown";

interface ReasoningContextValue {
  isStreaming: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  duration: number | undefined;
}

const ReasoningContext = createContext<ReasoningContextValue | null>(null);

function useReasoning() {
  const ctx = useContext(ReasoningContext);
  if (!ctx) throw new Error("Reasoning components must be used within <Reasoning>");
  return ctx;
}

export type ReasoningProps = Omit<
  React.ComponentProps<typeof Collapsible>,
  "open" | "defaultOpen" | "onOpenChange"
> & {
  isStreaming?: boolean;
  duration?: number;
};

export const Reasoning = ({
  isStreaming = false,
  duration,
  defaultOpen,
  open,
  onOpenChange,
  className,
  children,
  ...props
}: ReasoningProps & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen ?? true);
  const isOpen = open ?? internalOpen;
  const setIsOpen = (next: boolean) => {
    setInternalOpen(next);
    onOpenChange?.(next);
  };

  useEffect(() => {
    if (isStreaming) setInternalOpen(true);
  }, [isStreaming]);

  const value = useMemo<ReasoningContextValue>(
    () => ({ isStreaming, isOpen, setIsOpen, duration }),
    [isStreaming, isOpen, duration],
  );

  return (
    <ReasoningContext.Provider value={value}>
      <Collapsible
        data-slot="reasoning"
        className={cn("w-full text-sm", className)}
        open={isOpen}
        onOpenChange={setIsOpen}
        {...props}
      >
        {children}
      </Collapsible>
    </ReasoningContext.Provider>
  );
};

export type ReasoningTriggerProps = React.ComponentProps<typeof CollapsibleTrigger> & {
  getThinkingMessage?: (isStreaming: boolean, duration?: number) => ReactNode;
};

export const ReasoningTrigger = ({
  className,
  getThinkingMessage,
  children,
  ...props
}: ReasoningTriggerProps) => {
  const { isStreaming, isOpen, setIsOpen, duration } = useReasoning();

  const label =
    children ??
    (getThinkingMessage
      ? getThinkingMessage(isStreaming, duration)
      : isStreaming
        ? "Thinking…"
        : duration != null
          ? `Thought for ${duration}s`
          : "Thought process");

  return (
    <CollapsibleTrigger
      data-slot="reasoning-trigger"
      className={cn("flex w-full items-center gap-2 text-muted-foreground", className)}
      onClick={() => setIsOpen(!isOpen)}
      {...props}
    >
      {isStreaming ? <Spinner className="size-3.5" /> : <BrainIcon className="size-3.5" />}
      <span className="flex-1 text-left">{label}</span>
      <ChevronDownIcon
        className={cn("size-4 transition-transform", isOpen ? "rotate-180" : "rotate-0")}
      />
    </CollapsibleTrigger>
  );
};

export type ReasoningContentProps = Omit<
  React.ComponentProps<typeof CollapsibleContent>,
  "children"
> & {
  children: string;
};

export const ReasoningContent = ({ className, children, ...props }: ReasoningContentProps) => (
  <CollapsibleContent
    data-slot="reasoning-content"
    className={cn("px-3 pb-3 text-muted-foreground", className)}
    {...props}
  >
    <Streamdown className={cn("prose-sm leading-tight mt-3", className)} plugins={streamdownPlugins}>
      {children}
    </Streamdown>
  </CollapsibleContent>
);

export { useReasoning };
