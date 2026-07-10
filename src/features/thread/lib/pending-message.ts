import type { FileUIPart } from "ai";

/**
 * Stores the first message when creating a new thread from the empty state.
 * Uses sessionStorage so the data is tab-scoped, survives route transitions,
 * and auto-clears on tab close — no module-level mutable state.
 *
 * IMPORTANT: peekPendingMessage() keeps the message in storage so it
 * survives React Strict Mode double-mount. Call clearPendingMessage() only
 * AFTER the message has been sent (or the send attempt conclusively fails).
 */
export interface PendingMessage {
  text: string;
  files: FileUIPart[];
}

const STORAGE_KEY = "aster:pending-message:v1";

export function setPendingMessage(msg: PendingMessage): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(msg));
}

export function peekPendingMessage(): PendingMessage | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingMessage;
  } catch {
    return null;
  }
}

export function clearPendingMessage(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
