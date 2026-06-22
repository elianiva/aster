"use client";

import type { FileUIPart } from "ai";
import { nanoid } from "nanoid";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// ============================================================================
// Types
// ============================================================================

export interface AttachmentsContext {
  files: (FileUIPart & { id: string })[];
  add: (files: File[] | FileList) => void;
  remove: (id: string) => void;
  clear: () => void;
  openFileDialog: () => void;
}

export interface TextInputContext {
  value: string;
  setInput: (v: string) => void;
  clear: () => void;
}

export interface PromptInputControllerProps {
  textInput: TextInputContext;
  attachments: AttachmentsContext;
}

// ============================================================================
// Contexts
// ============================================================================

const ControllerContext = createContext<PromptInputControllerProps | null>(null);
const AttachmentsCtx = createContext<AttachmentsContext | null>(null);

// Registration context: PromptInput registers its open callback here
const RegistrationCtx = createContext<{
  setOpenCallback: (cb: () => void) => void;
} | null>(null);

// ============================================================================
// Hooks
// ============================================================================

export const usePromptInputController = () => {
  const ctx = useContext(ControllerContext);
  if (!ctx) {
    throw new Error(
      "Wrap your component inside <PromptInputProvider> to use usePromptInputController().",
    );
  }
  return ctx;
};

export const usePromptInputAttachments = () => {
  const ctx = useContext(AttachmentsCtx);
  if (!ctx) {
    throw new Error(
      "usePromptInputAttachments must be used within a PromptInputProvider",
    );
  }
  return ctx;
};

/**
 * Register PromptInput's file dialog opener with the provider.
 * Call once from PromptInput so attachments.openFileDialog() works.
 */
export function useConnectFileInput(open: () => void) {
  const reg = useContext(RegistrationCtx);
  useEffect(() => {
    reg?.setOpenCallback(open);
  }, [reg, open]);
}

// ============================================================================
// Provider
// ============================================================================

export type PromptInputProviderProps = {
  children: React.ReactNode;
  initialInput?: string;
};

export const PromptInputProvider = ({
  initialInput: initialTextInput = "",
  children,
}: PromptInputProviderProps) => {
  const [textInput, setTextInput] = useState(initialTextInput);
  const clearInput = useCallback(() => setTextInput(""), []);

  const [attachmentFiles, setAttachmentFiles] = useState<(FileUIPart & { id: string })[]>([]);

  // Open callback: PromptInput registers via useConnectFileInput
  const openCallbackRef = useRef<() => void>(() => {});

  const setOpenCallback = useCallback((cb: () => void) => {
    openCallbackRef.current = cb;
  }, []);

  const add = useCallback((files: File[] | FileList) => {
    const incoming = [...files];
    if (incoming.length === 0) return;
    setAttachmentFiles((prev) => [
      ...prev,
      ...incoming.map((file) => ({
        filename: file.name,
        id: nanoid(),
        mediaType: file.type,
        type: "file" as const,
        url: URL.createObjectURL(file),
      })),
    ]);
  }, []);

  const remove = useCallback((id: string) => {
    setAttachmentFiles((prev) => {
      const found = prev.find((f) => f.id === id);
      if (found?.url) URL.revokeObjectURL(found.url);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const clear = useCallback(() => {
    setAttachmentFiles((prev) => {
      for (const f of prev) {
        if (f.url) URL.revokeObjectURL(f.url);
      }
      return [];
    });
  }, []);

  const openFileDialog = useCallback(() => {
    openCallbackRef.current();
  }, []);

  // Cleanup on unmount
  const attachmentsRef = useRef(attachmentFiles);
  useEffect(() => {
    attachmentsRef.current = attachmentFiles;
  }, [attachmentFiles]);

  useEffect(
    () => () => {
      for (const f of attachmentsRef.current) {
        if (f.url) URL.revokeObjectURL(f.url);
      }
    },
    [],
  );

  const attachments = useMemo<AttachmentsContext>(
    () => ({
      add,
      clear,
      files: attachmentFiles,
      openFileDialog,
      remove,
    }),
    [attachmentFiles, add, remove, clear, openFileDialog],
  );

  const controller = useMemo<PromptInputControllerProps>(
    () => ({
      attachments,
      textInput: {
        clear: clearInput,
        setInput: setTextInput,
        value: textInput,
      },
    }),
    [textInput, clearInput, attachments],
  );

  const registration = useMemo(() => ({ setOpenCallback }), [setOpenCallback]);

  return (
    <RegistrationCtx.Provider value={registration}>
      <ControllerContext.Provider value={controller}>
        <AttachmentsCtx.Provider value={attachments}>
          {children}
        </AttachmentsCtx.Provider>
      </ControllerContext.Provider>
    </RegistrationCtx.Provider>
  );
};
