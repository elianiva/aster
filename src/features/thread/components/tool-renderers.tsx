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
function makeCreateArtifactRenderer(
  defaultTitle: string,
  label: string,
  routeBase: string,
  idField: string,
): Record<string, ToolOutputRenderer> {
  const name = `create${defaultTitle}`;
  return {
    [name]: (_output, input, ctx) => {
      let result: Record<string, unknown> | undefined;
      if (_output && typeof _output === "object") {
        result = _output as Record<string, unknown>;
      } else if (typeof _output === "string") {
        try {
          const parsed = JSON.parse(_output);
          if (parsed && typeof parsed === "object") result = parsed;
        } catch {
          result = undefined;
        }
      }
      const id = result?.id ?? result?.[idField];
      const { title, content } = (input ?? {}) as { title?: string; content?: string };
      return (
        <ArtifactPreview
          title={title ?? `Untitled ${defaultTitle}`}
          content={content}
          label={label}
          to={id ? `${routeBase}/$${idField}` : undefined}
          params={id ? { workspaceId: ctx.workspaceId, [idField]: String(id) } : undefined}
        />
      );
    },
  };
}

function makeDeleteArtifactRenderer(
  toolName: string,
  deletedLabel: string,
  notFoundLabel: string,
): Record<string, ToolOutputRenderer> {
  return {
    [toolName]: (output) => {
      const result = output as { deleted?: boolean } | undefined;
      return (
        <SimpleLine
          icon={Task01Icon}
          label={result?.deleted === false ? notFoundLabel : deletedLabel}
        />
      );
    },
  };
}

const renderers: Record<string, ToolOutputRenderer> = {
  createThread: (output, _input, ctx) => {
    const result = output as { threadId?: string; name?: string } | undefined;
    return <CreateThreadOutput workspaceId={ctx.workspaceId} threadId={result?.threadId} name={result?.name} />;
  },
  updateMission: () => <SimpleLine icon={Task01Icon} label="Mission updated for this workspace" />,
  updateKnowledge: () => <SimpleLine icon={Task01Icon} label="Knowledge level updated" />,
  ...makeCreateArtifactRenderer("Lesson", "Lesson saved", "/workspaces/$workspaceId/lessons", "lessonId"),
  ...makeCreateArtifactRenderer("Record", "Record saved", "/workspaces/$workspaceId/records", "recordId"),
  ...makeCreateArtifactRenderer("Reference", "Reference saved", "/workspaces/$workspaceId/reference-docs", "referenceId"),
  ...makeDeleteArtifactRenderer("deleteLesson", "Lesson deleted", "Lesson not found"),
  ...makeDeleteArtifactRenderer("deleteRecord", "Learning record deleted", "Learning record not found"),
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
