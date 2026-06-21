"use client";

import { Badge } from "~/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import { cn } from "~/lib/utils";
import { getToolPartState } from "@cloudflare/ai-chat/react";
import type { DynamicToolUIPart, ToolUIPart } from "ai";
import {
  CheckIcon,
  ChevronDownIcon,
  Loader2Icon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { isValidElement } from "react";

export type ToolProps = Omit<React.ComponentProps<typeof Collapsible>, "open" | "defaultOpen" | "onOpenChange"> & {
  defaultOpen?: boolean;
};

export const Tool = ({ className, defaultOpen, children, ...props }: ToolProps) => (
  <Collapsible
    data-slot="tool"
    className={cn("w-full rounded-lg border text-sm", className)}
    defaultOpen={defaultOpen}
    {...props}
  >
    {children}
  </Collapsible>
);

export type ToolHeaderProps = {
  type: ToolUIPart["type"] | DynamicToolUIPart["type"];
  state: ToolUIPart["state"] | DynamicToolUIPart["state"];
  toolName?: string;
  title?: string;
  className?: string;
};

const toolLabel = (type: string, toolName?: string): string => {
  if (type === "dynamic-tool" && toolName) return prettyName(toolName);
  if (type.startsWith("tool-")) return prettyName(type.slice(5));
  return prettyName(type);
};

const prettyName = (s: string) =>
  s.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

function StateIcon({ state }: { state: string }) {
  switch (state) {
    case "input-streaming":
    case "input-available":
      return <Loader2Icon className="size-3.5 animate-spin" />;
    case "approval-requested":
      return <TriangleAlertIcon className="size-3.5 text-amber-500" />;
    case "output-available":
      return <CheckIcon className="size-3.5 text-emerald-500" />;
    case "output-error":
    case "output-denied":
      return <XIcon className="size-3.5 text-destructive" />;
    default:
      return <Loader2Icon className="size-3.5" />;
  }
}

function stateLabel(state: string): string {
  switch (state) {
    case "input-streaming":
      return "Pending";
    case "input-available":
      return "Running";
    case "approval-requested":
      return "Awaiting approval";
    case "approval-responded":
      return "Responded";
    case "output-available":
      return "Completed";
    case "output-error":
      return "Error";
    case "output-denied":
      return "Denied";
    default:
      return state;
  }
}

export const ToolHeader = ({ type, state, toolName, title, className }: ToolHeaderProps) => {
  const label = title ?? toolLabel(type, toolName);
  return (
    <CollapsibleTrigger
      data-slot="tool-header"
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2",
        "[&[aria-expanded=true]>svg:last-child]:rotate-180",
        className,
      )}
    >
      <StateIcon state={state} />
      <span className="flex-1 truncate font-medium text-foreground">{label}</span>
      <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
        {stateLabel(state)}
      </Badge>
      <ChevronDownIcon className="size-4 text-muted-foreground transition-transform" />
    </CollapsibleTrigger>
  );
};

export type ToolContentProps = React.ComponentProps<typeof CollapsibleContent>;

export const ToolContent = ({ className, children, ...props }: ToolContentProps) => (
  <CollapsibleContent
    data-slot="tool-content"
    className={cn("border-t px-3 py-2 text-muted-foreground", className)}
    {...props}
  >
    {children}
  </CollapsibleContent>
);

export type ToolInputProps = React.ComponentProps<"div"> & {
  input: ToolUIPart["input"];
};

export const ToolInput = ({ input, className, ...props }: ToolInputProps) => {
  if (!input || Object.keys(input).length === 0) return null;
  return (
    <div data-slot="tool-input" className={cn("mb-2", className)} {...props}>
      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Input
      </div>
      <JsonBlock value={input} />
    </div>
  );
};

export type ToolOutputProps = React.ComponentProps<"div"> & {
  output: ReactNode;
  errorText?: string;
};

export const ToolOutput = ({ output, errorText, className, ...props }: ToolOutputProps) => {
  if (errorText) {
    return (
      <div data-slot="tool-output" className={cn("text-destructive", className)} {...props}>
        <div className="mb-1 text-xs font-medium uppercase tracking-wide">Error</div>
        <p>{errorText}</p>
      </div>
    );
  }
  if (output == null || output === false) return null;
  return (
    <div data-slot="tool-output" className={cn(className)} {...props}>
      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Output
      </div>
      {isValidElement(output) ? (
        output
      ) : typeof output === "string" ? (
        <JsonBlock value={output} />
      ) : (
        <JsonBlock value={output as unknown} />
      )}
    </div>
  );
};

function JsonBlock({ value }: { value: unknown }) {
  let text: string;
  try {
    text = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  } catch {
    text = String(value);
  }
  return (
    <pre className="max-h-60 overflow-auto rounded-md bg-muted/50 p-2 text-xs leading-relaxed">
      <code>{text}</code>
    </pre>
  );
}

export { getToolPartState };
export type ToolPart = ToolUIPart | DynamicToolUIPart;
