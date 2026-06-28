import { useCallback, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { Message02Icon, Key02Icon } from "@hugeicons/core-free-icons";
import {
  PromptInput,
  type PromptInputMessage,
  PromptInputAttachments,
  PromptInputButton,
  PromptInputSubmit,
  PromptInputTextarea,
  usePromptInputController,
  usePromptInputAttachments,
} from "~/components/ai-elements/prompt-input";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import { Suggestion, Suggestions } from "~/components/ai-elements/suggestion";
import { PlusIcon } from "lucide-react";
import { useThreads } from "~/features/workspace/hooks/use-threads";
import { pendingMessageRef } from "./pending-message";
import { useApiKeyStatus } from "~/hooks/use-api-key";
import { Button } from "~/components/ui/button";
import { SettingsDialog } from "~/features/settings/components/global-settings-dialog";

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
  const { hasKey, providerName, isLoading: apiKeyLoading } = useApiKeyStatus();

  const handleSend = useCallback(
    (message?: PromptInputMessage) => {
      setCreateError(null);
      create.mutate(
        { workspaceId },
        {
          onSuccess: (thread) => {
            if (message?.text.trim()) {
              pendingMessageRef.current = message;
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
        {!apiKeyLoading && !hasKey && <ApiKeyBanner providerName={providerName} />}
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
      <PromptInputButton
        aria-label="Add attachment"
        onClick={() => attachments.openFileDialog()}
        disabled={disabled}
      >
        <PlusIcon className="size-5" />
      </PromptInputButton>
      <PromptInputTextarea placeholder={disabled ? "Set an API key in Settings to start…" : "Ask your teacher…"} disabled={disabled} />
      <PromptInputSubmit status="ready" disabled={!hasContent || disabled} />
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
