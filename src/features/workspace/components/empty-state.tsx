import { useCallback } from "react";
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

  const handleSend = useCallback(
    (message?: PromptInputMessage) => {
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
          onError: (error) => console.error("Thread creation failed:", error),
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
        <EmptyStateInput onSend={handleSend} />

        <Suggestions className="mx-auto mt-3 max-w-3xl">
          {STARTER_SUGGESTIONS.map((s) => (
            <Suggestion
              key={s}
              suggestion={s}
              onClick={() => handleSend({ text: s, files: [] })}
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
}: {
  onSend: (message?: PromptInputMessage) => void | Promise<void>;
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
    <PromptInput accept="image/*" multiple onSubmit={submit}>
      <PromptInputAttachments />
      <PromptInputButton
        aria-label="Add attachment"
        onClick={() => attachments.openFileDialog()}
      >
        <PlusIcon className="size-5" />
      </PromptInputButton>
      <PromptInputTextarea placeholder="Ask your teacher…" />
      <PromptInputSubmit status="ready" disabled={!hasContent} />
    </PromptInput>
  );
}
