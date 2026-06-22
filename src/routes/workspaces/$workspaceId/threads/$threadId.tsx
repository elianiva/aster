import { useCallback, useEffect, useRef } from "react";
import {
  createFileRoute,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { useAgentChat } from "@cloudflare/ai-chat/react";
import {
  isToolOrDynamicToolUIPart,
  type ChatStatus,
  type DynamicToolUIPart,
  type FileUIPart,
  type ToolUIPart,
  type UIMessage,
} from "ai";
import { HugeiconsIcon } from "@hugeicons/react";
import { Message02Icon } from "@hugeicons/core-free-icons";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "~/components/ai-elements/conversation";
import { Message, MessageContent } from "~/components/ai-elements/message";
import { Renderer } from "@openuidev/react-lang";
import { asterLibrary } from "~/components/openui/library";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "~/components/ai-elements/reasoning";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "~/components/ai-elements/sources";
import {
  Suggestion,
  Suggestions,
} from "~/components/ai-elements/suggestion";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "~/components/ai-elements/tool";
import {
  Confirmation,
  ConfirmationAccepted,
  ConfirmationAction,
  ConfirmationActions,
  ConfirmationRejected,
  ConfirmationRequest,
} from "~/components/ai-elements/confirmation";
import {
  PromptInput,
  type PromptInputMessage,
  PromptInputAttachments,
  PromptInputButton,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  usePromptInputAttachments,
  usePromptInputController,
} from "~/components/ai-elements/prompt-input";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import { Spinner } from "~/components/ui/spinner";
import { PlusIcon } from "lucide-react";

import { useTeacherAgent } from "~/features/workspace/hooks/use-teacher-agent";
import { useThreads } from "~/features/workspace/hooks/use-threads";
import { renderToolOutput } from "~/features/workspace/components/tool-renderers";

export const Route = createFileRoute(
  "/workspaces/$workspaceId/threads/$threadId",
)({
  component: RouteThreadId,
});

function RouteThreadId() {
  const { workspaceId, threadId } = Route.useParams();

  if (threadId === "new") {
    return <EmptyState workspaceId={workspaceId} />;
  }

  return <ChatView workspaceId={workspaceId} threadId={threadId} />;
}

// ---------------------------------------------------------------------------

const STARTER_SUGGESTIONS = [
  "What should I learn first?",
  "Quiz me on the basics",
  "Explain the core idea simply",
];

// ---------------------------------------------------------------------------

interface EmptyStateProps {
  workspaceId: string;
}

function EmptyState({ workspaceId }: EmptyStateProps) {
  const navigate = useNavigate();
  const { create, refetch } = useThreads(workspaceId);

  const handleSend = useCallback(
    async (text: string, files: FileUIPart[]) => {
      const thread = await create.mutateAsync({ workspaceId });
      refetch();
      navigate({
        to: "/workspaces/$workspaceId/threads/$threadId",
        params: { workspaceId, threadId: thread.id },
        state: { initialMessage: { text, files } },
      });
    },
    [create, workspaceId, navigate, refetch],
  );

  return (
    <PromptInputProvider>
      <EmptyStateInner workspaceId={workspaceId} onSend={handleSend} />
    </PromptInputProvider>
  );
}

function EmptyStateInner({
  workspaceId,
  onSend,
}: {
  workspaceId: string;
  onSend: (text: string, files: FileUIPart[]) => void | Promise<void>;
}) {
  const { textInput } = usePromptInputController();
  const attachments = usePromptInputAttachments();
  const isBusy = false;
  const hasContent =
    textInput.value.trim().length > 0 || attachments.files.length > 0;

  const submit = ({ text, files }: PromptInputMessage) => {
    if (!text.trim() && files.length === 0) return;
    void onSend(text, files);
  };

  const sendSuggestion = (text: string) => {
    void onSend(text, []);
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 items-center justify-center p-6">
        <Empty className="max-w-md border-0">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={Message02Icon} />
            </EmptyMedia>
            <EmptyTitle>Start a conversation</EmptyTitle>
            <EmptyDescription>
              Ask a question and your teacher agent will start a thread for it.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>

      <div className="bg-background p-4">
        <PromptInput accept="image/*" multiple onSubmit={submit}>
          <PromptInputAttachments />
          <PromptInputButton
            aria-label="Add attachment"
            onClick={() => attachments.openFileDialog()}
          >
            <PlusIcon className="size-5" />
          </PromptInputButton>
          <PromptInputTextarea placeholder="Ask your teacher…" />
          <PromptInputSubmit
            status={isBusy ? "submitted" : "ready"}
            disabled={!hasContent}
          />
        </PromptInput>

        <Suggestions className="mx-auto mt-3 max-w-3xl">
          {STARTER_SUGGESTIONS.map((s) => (
            <Suggestion key={s} suggestion={s} onClick={sendSuggestion}>
              {s}
            </Suggestion>
          ))}
        </Suggestions>

        <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-muted-foreground">
          Workspace: {workspaceId}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

interface ChatViewProps {
  workspaceId: string;
  threadId: string;
}

function ChatView({ workspaceId, threadId }: ChatViewProps) {
  const location = useLocation();
  const initialMessage = location.state?.initialMessage;

  const { refetch } = useThreads(workspaceId);
  const agent = useTeacherAgent(`${workspaceId}::${threadId}`);

  const {
    messages,
    sendMessage,
    status,
    stop,
    regenerate,
    isRecovering,
    addToolApprovalResponse,
  } = useAgentChat({ agent, id: threadId });

  const sentInitial = useRef(false);
  useEffect(() => {
    if (sentInitial.current) return;
    if (
      initialMessage &&
      (initialMessage.text.trim() || initialMessage.files.length)
    ) {
      sentInitial.current = true;
      sendMessage({
        text: initialMessage.text,
        files: initialMessage.files,
      });
    }
  }, [initialMessage, sendMessage]);

  const prevStatus = useRef<ChatStatus>(status);
  useEffect(() => {
    if (prevStatus.current !== "ready" && status === "ready") {
      refetch();
      const timer = setTimeout(() => refetch(), 2000);
      return () => clearTimeout(timer);
    }
    prevStatus.current = status;
  }, [status, refetch]);

  const handleSubmit = useCallback(
    ({ text, files }: PromptInputMessage) => {
      if (!text.trim() && files.length === 0) return;
      sendMessage({ text, files });
    },
    [sendMessage],
  );

  const ctx = { workspaceId };
  const isBusy = status === "submitted" || status === "streaming";
  const showThinking = status === "submitted" && messages.length > 0;

  return (
    <>
      <Conversation className="flex-1">
        <ConversationContent className="mx-auto w-full max-w-5xl">
          {messages.map((message, index) => (
            <Message
              key={message.id}
              from={message.role === "user" ? "user" : "assistant"}
            >
              <MessageContent>
                <MessageParts
                  message={message}
                  isLast={index === messages.length - 1}
                  isStreaming={status === "streaming"}
                  ctx={ctx}
                  onApprove={(id, approved) =>
                    addToolApprovalResponse({ id, approved })
                  }
                />
              </MessageContent>
            </Message>
          ))}
          {showThinking && (
            <div className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
              <Spinner className="size-3.5" />
              <span>Thinking…</span>
            </div>
          )}
          {isRecovering && (
            <div className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
              <Spinner className="size-3.5" />
              <span>Recovering turn…</span>
            </div>
          )}
          {status === "error" && !isRecovering && (
            <div className="px-1 text-sm text-destructive">
              Something went wrong. Try sending again.
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="bg-background p-4">
        <PromptInputProvider>
          <TeacherPromptInput
            status={status}
            isBusy={isBusy}
            onSubmit={handleSubmit}
            onStop={stop}
            onRegenerate={() => regenerate()}
            canRegenerate={messages.length > 0 && !isBusy}
          />
        </PromptInputProvider>
        <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-muted-foreground">
          Your teacher agent may make mistakes. Verify important information.
        </p>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------

interface MessagePartsProps {
  message: UIMessage;
  isLast: boolean;
  isStreaming: boolean;
  ctx: { workspaceId: string };
  onApprove: (id: string, approved: boolean) => void;
}

function MessageParts({
  message,
  isLast,
  isStreaming,
  ctx,
  onApprove,
}: MessagePartsProps) {
  const reasoningParts = message.parts.filter((p) => p.type === "reasoning");
  const reasoningText = reasoningParts
    .map((p) => (p as { text?: string }).text ?? "")
    .join("\n\n");
  const lastPart = message.parts.at(-1);
  const isReasoningStreaming =
    isLast && isStreaming && lastPart?.type === "reasoning";

  const sourceParts = message.parts.filter(
    (p) => p.type === "source-url" || p.type === "source-document",
  );

  return (
    <>
      {reasoningParts.length > 0 && (
        <Reasoning isStreaming={isReasoningStreaming} className="mb-2">
          <ReasoningTrigger />
          <ReasoningContent>{reasoningText}</ReasoningContent>
        </Reasoning>
      )}

      {sourceParts.length > 0 && (
        <Sources className="mb-2">
          <SourcesTrigger count={sourceParts.length} />
          <SourcesContent>
            {sourceParts.map((part, i) => {
              const p = part as { url?: string; title?: string };
              return (
                <Source
                  key={`${message.id}-src-${i}`}
                  href={p.url ?? "#"}
                  title={p.title}
                >
                  {p.title ?? p.url}
                </Source>
              );
            })}
          </SourcesContent>
        </Sources>
      )}

      {message.parts.map((part, i) => {
        if (part.type === "text") {
          const text = (part as { text: string }).text;
          if (text.length === 0) return null;
          if (message.role === "user") {
            return (
              <div
                key={`${message.id}-txt-${i}`}
                className="whitespace-pre-wrap"
              >
                {text}
              </div>
            );
          }
          return (
            <Renderer
              key={`${message.id}-txt-${i}`}
              library={asterLibrary}
              response={text}
              isStreaming={isStreaming}
              onError={() => {}}
            />
          );
        }
        if (part.type === "file") {
          const file = part as FileUIPart;
          return (
            <a
              key={`${message.id}-file-${i}`}
              href={file.url}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 rounded-md border bg-card px-2 py-1 text-xs hover:bg-accent"
            >
              {file.filename ?? "Attachment"}
            </a>
          );
        }
        if (isToolOrDynamicToolUIPart(part)) {
          const toolPart = part as ToolUIPart | DynamicToolUIPart;
          const toolName =
            toolPart.type === "dynamic-tool"
              ? (toolPart as DynamicToolUIPart).toolName
              : toolPart.type.slice("tool-".length);
          const approval = (
            toolPart as { approval?: { id: string; approved?: boolean } }
          ).approval;
          return (
            <Tool
              key={`${message.id}-tool-${i}`}
              defaultOpen
              className="mb-2"
            >
              <ToolHeader
                type={toolPart.type}
                state={toolPart.state}
                toolName={toolName}
              />
              <ToolContent>
                <ToolInput input={toolPart.input} />
                <ToolOutput
                  output={renderToolOutput(
                    toolName ?? "",
                    toolPart.output,
                    ctx,
                  )}
                  errorText={toolPart.errorText}
                />
                {approval && toolPart.state === "approval-requested" && (
                  <Confirmation
                    approval={approval as ToolUIPart["approval"]}
                    state={toolPart.state}
                    className="mt-2"
                  >
                    <ConfirmationRequest>
                      The teacher wants to run <strong>{toolName}</strong>.
                      Approve?
                    </ConfirmationRequest>
                    <ConfirmationActions>
                      <ConfirmationAction
                        variant="outline"
                        onClick={() => onApprove(approval.id, false)}
                      >
                        Reject
                      </ConfirmationAction>
                      <ConfirmationAction
                        onClick={() => onApprove(approval.id, true)}
                      >
                        Approve
                      </ConfirmationAction>
                    </ConfirmationActions>
                  </Confirmation>
                )}
                {approval && toolPart.state !== "approval-requested" && (
                  <Confirmation
                    approval={approval as ToolUIPart["approval"]}
                    state={toolPart.state}
                    className="mt-2"
                  >
                    <ConfirmationAccepted>
                      You approved this action
                    </ConfirmationAccepted>
                    <ConfirmationRejected>
                      You rejected this action
                    </ConfirmationRejected>
                  </Confirmation>
                )}
              </ToolContent>
            </Tool>
          );
        }
        return null;
      })}
    </>
  );
}

// ---------------------------------------------------------------------------

interface TeacherPromptInputProps {
  status: ChatStatus;
  isBusy: boolean;
  onSubmit: (message: PromptInputMessage) => void;
  onStop: () => void;
  onRegenerate: () => void;
  canRegenerate: boolean;
}

function TeacherPromptInput({
  status,
  isBusy,
  onSubmit,
  onStop,
  onRegenerate,
  canRegenerate,
}: TeacherPromptInputProps) {
  const { textInput } = usePromptInputController();
  const attachments = usePromptInputAttachments();
  const hasContent =
    textInput.value.trim().length > 0 || attachments.files.length > 0;

  return (
    <PromptInput accept="image/*" multiple onSubmit={onSubmit}>
      <PromptInputAttachments />
      <PromptInputButton
        aria-label="Add attachment"
        onClick={() => attachments.openFileDialog()}
      >
        <PlusIcon className="size-5" />
      </PromptInputButton>
      <PromptInputTextarea placeholder="Ask your teacher…" />
      {canRegenerate && (
        <PromptInputButton aria-label="Regenerate" onClick={onRegenerate}>
          <span className="text-xs">Retry</span>
        </PromptInputButton>
      )}
      <PromptInputSubmit
        status={status}
        disabled={!hasContent && !isBusy}
        onStop={onStop}
      />
    </PromptInput>
  );
}
