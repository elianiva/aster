import {
  getToolName,
  isToolUIPart,
  type DynamicToolUIPart,
  type FileUIPart,
  type ToolUIPart,
  type UIMessage,
} from "ai";
import { Renderer } from "@openuidev/react-lang";
import { asterLibrary } from "~/features/artifact/components/library";
import {
  Confirmation,
  ConfirmationAccepted,
  ConfirmationAction,
  ConfirmationActions,
  ConfirmationRejected,
  ConfirmationRequest,
} from "./confirmation";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "./reasoning";
import { Source, Sources, SourcesContent, SourcesTrigger } from "./sources";
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from "./tool";
import { renderToolOutput } from "./tool-renderers";
import type { ToolRenderContext } from "./tool-renderer-types";
const SKIP_INPUT = new Set(["createLesson", "createRecord", "createReference"]);

interface MessagePartsProps {
  message: UIMessage;
  isLast: boolean;
  isStreaming: boolean;
  ctx: { workspaceId: string };
  onApprove: (id: string, approved: boolean) => void;
}

function TextPart({
  text,
  role,
  isStreaming,
  messageId,
  index,
}: {
  text: string;
  role: string;
  isStreaming: boolean;
  messageId: string;
  index: number;
}) {
  if (text.length === 0) return null;

  if (role === "user") {
    return (
      <div key={`${messageId}-txt-${index}`} className="whitespace-pre-wrap">
        {text}
      </div>
    );
  }

  return (
    <Renderer
      key={`${messageId}-txt-${index}`}
      library={asterLibrary}
      response={text}
      isStreaming={isStreaming}
      onError={() => { }}
    />
  );
}

function FilePart({
  file,
  messageId,
  index,
}: {
  file: FileUIPart;
  messageId: string;
  index: number;
}) {
  return (
    <a
      key={`${messageId}-file-${index}`}
      href={file.url}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex items-center gap-1.5 rounded-md border bg-card px-2 py-1 text-xs hover:bg-accent"
    >
      {file.filename ?? "Attachment"}
    </a>
  );
}

function ToolOutputRenderer({
  toolName,
  output,
  input,
  ctx,
}: {
  toolName: string;
  output: unknown;
  input: unknown;
  ctx: ToolRenderContext;
}) {
  return <>{renderToolOutput(toolName, output, input, ctx)}</>;
}

function ToolPart({
  part,
  messageId,
  index,
  ctx,
  onApprove,
}: {
  part: ToolUIPart | DynamicToolUIPart;
  messageId: string;
  index: number;
  ctx: { workspaceId: string };
  onApprove: (id: string, approved: boolean) => void;
}) {
  const toolName = getToolName(part);

  const approval = "approval" in part ? part.approval : undefined;

  return (
    <Tool key={`${messageId}-tool-${index}`} defaultOpen className="mb-2">
      <ToolHeader type={part.type} state={part.state} toolName={toolName} />
      <ToolContent>
        {toolName && !SKIP_INPUT.has(toolName) && <ToolInput input={part.input} />}
        <ToolOutput
          output={
            <ToolOutputRenderer
              toolName={toolName ?? ""}
              output={part.output}
              input={part.input}
              ctx={ctx}
            />
          }
          errorText={part.errorText}
        />
        {approval && part.state === "approval-requested" && (
          <Confirmation approval={approval} state={part.state} className="mt-2">
            <ConfirmationRequest>
              The teacher wants to run <strong>{toolName}</strong>. Approve?
            </ConfirmationRequest>
            <ConfirmationActions>
              <ConfirmationAction variant="outline" onClick={() => onApprove(approval.id, false)}>
                Reject
              </ConfirmationAction>
              <ConfirmationAction onClick={() => onApprove(approval.id, true)}>
                Approve
              </ConfirmationAction>
            </ConfirmationActions>
          </Confirmation>
        )}
        {approval && part.state !== "approval-requested" && (
          <Confirmation approval={approval} state={part.state} className="mt-2">
            <ConfirmationAccepted>You approved this action</ConfirmationAccepted>
            <ConfirmationRejected>You rejected this action</ConfirmationRejected>
          </Confirmation>
        )}
      </ToolContent>
    </Tool>
  );
}

