import { cn, prettyName } from "~/lib/utils";
import type { DynamicToolUIPart, ToolUIPart } from "ai";
import { Check, ChevronDown, Loader2, TriangleAlert, X } from "lucide-react";
import type { ReactNode } from "react";
import { isValidElement } from "react";
import { safeStringify } from "./tool-renderer-helpers";

export type ToolProps = React.ComponentProps<"div">;

export const Tool = ({ className, children, ...props }: ToolProps) => (
  <div data-slot="tool" className={cn("text-sm", className)} {...props}>
    {children}
  </div>
);

export type ToolHeaderProps = {
  type: ToolUIPart["type"] | DynamicToolUIPart["type"];
  state: ToolUIPart["state"] | DynamicToolUIPart["state"];
  toolName?: string;
  title?: string;
  isExpanded?: boolean;
  onToggle?: () => void;
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
      return <Loader2 className="size-3 animate-spin" />;
    case "approval-requested":
      return <TriangleAlert className="size-3 text-warning" />;
    case "output-available":
      return <Check className="size-3 text-success" />;
    case "output-error":
    case "output-denied":
      return <X className="size-3 text-destructive" />;
    default:
      return <Loader2 className="size-3" />;
  }
}

export const ToolHeader = ({ type, state, toolName, title, isExpanded, onToggle, className }: ToolHeaderProps) => {
  const label = title ?? toolLabel(type, toolName);
  return (
    <button
      data-slot="tool-header"
      onClick={onToggle}
      className={cn(
        "inline-flex items-center gap-1 bg-muted/50 px-1.5 py-0.5 rounded-md transition-colors hover:bg-muted",
        "[&>svg:last-child]:transition-transform [&>svg:last-child]:duration-200",
        isExpanded && "[&>svg:last-child]:rotate-180 ring-1 ring-ring",
        "text-xs cursor-pointer",
        className,
      )}
    >
      <StateIcon state={state} />
      <span className="text-muted-foreground truncate">{label}</span>
      <ChevronDown className="size-3 text-muted-foreground/50 transition-transform" />
    </button>
  );
};

export type ToolContentProps = React.ComponentProps<"div"> & {
  isExpanded?: boolean;
};

export const ToolContent = ({ isExpanded, className, children, ...props }: ToolContentProps) => {
  if (!isExpanded) return null;
  return (
    <div
      data-slot="tool-content"
      className={cn("mt-1 rounded-md bg-muted/30 px-2 py-1.5 text-xs text-muted-foreground", className)}
      {...props}
    >
      {children}
    </div>
  );
};

export type ToolInputProps = React.ComponentProps<"div"> & {
  input: ToolUIPart["input"];
};

export const ToolInput = ({ input, className, ...props }: ToolInputProps) => {
  if (!input || Object.keys(input).length === 0) return null;
  return (
    <div data-slot="tool-input" className={cn("mb-1", className)} {...props}>
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

  const text = typeof value === "string" ? value : safeStringify(value);
  return (
    <pre className="max-h-60 overflow-auto rounded-md bg-muted/50 p-2 text-xs leading-relaxed text-muted-foreground">
      <code>{text}</code>
    </pre>
  );
}

export type ToolPart = ToolUIPart | DynamicToolUIPart;
