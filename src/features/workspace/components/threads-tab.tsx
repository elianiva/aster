import { useState, useCallback } from "react";
import { useAgent } from "agents/react";
import { useAgentChat } from "@cloudflare/ai-chat/react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "~/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "~/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputButton,
  PromptInputFooter,
} from "~/components/ai-elements/prompt-input";
import { SendIcon } from "lucide-react";
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
    setThreads((prev) =>
      prev.map((t) => (t.id === id ? { ...t, name } : t))
    );
  }, []);

  const handleDeleteThread = useCallback((id: string) => {
    setThreads((prev) => prev.filter((t) => t.id !== id));
    setSelectedThreadId("general");
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const message = formData.get("message") as string;
    if (message.trim()) {
      sendMessage({ text: message });
      form.reset();
    }
  };

  const getTextContent = (message: { parts: Array<{ type: string; text?: string }> }) => {
    return message.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text ?? "")
      .join("");
  };

  return (
    <div className="flex h-full">
      {/* Thread list */}
      <div className="w-64 shrink-0">
        <ThreadList
          threads={threads}
          selectedThreadId={selectedThreadId}
          onSelectThread={setSelectedThreadId}
          onCreateThread={handleCreateThread}
          onRenameThread={handleRenameThread}
          onDeleteThread={handleDeleteThread}
        />
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <HugeiconsIcon icon={Message02Icon} />
                </EmptyMedia>
                <EmptyTitle>Start a conversation</EmptyTitle>
                <EmptyDescription>
                  Send a message to begin learning about {selectedThread?.name}.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <Conversation>
            <ConversationContent>
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

        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <PromptInput className="flex-1" onSubmit={() => {}}>
              <PromptInputTextarea
                name="message"
                placeholder="Ask your teacher..."
                rows={1}
              />
              <PromptInputFooter>
                <PromptInputButton
                  type="submit"
                  disabled={status === "streaming" || status === "submitted"}
                >
                  <SendIcon className="h-4 w-4" />
                </PromptInputButton>
              </PromptInputFooter>
            </PromptInput>
          </form>
        </div>
      </div>
    </div>
  );
}
