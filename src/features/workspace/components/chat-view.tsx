import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Button } from "~/components/ui/button";
import { PlusIcon } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Key02Icon, SchoolIcon } from "@hugeicons/core-free-icons";
import { SettingsDialog } from "~/features/settings/components/global-settings-dialog";
import { useTeacherAgent } from "~/features/workspace/hooks/use-teacher-agent";
import { useThreads } from "~/features/workspace/hooks/use-threads";
import { ThreadRpc } from "~/server/rpc/thread";
import type { Thread } from "~/server/features/thread/service";
import { MessageParts } from "./message-parts";
import { consumePendingMessage } from "./pending-message";
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
  const { refetch } = useThreads(workspaceId);
  const agent = useTeacherAgent(`${workspaceId}::${threadId}`);
  const { hasKey, providerName, isLoading: apiKeyLoading } = useApiKeyStatus();
  const queryClient = useQueryClient();

  const { data: threadData } = useQuery({
    ...ThreadRpc.getThread(threadId),
  });
  const teachingMode = threadData?.teachingMode ?? true;

  const setTeachingMode = useMutation({
    ...ThreadRpc.setTeachingMode(),
    onMutate: async ({ enabled }) => {
      await queryClient.cancelQueries({ queryKey: ["thread", threadId] });
      const prev = queryClient.getQueryData<Thread | null>(["thread", threadId]);
      if (prev) {
        queryClient.setQueryData(["thread", threadId], (old: Thread | null | undefined) =>
          old ? { ...old, teachingMode: enabled } : old,
        );
      }
      return { prev };
    },
    onError: (_e, _input, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["thread", threadId], ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["thread", threadId] });
    },
  });

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
        {!apiKeyLoading && !hasKey && <ApiKeyBanner providerName={providerName} />}
        <ChatPromptInput
          status={status}
          isBusy={isBusy}
          onSubmit={handleSubmit}
          onStop={stop}
          onRegenerate={() => regenerate()}
          canRegenerate={messages.length > 0 && !isBusy}
          disabled={!hasKey}
          teachingMode={teachingMode}
          teachingModePending={setTeachingMode.isPending}
          onToggleTeachingMode={() => setTeachingMode.mutate({ id: threadId, enabled: !teachingMode })}
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
  disabled?: boolean;
  teachingMode: boolean;
  teachingModePending: boolean;
  onToggleTeachingMode: () => void;
}

function ChatPromptInput({
  status,
  isBusy,
  onSubmit,
  onStop,
  onRegenerate,
  canRegenerate,
  disabled,
  teachingMode,
  teachingModePending,
  onToggleTeachingMode,
}: ChatPromptInputProps) {
  const { textInput } = usePromptInputController();
  const attachments = usePromptInputAttachments();
  const hasContent =
    textInput.value.trim().length > 0 || attachments.files.length > 0;

  return (
    <PromptInput accept="image/*" multiple onSubmit={onSubmit} aria-disabled={disabled}>
      <PromptInputAttachments />
      <PromptInputButton
        aria-label="Add attachment"
        onClick={() => attachments.openFileDialog()}
        disabled={disabled}
      >
        <PlusIcon className="size-5" />
      </PromptInputButton>
      <PromptInputTextarea placeholder={disabled ? "Set an API key in Settings to continue…" : "Ask your teacher…"} disabled={disabled} />
      <PromptInputButton
        aria-label={teachingMode ? "Disable teaching mode" : "Enable teaching mode"}
        onClick={onToggleTeachingMode}
        disabled={disabled || teachingModePending}
        data-active={teachingMode}
        className="data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
      >
        <HugeiconsIcon icon={SchoolIcon} className="size-5" />
      </PromptInputButton>
      {canRegenerate && (
        <PromptInputButton aria-label="Regenerate" onClick={onRegenerate}>
          <span className="text-xs">Retry</span>
        </PromptInputButton>
      )}
      <PromptInputSubmit
        status={status}
        disabled={!hasContent && !isBusy || disabled}
        onStop={onStop}
      />
    </PromptInput>
  );
}

function ApiKeyBanner({ providerName }: { providerName: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto mb-3 max-w-3xl rounded-xl border border-dashed border-muted-foreground/30 bg-muted/40 px-4 py-3 text-center text-sm text-muted-foreground">
      <div className="flex items-center justify-center gap-2">
        <HugeiconsIcon icon={Key02Icon} className="size-4" />
        <span>
          No API key configured for <strong>{providerName}</strong>.
        </span>
        <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setOpen(true)}>
          Open Settings
        </Button>
      </div>
      <SettingsDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
