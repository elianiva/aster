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
const SKIP_INPUT = new Set(["createLesson", "createRecord", "createReference"]);

interface MessagePartsProps {
  message: UIMessage;
  isLast: boolean;
  isStreaming: boolean;
  ctx: { workspaceId: string };
  onApprove: (id: string, approved: boolean) => void;
}

function ReasoningBlock({
  parts,
  isStreaming,
  isLast,
}: {
  parts: { text?: string }[];
  isStreaming: boolean;
  isLast: boolean;
}) {
  const text = parts.map((p) => p.text ?? "").join("\n\n");
  const lastPart = parts.at(-1);
  const isReasoningStreaming = isLast && isStreaming && lastPart != null;

  return (
    <Reasoning isStreaming={isReasoningStreaming} className="mb-2">
      <ReasoningTrigger />
      <ReasoningContent>{text}</ReasoningContent>
    </Reasoning>
  );
}

function SourcesBlock({ parts }: { parts: { url?: string; title?: string }[] }) {
  return (
    <Sources className="mb-2">
      <SourcesTrigger count={parts.length} />
      <SourcesContent>
        {parts.map((p, i) => (
          <Source key={i} href={p.url ?? "#"} title={p.title}>
            {p.title ?? p.url}
          </Source>
        ))}
      </SourcesContent>
    </Sources>
  );
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
          output={renderToolOutput(toolName ?? "", part.output, part.input, ctx)}
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

export function MessageParts({ message, isLast, isStreaming, ctx, onApprove }: MessagePartsProps) {
  const reasoningParts: { text?: string }[] = [];
  const sourceParts: { url?: string; title?: string }[] = [];
  const contentParts: typeof message.parts = [];

  for (const part of message.parts) {
    if (part.type === "reasoning") {
      reasoningParts.push({ text: part.text });
    } else if (part.type === "source-url" || part.type === "source-document") {
      sourceParts.push({ url: "url" in part ? part.url : undefined, title: part.title });
    } else {
      contentParts.push(part);
    }
  }

  return (
    <>
      {reasoningParts.length > 0 && (
        <ReasoningBlock parts={reasoningParts} isStreaming={isStreaming} isLast={isLast} />
      )}

      {sourceParts.length > 0 && <SourcesBlock parts={sourceParts} />}

      {contentParts.map((part, i) => {
        if (part.type === "text") {
          return (
            <TextPart
              key={`${message.id}-txt-${i}`}
              text={part.text}
              role={message.role}
              isStreaming={isStreaming}
              messageId={message.id}
              index={i}
            />
          );
        }

        if (part.type === "file") {
          return (
            <FilePart
              key={`${message.id}-file-${i}`}
              file={part}
              messageId={message.id}
              index={i}
            />
          );
        }

        if (isToolUIPart(part)) {
          return (
            <ToolPart
              key={`${message.id}-tool-${i}`}
              part={part}
              messageId={message.id}
              index={i}
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
