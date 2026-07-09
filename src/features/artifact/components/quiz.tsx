import type { ComponentProps } from "react";
import { useState } from "react";
import { Streamdown } from "streamdown";
import { cn } from "~/lib/utils";
import { Badge } from "~/components/ui/badge";
import { streamdownPlugins } from "~/lib/streamdown-plugins";

export interface QuizProps extends ComponentProps<"div"> {
  question: string;
  options: string[];
  correctIndex?: number;
  explanation?: string;
}

export function Quiz({
  question,
  options,
  correctIndex,
  explanation,
  className,
  ...props
}: QuizProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const revealed = selected !== null;
  const isCorrect = revealed && correctIndex !== undefined && selected === correctIndex;

  return (
    <div className={cn("rounded-lg bg-card p-4 space-y-3", className)} {...props}>
      <div className="flex items-start gap-2">
        <Badge variant="secondary" className="shrink-0">
          Quiz
        </Badge>
        <p className="text-sm font-medium leading-relaxed">{question}</p>
      </div>

      <div className="space-y-2">
        {options.map((opt, i) => {
          const isOptionCorrect = correctIndex !== undefined && i === correctIndex;
          const showResult = revealed && (isOptionCorrect || i === selected);

          return (
            <button
              key={i}
              onClick={() => !revealed && setSelected(i)}
              disabled={revealed}
              className={cn(
                "w-full text-left rounded-md p-3 text-sm transition-colors bg-secondary/50",
                !revealed && "hover:bg-accent cursor-pointer",
                revealed &&
                !isOptionCorrect &&
                i === selected &&
                "border-destructive bg-destructive/10 text-destructive",
                revealed &&
                isOptionCorrect &&
                "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400",
                revealed && !showResult && "opacity-50",
              )}
            >
              <span className="font-mono mr-2">{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          );
        })}
      </div>

      {revealed && explanation && (
        <div className="rounded-md bg-secondary/70 p-3 text-sm">
          <span className="font-medium">{isCorrect ? "✓ Correct!" : "✗ Not quite."}</span>{" "}
          <Streamdown
            className="inline prose prose-sm dark:prose-invert"
            plugins={streamdownPlugins}
          >
            {explanation}
          </Streamdown>
        </div>
      )}
    </div>
  );
}
