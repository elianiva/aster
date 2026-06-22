import type { FileUIPart } from "ai";

/**
 * Stores the first message when creating a new thread from the empty state.
 * ChatView reads and sends this on mount, then clears it.
 */
export interface PendingMessage {
  text: string;
  files: FileUIPart[];
}

export const pendingMessageRef: { current: PendingMessage | null } = {
  current: null,
};
