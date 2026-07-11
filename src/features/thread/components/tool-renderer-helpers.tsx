import type { LucideIcon } from "lucide-react";
import { Check, Link as LinkIcon, ListTodo } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Renderer } from "@openuidev/react-lang";
import { asterLibrary } from "~/components/ai-elements/library";
import { prettyName } from "~/lib/utils";

export function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function SimpleLine({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Icon className="size-3.5" />
      <span>{label}</span>
    </div>
  );
}

export function FallbackOutput({ output, toolName }: { output: unknown; toolName: string }) {
  const label = prettyName(toolName);
  if (output == null || output === false) {
    return <SimpleLine icon={ListTodo} label={`${label} complete`} />;
  }
  if (typeof output === "string") {
    return <SimpleLine icon={ListTodo} label={output} />;
  }
  return <SimpleLine icon={ListTodo} label={safeStringify(output)} />;
}

export function ArtifactPreview({
  title,
  content,
  label,
  to,
  params,
}: {
  title: string;
  content?: string;
  label: string;
  to?: string;
  params?: Record<string, string>;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs text-success">
        <Check className="size-3.5" />
        <span>{label}</span>
      </div>
      <div className="rounded-lg bg-muted overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
          <span className="text-xs font-medium text-foreground">{title}</span>
          {to && params && (
            <Link
              to={to}
              params={params}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              View
            </Link>
          )}
        </div>
        {content && (
          <div className="max-h-48 overflow-y-auto px-3 py-2">
            <Renderer library={asterLibrary} response={content} isStreaming={false} />
          </div>
        )}
      </div>
    </div>
  );
}

export function CreateThreadOutput({
  workspaceId,
  threadId,
  name,
}: {
  workspaceId: string;
  threadId?: string;
  name?: string;
}) {
  const navigate = useNavigate();
  if (!threadId) return <SimpleLine icon={ListTodo} label="Thread created" />;
  return (
    <button
      type="button"
      onClick={() =>
        navigate({
          to: "/workspaces/$workspaceId/threads/$threadId",
          params: { workspaceId, threadId },
        })
      }
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
    >
      <LinkIcon className="size-3.5 text-primary" />
      <span>Thread "{name || "Untitled"}" ready</span>
    </button>
  );
}
