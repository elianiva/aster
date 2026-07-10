import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { PromptInputButton, usePromptInputController } from "./prompt-input";

export function AttachmentButton({ disabled }: { disabled?: boolean }) {
  const { openFileDialog } = usePromptInputController();
  return (
    <PromptInputButton aria-label="Add attachment" onClick={openFileDialog} disabled={disabled}>
      <HugeiconsIcon icon={PlusSignIcon} className="size-5" />
    </PromptInputButton>
  );
}
