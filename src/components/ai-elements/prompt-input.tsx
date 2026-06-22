"use client";

import {
  InputGroup,
  InputGroupButton,
  InputGroupTextarea,
} from "~/components/ui/input-group";
import { Spinner } from "~/components/ui/spinner";
import { cn } from "~/lib/utils";
import {
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "~/components/ai-elements/attachments";
import type { ChatStatus, FileUIPart } from "ai";
import { SendIcon, SquareIcon, XIcon } from "lucide-react";
import type {
  ChangeEvent,
  ComponentProps,
  FormEvent,
  FormEventHandler,
  KeyboardEventHandler,
  ClipboardEventHandler,
} from "react";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { Effect } from "effect";
import {
  convertFilesForSubmission,
  matchesAcceptFilter,
} from "./prompt-input-helpers";
import {
  usePromptInputController,
  usePromptInputAttachments,
  useConnectFileInput,
} from "./prompt-input-provider";

// Re-export provider and hooks for consumers
export {
  PromptInputProvider,
  usePromptInputController,
  usePromptInputAttachments,
} from "./prompt-input-provider";

// ============================================================================
// Types
// ============================================================================

export interface PromptInputMessage {
  text: string;
  files: FileUIPart[];
}

// ============================================================================
// PromptInput (core form)
// ============================================================================

export type PromptInputProps = Omit<
  React.HTMLAttributes<HTMLFormElement>,
  "onSubmit" | "onError"
> & {
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxFileSize?: number;
  onError?: (err: {
    code: "max_files" | "max_file_size" | "accept";
    message: string;
  }) => void;
  onSubmit: (
    message: PromptInputMessage,
    event: FormEvent<HTMLFormElement>,
  ) => void | Promise<void>;
};

export const PromptInput = ({
  className,
  accept = "",
  multiple,
  maxFiles,
  maxFileSize,
  onError,
  onSubmit,
  children,
  ...props
}: PromptInputProps) => {
  const { textInput, attachments } = usePromptInputController();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  // Connect hidden file input to provider so openFileDialog works
  const openFileDialogLocal = useCallback(() => {
    inputRef.current?.click();
  }, []);
  useConnectFileInput(openFileDialogLocal);

  // Validate and add files
  const addFiles = useCallback(
    (fileList: File[] | FileList) => {
      const incoming = [...fileList];
      const accepted = incoming.filter((f) => matchesAcceptFilter(f, accept));

      if (incoming.length && accepted.length === 0) {
        onError?.({
          code: "accept",
          message: "No files match the accepted types.",
        });
        return;
      }

      const withinSize = (f: File) => (maxFileSize ? f.size <= maxFileSize : true);
      const sized = accepted.filter(withinSize);

      if (accepted.length > 0 && sized.length === 0) {
        onError?.({
          code: "max_file_size",
          message: "All files exceed the maximum size.",
        });
        return;
      }

      const currentCount = attachments.files.length;
      const capacity =
        typeof maxFiles === "number"
          ? Math.max(0, maxFiles - currentCount)
          : undefined;
      const capped =
        typeof capacity === "number" ? sized.slice(0, capacity) : sized;

      if (typeof capacity === "number" && sized.length > capacity) {
        onError?.({
          code: "max_files",
          message: "Too many files. Some were not added.",
        });
      }

      if (capped.length > 0) {
        attachments.add(capped);
      }
    },
    [accept, maxFileSize, maxFiles, onError, attachments],
  );

  // Drag and drop
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const onDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes("Files")) {
        e.preventDefault();
      }
    };
    const onDrop = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes("Files")) {
        e.preventDefault();
      }
      if (e.dataTransfer?.files?.length) {
        addFiles(e.dataTransfer.files);
      }
    };

    form.addEventListener("dragover", onDragOver);
    form.addEventListener("drop", onDrop);
    return () => {
      form.removeEventListener("dragover", onDragOver);
      form.removeEventListener("drop", onDrop);
    };
  }, [addFiles]);

  // File input change
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (event.currentTarget.files) {
        addFiles(event.currentTarget.files);
      }
      event.currentTarget.value = "";
    },
    [addFiles],
  );

  // Submit
  const handleSubmit: FormEventHandler<HTMLFormElement> = useCallback(
    (event) => {
      event.preventDefault();
      const text = textInput.value;

      Effect.gen(function* () {
        const convertedFiles = yield* Effect.tryPromise({
          try: () => convertFilesForSubmission(attachments.files),
          catch: (error) => new Error(`File conversion failed: ${String(error)}`),
        });

        const result = onSubmit({ files: convertedFiles, text }, event);

        if (result instanceof Promise) {
          yield* Effect.tryPromise({
            try: () => result,
            catch: (error) => new Error(`Submit failed: ${String(error)}`),
          });
        }

        textInput.clear();
        attachments.clear();
      }).pipe(
        Effect.catchDefect((defect) => Effect.logError(String(defect))),
        Effect.runPromise,
      );
    },
    [textInput, attachments, onSubmit],
  );

  return (
    <>
      <input
        accept={accept}
        aria-label="Upload files"
        className="hidden"
        multiple={multiple}
        onChange={handleChange}
        ref={inputRef}
        title="Upload files"
        type="file"
      />
      <form
        className={cn(
          "mx-auto flex w-full max-w-3xl flex-col gap-2",
          className,
        )}
        onSubmit={handleSubmit}
        ref={formRef}
        {...props}
      >
        <InputGroup className="flex-wrap border border-border bg-card px-3 py-2 transition-shadow focus-within:ring-2 focus-within:ring-ring/30 rounded-[2rem]!">
          {children}
        </InputGroup>
      </form>
    </>
  );
};

