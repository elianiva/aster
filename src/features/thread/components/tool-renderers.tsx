import { Task01Icon } from "@hugeicons/core-free-icons";
import type { ReactNode } from "react";
import {
  FallbackOutput,
  SimpleLine,
  ArtifactPreview,
  CreateThreadOutput,
} from "./tool-renderer-helpers";
export type { ToolRenderContext } from "./tool-renderer-types";
import type { ToolRenderContext } from "./tool-renderer-types";
type ToolOutputRenderer = (output: unknown, input: unknown, ctx: ToolRenderContext) => ReactNode;

const renderers: Record<string, ToolOutputRenderer> = {
  createThread: (output, _input, ctx) => {
    const result = output as { threadId?: string; name?: string } | undefined;
    return <CreateThreadOutput workspaceId={ctx.workspaceId} threadId={result?.threadId} name={result?.name} />;
  },
  updateMission: () => <SimpleLine icon={Task01Icon} label="Mission updated for this workspace" />,
  updateKnowledge: () => <SimpleLine icon={Task01Icon} label="Knowledge level updated" />,
  createLesson: (_output, input, ctx) => {
    const result = typeof _output === "string" ? JSON.parse(_output) : _output as Record<string, unknown> | undefined;
    const id = result?.id ?? result?.lessonId;
    const { title, content } = (input ?? {}) as { title?: string; content?: string };
    return (
      <ArtifactPreview
        title={title ?? "Untitled Lesson"}
        content={content}
        label="Lesson saved"
        to={id ? "/workspaces/$workspaceId/lessons/$lessonId" : undefined}
        params={id ? { workspaceId: ctx.workspaceId, lessonId: String(id) } : undefined}
      />
    );
  },
  createRecord: (_output, input, ctx) => {
    const result = typeof _output === "string" ? JSON.parse(_output) : _output as Record<string, unknown> | undefined;
    const id = result?.id ?? result?.recordId;
    const { title, content } = (input ?? {}) as { title?: string; content?: string };
    return (
      <ArtifactPreview
        title={title ?? "Untitled Record"}
        content={content}
        label="Record saved"
        to={id ? "/workspaces/$workspaceId/records/$recordId" : undefined}
        params={id ? { workspaceId: ctx.workspaceId, recordId: String(id) } : undefined}
      />
    );
  },
  createReference: (_output, input, ctx) => {
    const result = typeof _output === "string" ? JSON.parse(_output) : _output as Record<string, unknown> | undefined;
    const id = result?.id ?? result?.referenceId;
    const { title, content } = (input ?? {}) as { title?: string; content?: string };
    return (
      <ArtifactPreview
        title={title ?? "Untitled Reference"}
        content={content}
        label="Reference saved"
        to={id ? "/workspaces/$workspaceId/reference-docs/$referenceId" : undefined}
        params={id ? { workspaceId: ctx.workspaceId, referenceId: String(id) } : undefined}
      />
    );
  },
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
  input: unknown,
  ctx: ToolRenderContext,
): ReactNode {
  const render = renderers[toolName];
  if (render) return render(output, input, ctx);
  return <FallbackOutput output={output} toolName={toolName} />;
}
