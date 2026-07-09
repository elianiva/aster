import { useState } from "react";
import type { ComponentProps } from "react";
import { cn } from "~/lib/utils";
import { streamdownPlugins } from "~/lib/streamdown-plugins";
import { Streamdown } from "streamdown";
import { CheckIcon, CopyIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export interface CodeBlockProps extends ComponentProps<"div"> {
  language: string;
  code: string;
  filename?: string;
}

export function CodeBlock({ language, code, filename, className, ...props }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn("artifact-code group rounded-lg bg-secondary/70 overflow-hidden", className)}
      {...props}
    >
      <div className="flex items-center justify-between px-3 py-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-mono text-xs bg-white px-1.5 py-1 rounded-md">{language}</span>
          {filename && <span>{filename}</span>}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="text-xs text-muted-foreground transition-opacity bg-white p-1 rounded-md"
        >
          {copied ? (
            <HugeiconsIcon icon={CheckIcon} className="size-4" />
          ) : (
            <HugeiconsIcon icon={CopyIcon} className="size-4" />
          )}
        </button>
      </div>
      <Streamdown
        className="w-full px-3 pb-3 [&>pre]:whitespace-pre! [&>pre]:bg-transparent! [&>pre]:p-0!"
        plugins={streamdownPlugins}
        shikiTheme={["github-light", "github-light"]}
        lineNumbers={false}
      >
        {`\`\`\`${language}\n${code.replaceAll("\n", "\n\n")}\n\`\`\``}
      </Streamdown>
    </div>
  );
}
