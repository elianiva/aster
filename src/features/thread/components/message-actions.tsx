import { useState } from "react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "~/components/ui/tooltip";
import { Check, Copy, RefreshCw, GitBranch } from "lucide-react";
import type { UIMessage } from "ai";

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((p): p is Extract<(typeof message.parts)[number], { type: "text" }> => p.type === "text")
    .map((p) => p.text)
    .join("\n");
}

interface MessageActionsProps {
  message: UIMessage;
  isStreaming: boolean;
  isLast: boolean;
  onRegenerate: (messageId: string) => void;
}

export function MessageActions({ message, isStreaming, isLast, onRegenerate }: MessageActionsProps) {
  const [copied, setCopied] = useState(false);
  const isBusy = isStreaming && isLast;

  const handleCopy = async () => {
    const text = getMessageText(message);
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <TooltipProvider delay={0}>
      <div
        className={cn(
          "flex items-center gap-0.5 transition-opacity",
          isLast ? "opacity-100" : "opacity-0 group-hover/message:opacity-100",
        )}
      >
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-foreground"
                onClick={handleCopy}
                disabled={isBusy}
              />
            }
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </TooltipTrigger>
          <TooltipContent>{copied ? "Copied" : "Copy"}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-foreground"
                onClick={() => onRegenerate(message.id)}
                disabled={isBusy}
              />
            }
          >
            <RefreshCw className="size-4" />
          </TooltipTrigger>
          <TooltipContent>Regenerate</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-foreground"
                disabled
              />
            }
          >
            <GitBranch className="size-4" />
          </TooltipTrigger>
          <TooltipContent>Branch (coming soon)</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
