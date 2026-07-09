"use client";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import { cn, prettyName } from "~/lib/utils";
import type { DynamicToolUIPart, ToolUIPart } from "ai";
import {
  CheckIcon,
  ChevronDownIcon,
  LoaderPinwheelIcon,
  TriangleIcon,
  XVariableIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ReactNode } from "react";
import { isValidElement } from "react";

export type ToolProps = Omit<React.ComponentProps<typeof Collapsible>, "open" | "defaultOpen" | "onOpenChange"> & {
  defaultOpen?: boolean;
};

export const Tool = ({ className, defaultOpen, children, ...props }: ToolProps) => (
  <Collapsible
    data-slot="tool"
    className={cn("w-full rounded-lg bg-muted/30 text-sm", className)}
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

function StateIcon({ state }: { state: string }) {
  switch (state) {
    case "input-streaming":
      return <HugeiconsIcon icon={LoaderPinwheelIcon} className="size-3.5 animate-spin" />;
    case "approval-requested":
      return <HugeiconsIcon icon={TriangleIcon} className="size-3.5 text-warning" />;
    case "output-available":
      return <HugeiconsIcon icon={CheckIcon} className="size-3.5 text-success" />;
    case "output-error":
    case "output-denied":
      return <HugeiconsIcon icon={XVariableIcon} className="size-3.5 text-destructive" />;
    default:
      return <HugeiconsIcon icon={LoaderPinwheelIcon} className="size-3.5" />;
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
      <span className="flex-1 truncate text-muted-foreground">{label}</span>
      <HugeiconsIcon icon={ChevronDownIcon} className="size-3.5 text-muted-foreground/50 transition-transform" />
    </CollapsibleTrigger>
  );
};

export type ToolContentProps = React.ComponentProps<typeof CollapsibleContent>;

export const ToolContent = ({ className, children, ...props }: ToolContentProps) => (
  <CollapsibleContent
    data-slot="tool-content"
    className={cn("px-3 pb-3 pt-0 text-muted-foreground", className)}
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
        <p className="text-xs">{errorText}</p>
      </div>
    );
  }
  if (output == null || output === false) return null;
  return (
    <div data-slot="tool-output" className={cn(className)} {...props}>
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

function tryParse(value: unknown): Record<string, unknown> | unknown[] | null {
  if (typeof value === "object" && value !== null) return value as Record<string, unknown> | unknown[];
  if (typeof value !== "string") return null;
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === "object" && parsed !== null) return parsed as Record<string, unknown> | unknown[];
    return null;
  } catch {
    return null;
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function flattenEntries(obj: Record<string, unknown>, prefix = ""): [string, unknown][] {
  const out: [string, unknown][] = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (isRecord(v)) {
      out.push(...flattenEntries(v, key));
    } else {
      out.push([key, v]);
    }
  }
  return out;
}

function formatValue(val: unknown): string {
  if (val === null) return "null";
  if (val === undefined) return "—";
  if (typeof val === "string") return val;
  if (typeof val === "boolean" || typeof val === "number") return String(val);
  if (Array.isArray(val)) return val.join(", ");
  try {
    return JSON.stringify(val);
  } catch {
    return String(val);
  }
}

function KvBlock({ entries }: { entries: [string, unknown][] }) {
  return (
    <div className="max-h-60 overflow-auto rounded-md bg-muted/50 px-2.5 py-2 text-xs leading-relaxed">
      <dl className="grid gap-y-0.5" style={{ gridTemplateColumns: "auto 1fr" }}>
        {entries.map(([key, val]) => (
          <div key={key} className="contents">
            <dt className="pr-3 text-muted-foreground whitespace-nowrap">{key}</dt>
            <dd className="min-w-0 text-foreground truncate" title={formatValue(val)}>
              {formatValue(val)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function JsonBlock({ value }: { value: unknown }) {
  const parsed = tryParse(value);

  if (isRecord(parsed)) {
    const entries = flattenEntries(parsed);
    if (entries.length > 0) return <KvBlock entries={entries} />;
  }
  if (Array.isArray(parsed) && parsed.length > 0) {
    return <KvBlock entries={parsed.map((v, i) => [String(i + 1), v] as [string, unknown])} />;
  }

  let text: string;
  try {
    text = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  } catch {
    text = String(value);
  }
  return (
    <pre className="max-h-60 overflow-auto rounded-md bg-muted/50 p-2 text-xs leading-relaxed text-muted-foreground">
      <code>{text}</code>
    </pre>
  );
}

export type ToolPart = ToolUIPart | DynamicToolUIPart;
