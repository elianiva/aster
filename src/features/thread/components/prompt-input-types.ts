import type { FileUIPart } from "ai";
import { createContext } from "react";

// ============================================================================
// Types
// ============================================================================

export interface AttachmentsContext {
  files: (FileUIPart & { id: string })[];
  add: (files: File[] | FileList) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export interface TextInputContext {
  value: string;
  setInput: (v: string) => void;
  clear: () => void;
}

export interface PromptInputControllerProps {
  textInput: TextInputContext;
  attachments: AttachmentsContext;
  openFileDialog?: () => void;
}

export type PromptInputProviderProps = {
  children: React.ReactNode;
  initialInput?: string;
};

// ============================================================================
// Contexts
// ============================================================================

export const ControllerContext = createContext<PromptInputControllerProps | null>(null);

export const AttachmentsCtx = createContext<AttachmentsContext | null>(null);