// ============================================================================
// PromptInputAttachments
// ============================================================================

export type PromptInputAttachmentsProps = React.HTMLAttributes<HTMLDivElement>;

export const PromptInputAttachments = ({
  className,
  ...props
}: PromptInputAttachmentsProps) => {
  const { files, remove } = usePromptInputAttachments();

  if (files.length === 0) return null;

  return (
    <div className={cn("order-first w-full pb-2", className)} {...props}>
      <Attachments variant="grid">
        {files.map((file) => (
          <Attachment
            key={file.id}
            className="size-20"
            data={file}
            onRemove={() => remove(file.id)}
          >
            <AttachmentPreview />
            <AttachmentRemove />
          </Attachment>
        ))}
      </Attachments>
    </div>
  );
};

// ============================================================================
// PromptInputTextarea
// ============================================================================

export type PromptInputTextareaProps = ComponentProps<typeof InputGroupTextarea>;

export const PromptInputTextarea = ({
  onChange,
  onKeyDown,
  className,
  placeholder = "What would you like to know?",
  ...props
}: PromptInputTextareaProps) => {
  const { textInput } = usePromptInputController();
  const attachments = usePromptInputAttachments();
  const [isComposing, setIsComposing] = useState(false);

  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = useCallback(
    (e) => {
      onKeyDown?.(e);
      if (e.defaultPrevented) return;

      if (e.key === "Enter") {
        if (isComposing || e.nativeEvent.isComposing) return;
        if (e.shiftKey) return;
        e.preventDefault();

        const submitButton = e.currentTarget.form?.querySelector(
          'button[type="submit"]',
        ) as HTMLButtonElement | null;
        if (submitButton?.disabled) return;

        e.currentTarget.form?.requestSubmit();
      }

      if (
        e.key === "Backspace" &&
        e.currentTarget.value === "" &&
        attachments.files.length > 0
      ) {
        e.preventDefault();
        const last = attachments.files.at(-1);
        if (last) attachments.remove(last.id);
      }
    },
    [onKeyDown, isComposing, attachments],
  );

  const handlePaste: ClipboardEventHandler<HTMLTextAreaElement> = useCallback(
    (event) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      const files: File[] = [];
      for (const item of items) {
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }

      if (files.length > 0) {
        event.preventDefault();
        attachments.add(files);
      }
    },
    [attachments],
  );

  return (
    <InputGroupTextarea
      className={cn("field-sizing-content max-h-48 min-h-0", className)}
      name="message"
      onCompositionEnd={() => setIsComposing(false)}
      onCompositionStart={() => setIsComposing(true)}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      placeholder={placeholder}
      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
        textInput.setInput(e.currentTarget.value);
        onChange?.(e);
      }}
      value={textInput.value}
      {...props}
    />
  );
};

// ============================================================================
// PromptInputButton
// ============================================================================

export type PromptInputButtonProps = ComponentProps<typeof InputGroupButton> & {
  tooltip?: string;
};

export const PromptInputButton = ({
  variant = "ghost",
  className,
  size,
  ...props
}: PromptInputButtonProps) => {
  const newSize =
    size ?? (React.Children.count(props.children) > 1 ? "sm" : "icon-sm");

  return (
    <InputGroupButton
      className={cn("rounded-full", className)}
      size={newSize}
      type="button"
      variant={variant}
      {...props}
    />
  );
};

// ============================================================================
// PromptInputSubmit
// ============================================================================

export type PromptInputSubmitProps = ComponentProps<typeof InputGroupButton> & {
  status?: ChatStatus;
  onStop?: () => void;
};

export const PromptInputSubmit = ({
  className,
  variant = "default",
  size = "icon-sm",
  status,
  onStop,
  onClick,
  children,
  ...props
}: PromptInputSubmitProps) => {
  const isGenerating = status === "submitted" || status === "streaming";

  let Icon = <SendIcon className="size-4" />;
  if (status === "submitted") {
    Icon = <Spinner />;
  } else if (status === "streaming") {
    Icon = <SquareIcon className="size-4" />;
  } else if (status === "error") {
    Icon = <XIcon className="size-4" />;
  }

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isGenerating && onStop) {
        e.preventDefault();
        onStop();
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onClick?.(e as any);
    },
    [isGenerating, onStop, onClick],
  );

  return (
    <InputGroupButton
      aria-label={isGenerating ? "Stop" : "Submit"}
      className={cn(
        "rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50",
        className,
      )}
      onClick={handleClick}
      size={size}
      type={isGenerating && onStop ? "button" : "submit"}
      variant={variant}
      {...props}
    >
      {children ?? Icon}
    </InputGroupButton>
  );
};
