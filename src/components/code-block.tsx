import { useState } from "react";
import type { ComponentProps } from "react";
import { Streamdown } from "streamdown";
import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { cn } from "~/lib/utils";

const plugins = { cjk, code };

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
    <div className={cn("rounded-lg border bg-card overflow-hidden", className)} {...props}>
      <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-2">
        <div className="flex items-center gap-2">
          {filename && (
            <span className="text-xs text-muted-foreground">{filename}</span>
          )}
          <span className="text-xs text-muted-foreground font-mono">.{language}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <div className="overflow-x-auto">
        <Streamdown
          className="p-4 text-sm! prose prose-sm dark:prose-invert! [&>pre]:bg-transparent! [&>pre]:p-0!"
          plugins={plugins}
        >
          {`\`\`\`${language}\n${code}\n\`\`\``}
        </Streamdown>
      </div>
    </div>
  );
}
