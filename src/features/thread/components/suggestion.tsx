"use client";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import type { ComponentProps } from "react";

export type SuggestionsProps = ComponentProps<"div">;

export const Suggestions = ({ className, children, ...props }: SuggestionsProps) => (
  <div
    data-slot="suggestions"
    className={cn("flex w-full gap-2 overflow-x-auto whitespace-nowrap pb-1", className)}
    {...props}
  >
    {children}
  </div>
);

export type SuggestionProps = Omit<ComponentProps<typeof Button>, "onClick"> & {
  suggestion: string;
  onClick: (suggestion: string) => void;
};

export const Suggestion = ({
  suggestion,
  onClick,
  className,
  children,
  ...props
}: SuggestionProps) => {
  const handleClick = () => onClick(suggestion);
  return (
    <Button
      data-slot="suggestion"
      variant="outline"
      size="sm"
      className={cn("shrink-0 rounded-full", className)}
      onClick={handleClick}
      {...props}
    >
      {children ?? suggestion}
    </Button>
  );
};
