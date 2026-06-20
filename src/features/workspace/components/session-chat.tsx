"use client";

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

interface SessionChatProps {
  workspaceId: string;
  sessionId: string;
}

export function SessionChat({ workspaceId, sessionId }: SessionChatProps) {
  const agent = useAgent({ agent: "teacher", name: workspaceId });

  const { messages, sendMessage, status } = useAgentChat({
    agent,
    id: sessionId,
  });

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
    <div className="flex h-full flex-col">
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
  );
}
