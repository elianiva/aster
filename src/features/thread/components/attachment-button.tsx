import { Plus } from "lucide-react";
import { PromptInputButton, usePromptInputController } from "./prompt-input";

export function AttachmentButton({ disabled }: { disabled?: boolean }) {
  const { openFileDialog } = usePromptInputController();
  return (
    <PromptInputButton aria-label="Add attachment" onClick={openFileDialog} disabled={disabled}>
      <Plus className="size-5" />
    </PromptInputButton>
  );
}
