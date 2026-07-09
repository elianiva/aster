import type { FileUIPart } from "ai";

/**
 * Stores the first message when creating a new thread from the empty state.
 * Uses sessionStorage so the data is tab-scoped, survives route transitions,
 * and auto-clears on tab close — no module-level mutable state.
 */
export interface PendingMessage {
  text: string;
  files: FileUIPart[];
}

const STORAGE_KEY = "aster:pending-message:v1";

export function setPendingMessage(msg: PendingMessage): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(msg));
}

export function consumePendingMessage(): PendingMessage | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(STORAGE_KEY);
  try {
    return JSON.parse(raw) as PendingMessage;
  } catch {
    return null;
  }
}
