import { useCallback, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { Message02Icon } from "@hugeicons/core-free-icons";
import {
  PromptInput,
  type PromptInputMessage,
  PromptInputAttachments,
  PromptInputButton,
  PromptInputSubmit,
  PromptInputTextarea,
  usePromptInputController,
  usePromptInputAttachments,
} from "~/features/thread/components/prompt-input";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import { Suggestion, Suggestions } from "~/features/thread/components/suggestion";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { useThreads } from "~/features/thread/hooks/use-threads"
import { setPendingMessage } from "~/features/thread/lib/pending-message";
import { useApiKeyStatus } from "~/hooks/use-api-key";
import { ApiKeyBanner } from "~/features/thread/components/api-key-banner";

const STARTER_SUGGESTIONS = [
  "What should I learn first?",
  "Quiz me on the basics",
  "Explain the core idea simply",
];

interface EmptyStateProps {
  workspaceId: string;
}

export function EmptyState({ workspaceId }: EmptyStateProps) {
  const navigate = useNavigate();
  const { create, refetch } = useThreads(workspaceId);
  const [createError, setCreateError] = useState<string | null>(null);
  const { hasKey, providerName } = useApiKeyStatus();

  const handleSend = useCallback(
    (message?: PromptInputMessage) => {
      setCreateError(null);
      create.mutate(
        { workspaceId },
        {
          onSuccess: (thread) => {
            if (message?.text.trim()) {
              setPendingMessage(message);
            }
            refetch();
            navigate({
              to: "/workspaces/$workspaceId/threads/$threadId",
              params: { workspaceId, threadId: thread.id },
            });
          },
          onError: (error) =>
            setCreateError(error instanceof Error ? error.message : "Failed to start thread."),
        },
      );
    },
    [create, workspaceId, navigate, refetch],
  );

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
        {createError && (
          <p className="mx-auto mb-2 max-w-3xl text-center text-xs text-destructive" role="alert">
            {createError}
          </p>
        )}
        {!hasKey && <ApiKeyBanner providerName={providerName} />}
        <EmptyStateInput onSend={handleSend} disabled={!hasKey} />

        <Suggestions className="mx-auto mt-3 max-w-3xl">
          {STARTER_SUGGESTIONS.map((s) => (
            <Suggestion
              key={s}
              suggestion={s}
              onClick={() => handleSend({ text: s, files: [] })}
              disabled={!hasKey}
            >
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

function EmptyStateInput({
  onSend,
  disabled,
}: {
  onSend: (message?: PromptInputMessage) => void | Promise<void>;
  disabled?: boolean;
}) {
  const { textInput } = usePromptInputController();
  const attachments = usePromptInputAttachments();
  const hasContent =
    textInput.value.trim().length > 0 || attachments.files.length > 0;

  const submit = ({ text, files }: PromptInputMessage) => {
    if (!text.trim() && files.length === 0) return;
    onSend({ text, files });
  };

  return (
    <PromptInput accept="image/*" multiple onSubmit={submit} aria-disabled={disabled}>
      <PromptInputAttachments />
      <AttachmentButton disabled={disabled} />
      <PromptInputTextarea placeholder={disabled ? "Set an API key in Settings to start…" : "Ask your teacher…"} disabled={disabled} />
      <PromptInputSubmit status="ready" disabled={!hasContent || disabled} />
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
