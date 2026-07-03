import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { Link02Icon, Task01Icon } from "@hugeicons/core-free-icons";
import { useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";

export interface ToolRenderContext {
  workspaceId: string;
}

type ToolOutputRenderer = (output: unknown, ctx: ToolRenderContext) => ReactNode;

const renderers: Record<string, ToolOutputRenderer> = {
  createThread: (output, ctx) => {
    const result = output as { threadId?: string; name?: string } | undefined;
    return <CreateThreadOutput workspaceId={ctx.workspaceId} threadId={result?.threadId} name={result?.name} />;
  },
  updateMission: () => <SimpleLine icon={Task01Icon} label="Mission updated for this workspace" />,
  updateKnowledge: () => <SimpleLine icon={Task01Icon} label="Knowledge level updated" />,
  createLesson: (output) => {
    const result = output as { lessonId?: string; title?: string } | undefined;
    return <SimpleLine icon={Task01Icon} label={`Lesson "${result?.title ?? "Untitled"}" saved`} />;
  },
  createRecord: () => <SimpleLine icon={Task01Icon} label="Learning record saved" />,
  deleteLesson: (output) => {
    const result = output as { deleted?: boolean } | undefined;
    return <SimpleLine icon={Task01Icon} label={result?.deleted === false ? "Lesson not found" : "Lesson deleted"} />;
  },
  deleteRecord: (output) => {
    const result = output as { deleted?: boolean } | undefined;
    return <SimpleLine icon={Task01Icon} label={result?.deleted === false ? "Learning record not found" : "Learning record deleted"} />;
  },
};

export function renderToolOutput(
  toolName: string,
  output: unknown,
  ctx: ToolRenderContext,
): ReactNode {
  const render = renderers[toolName];
  if (render) return render(output, ctx);
  return null;
}

function SimpleLine({ icon, label }: { icon: IconSvgElement; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <HugeiconsIcon icon={icon} className="size-3.5" />
      <span>{label}</span>
    </div>
  );
}

function CreateThreadOutput({
  workspaceId,
  threadId,
  name,
}: {
  workspaceId: string;
  threadId?: string;
  name?: string;
}) {
  const navigate = useNavigate();
  if (!threadId) return <SimpleLine icon={Task01Icon} label="Thread created" />;
  return (
    <button
      type="button"
      onClick={() =>
        navigate({
          to: "/workspaces/$workspaceId/threads/$threadId",
          params: { workspaceId, threadId },
        })
      }
      className="inline-flex items-center gap-1.5 rounded-md border bg-card px-2 py-1 text-xs hover:bg-accent"
    >
      <HugeiconsIcon icon={Link02Icon} className="size-3.5 text-primary" />
      <span>Thread “{name || "Untitled"}” ready</span>
    </button>
  );
}
