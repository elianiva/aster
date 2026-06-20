import { useState, useCallback } from "react";
import { useAgent } from "agents/react";
import { useAgentChat } from "@cloudflare/ai-chat/react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "~/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "~/components/ai-elements/message";
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
import type { ChatStatus, FileUIPart } from "ai";
import { PlusIcon } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import { HugeiconsIcon } from "@hugeicons/react";
import { Message02Icon } from "@hugeicons/core-free-icons";
import { ThreadList, type Thread } from "./thread-list";

interface ThreadsTabProps {
  workspaceId: string;
}

// TODO: Replace with real data from server
const DEMO_THREADS: Thread[] = [
  {
    id: "general",
    name: "General",
    isGeneral: true,
    lastMessage: "Welcome to your workspace!",
    updatedAt: new Date().toISOString(),
  },
];

export function ThreadsTab({ workspaceId }: ThreadsTabProps) {
  const [threads, setThreads] = useState<Thread[]>(DEMO_THREADS);
  const [selectedThreadId, setSelectedThreadId] = useState<string>("general");

  const agent = useAgent({ agent: "teacher", name: workspaceId });

  const { messages, sendMessage, status } = useAgentChat({
    agent,
    id: selectedThreadId,
  });

  const selectedThread = threads.find((t) => t.id === selectedThreadId);

  const handleCreateThread = useCallback((name: string) => {
    const newThread: Thread = {
      id: crypto.randomUUID(),
      name,
      isGeneral: false,
      updatedAt: new Date().toISOString(),
    };
    setThreads((prev) => [...prev, newThread]);
    setSelectedThreadId(newThread.id);
  }, []);

  const handleRenameThread = useCallback((id: string, name: string) => {
    setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)));
  }, []);

  const handleDeleteThread = useCallback((id: string) => {
    setThreads((prev) => prev.filter((t) => t.id !== id));
    setSelectedThreadId("general");
  }, []);

  const getTextContent = (message: { parts: Array<{ type: string; text?: string }> }) => {
    return message.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text ?? "")
      .join("");
  };

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        {messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <Empty className="max-w-md border-0">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <HugeiconsIcon icon={Message02Icon} />
                </EmptyMedia>
                <EmptyTitle>Start a conversation</EmptyTitle>
                <EmptyDescription>
                  Ask a question about {selectedThread?.name} and your teacher agent will guide you.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <Conversation className="flex-1">
            <ConversationContent className="mx-auto w-full max-w-3xl">
              {messages.map((message) => (
                <Message key={message.id} from={message.role === "user" ? "user" : "assistant"}>
                  <MessageContent>
                    <MessageResponse>{getTextContent(message)}</MessageResponse>
                  </MessageContent>
                </Message>
              ))}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        )}

        <div className="bg-background p-4">
          <PromptInputProvider>
            <TeacherPromptInput
              status={status}
              onSubmit={(text, files) => sendMessage({ text, files })}
            />
          </PromptInputProvider>
          <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-muted-foreground">
            Your teacher agent may make mistakes. Verify important information.
          </p>
        </div>
      </div>

      <ThreadList
        threads={threads}
        selectedThreadId={selectedThreadId}
        onSelectThread={setSelectedThreadId}
        onCreateThread={handleCreateThread}
        onRenameThread={handleRenameThread}
        onDeleteThread={handleDeleteThread}
      />
    </div>
  );
}

interface TeacherPromptInputProps {
  status: ChatStatus;
  onSubmit: (text: string, files: FileUIPart[]) => void;
}

function TeacherPromptInput({ status, onSubmit }: TeacherPromptInputProps) {
  const { textInput } = usePromptInputController();
  const attachments = usePromptInputAttachments();
  const isBusy = status === "streaming" || status === "submitted";
  const hasContent = textInput.value.trim().length > 0 || attachments.files.length > 0;

  const handleSubmit = ({ text, files }: PromptInputMessage) => {
    if (isBusy || (!text.trim() && files.length === 0)) return;
    onSubmit(text, files);
  };

  return (
    <PromptInput accept="image/*" multiple onSubmit={handleSubmit}>
      <PromptInputAttachments />
      <PromptInputButton aria-label="Add attachment" onClick={() => attachments.openFileDialog()}>
        <PlusIcon className="size-5" />
      </PromptInputButton>
      <PromptInputTextarea placeholder="Ask your teacher..." />
      <PromptInputSubmit status={status} disabled={!hasContent || isBusy} />
    </PromptInput>
  );
}
