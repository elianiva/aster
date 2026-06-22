import { useCallback, useEffect, useRef } from "react";
import { useAgentChat } from "@cloudflare/ai-chat/react";
import type { ChatStatus } from "ai";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "~/components/ai-elements/conversation";
import { Message, MessageContent } from "~/components/ai-elements/message";
import {
  PromptInput,
  type PromptInputMessage,
  PromptInputAttachments,
  PromptInputButton,
  PromptInputSubmit,
  PromptInputTextarea,
  usePromptInputAttachments,
  usePromptInputController,
} from "~/components/ai-elements/prompt-input";
import { Spinner } from "~/components/ui/spinner";
import { PlusIcon } from "lucide-react";
import { useTeacherAgent } from "~/features/workspace/hooks/use-teacher-agent";
import { useThreads } from "~/features/workspace/hooks/use-threads";
import { MessageParts } from "./message-parts";
import { pendingMessageRef } from "./pending-message";

// ============================================================================
// Types
// ============================================================================

interface ChatViewProps {
  workspaceId: string;
  threadId: string;
}

// ============================================================================
// ChatView
// ============================================================================

export function ChatView({ workspaceId, threadId }: ChatViewProps) {
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

  const prevStatus = useRef<ChatStatus>(status);
  useEffect(() => {
    if (prevStatus.current !== "ready" && status === "ready") {
      refetch();
      const timer = setTimeout(() => refetch(), 2000);
      return () => clearTimeout(timer);
    }
    prevStatus.current = status;
  }, [status, refetch]);

  // Send pending first message from EmptyState
  const agentRef = useRef(agent);
  const sendMessageRef = useRef(sendMessage);
  agentRef.current = agent;
  sendMessageRef.current = sendMessage;

  useEffect(() => {
    const pending = pendingMessageRef.current;
    if (!pending) return;

    let cancelled = false;

    const trySend = async () => {
      try {
        await agent.ready;
        if (cancelled) return;
        pendingMessageRef.current = null;
        await sendMessageRef.current({
          text: pending.text,
          files: pending.files,
        });
      } catch (error) {
        console.error("Failed to send pending message:", error);
        // Restore pending message so user can retry
        if (!cancelled) pendingMessageRef.current = pending;
      }
    };

    trySend();
    return () => { cancelled = true; };
  }, []); // Only on mount

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
        <ConversationContent className="mx-auto w-full max-w-4xl">
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
        <ChatPromptInput
          status={status}
          isBusy={isBusy}
          onSubmit={handleSubmit}
          onStop={stop}
          onRegenerate={() => regenerate()}
          canRegenerate={messages.length > 0 && !isBusy}
        />
        <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-muted-foreground">
          Your teacher agent may make mistakes. Verify important information.
        </p>
      </div>
    </>
  );
}

// ============================================================================
// Chat prompt input
// ============================================================================

interface ChatPromptInputProps {
  status: ChatStatus;
  isBusy: boolean;
  onSubmit: (message: PromptInputMessage) => void;
  onStop: () => void;
  onRegenerate: () => void;
  canRegenerate: boolean;
}

function ChatPromptInput({
  status,
  isBusy,
  onSubmit,
  onStop,
  onRegenerate,
  canRegenerate,
}: ChatPromptInputProps) {
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
