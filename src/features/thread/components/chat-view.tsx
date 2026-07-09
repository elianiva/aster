import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAgentChat } from "@cloudflare/ai-chat/react";
import type { ChatStatus } from "ai";
import {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
} from "~/components/ui/message-scroller";
import { Message } from "~/components/ui/message";
import { Bubble, BubbleContent } from "~/components/ui/bubble";
import { Marker, MarkerIcon, MarkerContent } from "~/components/ui/marker";
import { ApiKeyBanner } from "./api-key-banner";
import {
  PromptInput,
  type PromptInputMessage,
  PromptInputAttachments,
  PromptInputButton,
  PromptInputSubmit,
  PromptInputTextarea,
  usePromptInputAttachments,
  usePromptInputController,
} from "./prompt-input";
import { Spinner } from "~/components/ui/spinner";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTeacherAgent } from "~/features/workspace/hooks/use-teacher-agent";
import { queryKeys } from "~/lib/query-keys";
import { MessageParts } from "./message-parts";
import { consumePendingMessage } from "~/features/thread/lib/pending-message";
import { useApiKeyStatus } from "~/hooks/use-api-key";

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
  const queryClient = useQueryClient();
  const agent = useTeacherAgent(`${workspaceId}::${threadId}`);
  const { hasKey, providerName } = useApiKeyStatus();

  const { messages, sendMessage, status, stop, isRecovering, addToolApprovalResponse } =
    useAgentChat({ agent, id: threadId });

  const prevStatus = useRef<ChatStatus>(status);
  useEffect(() => {
    if (prevStatus.current !== "ready" && status === "ready") {
      queryClient.invalidateQueries({ queryKey: queryKeys.threads.all(workspaceId) });
    }
    prevStatus.current = status;
  }, [status, workspaceId, queryClient]);

  const agentRef = useRef(agent);
  const sendMessageRef = useRef(sendMessage);
  agentRef.current = agent;
  sendMessageRef.current = sendMessage;

  useEffect(() => {
    const pending = consumePendingMessage();
    if (!pending) return;

    let cancelled = false;

    const trySend = async () => {
      try {
        await agent.ready;
        if (cancelled) return;
        await sendMessageRef.current({
          text: pending.text,
          files: pending.files,
        });
      } catch (error) {
        console.error("Failed to send pending message:", error);
      }
    };

    trySend();
    return () => {
      cancelled = true;
    };
  }, []);

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
      <MessageScrollerProvider>
        <MessageScroller className="flex-1">
          <MessageScrollerViewport>
            <MessageScrollerContent className="mx-auto w-full max-w-3xl">
              {messages.map((message, index) => (
                <MessageScrollerItem
                  key={message.id}
                  scrollAnchor={message.role === "user"}
                >
                  <Message align={message.role === "user" ? "end" : "start"}>
                    <Bubble
                      variant={message.role === "user" ? "secondary" : "ghost"}
                      align={message.role === "user" ? "end" : "start"}
                    >
                      <BubbleContent>
                        <MessageParts
                          message={message}
                          isLast={index === messages.length - 1}
                          isStreaming={status === "streaming"}
                          ctx={ctx}
                          onApprove={(id, approved) => addToolApprovalResponse({ id, approved })}
                        />
                      </BubbleContent>
                    </Bubble>
                  </Message>
                </MessageScrollerItem>
              ))}
              {showThinking && (
                <Marker>
                  <MarkerIcon>
                    <Spinner className="size-3.5" />
                  </MarkerIcon>
                  <MarkerContent>
                    <span className="shimmer">Thinking…</span>
                  </MarkerContent>
                </Marker>
              )}
              {isRecovering && (
                <Marker>
                  <MarkerIcon>
                    <Spinner className="size-3.5" />
                  </MarkerIcon>
                  <MarkerContent>
                    <span className="shimmer">Recovering turn…</span>
                  </MarkerContent>
                </Marker>
              )}
              {status === "error" && !isRecovering && (
                <Marker className="text-destructive">
                  <MarkerContent>Something went wrong. Try sending again.</MarkerContent>
                </Marker>
              )}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>

      <div className="pt-1">
        {!hasKey && <ApiKeyBanner providerName={providerName} />}
        <ChatPromptInput
          status={status}
          isBusy={isBusy}
          onSubmit={handleSubmit}
          onStop={stop}
          disabled={!hasKey}
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
  disabled?: boolean;
}

function ChatPromptInput({
  status,
  isBusy,
  onSubmit,
  onStop,
  disabled,
}: ChatPromptInputProps) {
  const { textInput } = usePromptInputController();
  const attachments = usePromptInputAttachments();
  const hasContent = textInput.value.trim().length > 0 || attachments.files.length > 0;

  return (
    <PromptInput accept="image/*" multiple onSubmit={onSubmit} aria-disabled={disabled} className="shadow-lg/5 rounded-full">
      <PromptInputAttachments />
      <AttachmentButton disabled={disabled} />
      <PromptInputTextarea
        placeholder={disabled ? "Set an API key in Settings to continue…" : "Ask your teacher…"}
        disabled={disabled}
      />
      <PromptInputSubmit
        status={status}
        disabled={(!hasContent && !isBusy) || disabled}
        onStop={onStop}
      />
    </PromptInput>
  );
}

function AttachmentButton({ disabled }: { disabled?: boolean }) {
  const { openFileDialog } = usePromptInputController();
  return (
    <PromptInputButton
      aria-label="Add attachment"
      onClick={openFileDialog}
      disabled={disabled}
    >
      <HugeiconsIcon icon={PlusSignIcon} className="size-5" />
    </PromptInputButton>
  );
}
