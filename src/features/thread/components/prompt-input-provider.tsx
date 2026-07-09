"use client";

import type { FileUIPart } from "ai";
import { nanoid } from "nanoid";
import {
  use,
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  AttachmentsContext,
  PromptInputControllerProps,
  PromptInputProviderProps,
} from "./prompt-input-types";
import {
  AttachmentsCtx,
  ControllerContext,
} from "./prompt-input-types";
export type { PromptInputProviderProps } from "./prompt-input-types";

// ============================================================================
// Hooks
// ============================================================================

export const usePromptInputController = () => {
  const ctx = use(ControllerContext);
  if (!ctx) {
    throw new Error(
      "Wrap your component inside <PromptInputProvider> to use usePromptInputController().",
    );
  }
  return ctx;
};

export const usePromptInputAttachments = () => {
  const ctx = use(AttachmentsCtx);
  if (!ctx) {
    throw new Error(
      "usePromptInputAttachments must be used within a PromptInputProvider",
    );
  }
  return ctx;
};

// ============================================================================
// Provider
// ============================================================================

export const PromptInputProvider = ({
  initialInput: initialTextInput = "",
  children,
}: PromptInputProviderProps) => {
  const [textInput, setTextInput] = useState(initialTextInput);
  const clearInput = () => setTextInput("");

  const [attachmentFiles, setAttachmentFiles] = useState<(FileUIPart & { id: string })[]>([]);

  const add = (files: File[] | FileList) => {
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
  };

  const remove = (id: string) => {
    setAttachmentFiles((prev) => {
      const found = prev.find((f) => f.id === id);
      if (found?.url) URL.revokeObjectURL(found.url);
      return prev.filter((f) => f.id !== id);
    });
  };

  const clear = () => {
    setAttachmentFiles((prev) => {
      for (const f of prev) {
        if (f.url) URL.revokeObjectURL(f.url);
      }
      return [];
    });
  };

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

  const attachments: AttachmentsContext = { add, clear, files: attachmentFiles, remove };

  const controller: PromptInputControllerProps = {
    attachments,
    textInput: { clear: clearInput, setInput: setTextInput, value: textInput },
  };

  return (
    <ControllerContext.Provider value={controller}>
      <AttachmentsCtx.Provider value={attachments}>
        {children}
      </AttachmentsCtx.Provider>
    </ControllerContext.Provider>
  );
};