type PartEntry =
  | { kind: "reasoning"; blocks: { text: string }[]; isLastReasoning: boolean }
  | { kind: "source"; sources: { url?: string; title?: string }[] }
  | { kind: "content"; part: UIMessage["parts"][number]; partIndex: number };

function buildInterleavedParts(message: UIMessage): PartEntry[] {
  const entries: PartEntry[] = [];
  let reasoningBuf: { text: string }[] = [];
  let lastReasoningEntryIdx = -1;
  const sourceBuf: { url?: string; title?: string }[] = [];

  function flushReasoning() {
    if (reasoningBuf.length === 0) return;
    lastReasoningEntryIdx = entries.length;
    entries.push({ kind: "reasoning", blocks: [...reasoningBuf], isLastReasoning: false });
    reasoningBuf = [];
  }

  for (let i = 0; i < message.parts.length; i++) {
    const part = message.parts[i];
    if (part.type === "reasoning") {
      reasoningBuf.push({ text: part.text });
    } else if (part.type === "source-url" || part.type === "source-document") {
      flushReasoning();
      sourceBuf.push({ url: "url" in part ? part.url : undefined, title: part.title });
    } else {
      flushReasoning();
      if (sourceBuf.length > 0) {
        entries.push({ kind: "source", sources: [...sourceBuf] });
        sourceBuf.length = 0;
      }
      entries.push({ kind: "content", part, partIndex: i });
    }
  }

  flushReasoning();
  if (sourceBuf.length > 0) {
    entries.push({ kind: "source", sources: [...sourceBuf] });
  }

  if (lastReasoningEntryIdx >= 0) {
    (entries[lastReasoningEntryIdx] as Extract<PartEntry, { kind: "reasoning" }>).isLastReasoning = true;
  }

  return entries;
}

export function MessageParts({ message, isLast, isStreaming, ctx, onApprove }: MessagePartsProps) {
  const entries = buildInterleavedParts(message);

  return (
    <>
      {entries.map((entry) => {
        if (entry.kind === "reasoning") {
          const text = entry.blocks.map((b) => b.text).join("\n\n");
          const isReasoningStreaming = entry.isLastReasoning && isLast && isStreaming;
          return (
            <Reasoning key={`reasoning-${text.length}`} isStreaming={isReasoningStreaming} className="mb-2">
              <ReasoningTrigger />
              <ReasoningContent>{text}</ReasoningContent>
            </Reasoning>
          );
        }

        if (entry.kind === "source") {
          return (
            <Sources key="sources" className="mb-2">
              <SourcesTrigger count={entry.sources.length} />
              <SourcesContent>
                {entry.sources.map((s, i) => (
                  <Source key={s.url ?? `source-${i}`} href={s.url ?? "#"} title={s.title}>
                    {s.title ?? s.url}
                  </Source>
                ))}
              </SourcesContent>
            </Sources>
          );
        }

        const { part, partIndex } = entry;

        if (part.type === "text") {
          return (
            <TextPart
              key={`${message.id}-txt-${partIndex}`}
              text={part.text}
              role={message.role}
              isStreaming={isStreaming}
              messageId={message.id}
              index={partIndex}
            />
          );
        }

        if (part.type === "file") {
          return (
            <FilePart
              key={`${message.id}-file-${partIndex}`}
              file={part}
              messageId={message.id}
              index={partIndex}
            />
          );
        }

        if (isToolUIPart(part)) {
          return (
            <ToolPart
              key={`${message.id}-tool-${partIndex}`}
              part={part}
              messageId={message.id}
              index={partIndex}
              ctx={ctx}
              onApprove={onApprove}
            />
          );
        }

        return null;
      })}
    </>
  );
}
