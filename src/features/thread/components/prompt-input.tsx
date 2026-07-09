"use client";

import {
  InputGroup,
  InputGroupButton,
  InputGroupTextarea,
} from "~/components/ui/input-group";
import {
  Attachment,
  AttachmentMedia,
  AttachmentActions,
  AttachmentAction,
} from "~/components/ui/attachment";
import { Spinner } from "~/components/ui/spinner";
import { cn } from "~/lib/utils";
import type { ChatStatus, FileUIPart } from "ai";
import { SendingOrderIcon, SquareIcon, XVariableIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type {
  ChangeEvent,
  ComponentProps,
  FormEvent,
  FormEventHandler,
  KeyboardEventHandler,
  ClipboardEventHandler,
} from "react";
import React, { useCallback, useEffect, useRef } from "react";

import { convertFilesForSubmission, matchesAcceptFilter } from "./prompt-input-helpers";
import { ControllerContext } from "./prompt-input-types";
import {
  usePromptInputController,
  usePromptInputAttachments,
} from "./prompt-input-provider";

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
  onError?: (err: { code: "max_files" | "max_file_size" | "accept"; message: string }) => void;
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
  const controller = usePromptInputController();
  const { textInput, attachments } = controller;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const openFileDialog = () => {
    inputRef.current?.click();
  };

  const enhancedController = { ...controller, openFileDialog };

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
          typeof maxFiles === "number" ? Math.max(0, maxFiles - currentCount) : undefined;
        const capped = typeof capacity === "number" ? sized.slice(0, capacity) : sized;

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
      [accept, onError, attachments],
    );

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

  const handleChange =
    (event: ChangeEvent<HTMLInputElement>) => {
      if (event.currentTarget.files) {
        addFiles(event.currentTarget.files);
      }
      event.currentTarget.value = "";
    };

  const handleSubmit: FormEventHandler<HTMLFormElement> =
    async (event) => {
      event.preventDefault();
      const text = textInput.value;
      try {
        const convertedFiles = await convertFilesForSubmission(attachments.files);
        const result = onSubmit({ files: convertedFiles, text }, event);
        if (result instanceof Promise) await result;
        textInput.clear();
        attachments.clear();
      } catch (error) {
        console.error("Submit failed:", error);
      }
    };

  return (
    <ControllerContext.Provider value={enhancedController}>
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
          className={cn("mx-auto flex w-full max-w-3xl flex-col gap-2", className)}
          onSubmit={handleSubmit}
          ref={formRef}
          {...props}
        >
          <InputGroup className="flex-wrap border border-border bg-card p-2 transition-shadow focus-within:ring-2 focus-within:ring-ring/30 rounded-[2rem]!">
            {children}
          </InputGroup>
        </form>
      </>
    </ControllerContext.Provider>
  );
};

// ============================================================================
// PromptInputAttachments
// ============================================================================

export type PromptInputAttachmentsProps = React.HTMLAttributes<HTMLDivElement>;

export const PromptInputAttachments = ({ className, ...props }: PromptInputAttachmentsProps) => {
  const { files, remove } = usePromptInputAttachments();

  if (files.length === 0) return null;

  return (
    <div className={cn("order-first flex flex-wrap gap-2 w-full pb-2", className)} {...props}>
      {files.map((file) => {
        const isImage = file.mediaType?.startsWith("image/");
        return (
          <Attachment key={file.id} orientation="vertical" size="xs">
            <AttachmentMedia variant={isImage ? "image" : "icon"}>
              {isImage && file.url ? (
                <img
                  alt={file.filename || "Image"}
                  className="size-full object-cover"
                  src={file.url}
                />
              ) : (
                <span className="text-xs font-medium uppercase">
                  {file.mediaType?.split("/")[1] ?? "file"}
                </span>
              )}
            </AttachmentMedia>
            <AttachmentActions>
              <AttachmentAction onClick={() => remove(file.id)} aria-label="Remove">
                <HugeiconsIcon icon={XVariableIcon} className="size-3" />
              </AttachmentAction>
            </AttachmentActions>
          </Attachment>
        );
      })}
    </div>
  );
};

// ============================================================================
// PromptInputTextarea
// ============================================================================

export type PromptInputTextareaProps = ComponentProps<typeof InputGroupTextarea> & {
  disabled?: boolean;
};

export const PromptInputTextarea = ({
  onChange,
  onKeyDown,
  className,
  placeholder = "What would you like to know?",
  disabled,
  ...props
}: PromptInputTextareaProps) => {
  const { textInput } = usePromptInputController();
  const attachments = usePromptInputAttachments();
  const isComposingRef = useRef(false);

  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> =
    (e) => {
      onKeyDown?.(e);
      if (e.defaultPrevented) return;

      if (e.key === "Enter") {
        if (isComposingRef.current || e.nativeEvent.isComposing) return;
        if (e.shiftKey) return;
        e.preventDefault();

        const submitButton = e.currentTarget.form?.querySelector(
          'button[type="submit"]',
        ) as HTMLButtonElement | null;
        if (submitButton?.disabled) return;

        e.currentTarget.form?.requestSubmit();
      }

      if (e.key === "Backspace" && e.currentTarget.value === "" && attachments.files.length > 0) {
        e.preventDefault();
        const last = attachments.files.at(-1);
        if (last) attachments.remove(last.id);
      }
    };

  const handlePaste: ClipboardEventHandler<HTMLTextAreaElement> =
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
    };

  return (
    <InputGroupTextarea
      className={cn(
        "field-sizing-content max-h-48 min-h-0",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
      name="message"
      onCompositionEnd={() => { isComposingRef.current = false; }}
      onCompositionStart={() => { isComposingRef.current = true; }}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      placeholder={placeholder}
      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
        textInput.setInput(e.currentTarget.value);
        onChange?.(e);
      }}
      value={textInput.value}
      disabled={disabled}
      readOnly={disabled}
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
  const newSize = size ?? (React.Children.count(props.children) > 1 ? "sm" : "icon-sm");

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
  let Icon = <HugeiconsIcon icon={SendingOrderIcon} className="size-5" />;
  if (status === "submitted") {
    Icon = <Spinner />;
  } else if (status === "streaming") {
    Icon = <HugeiconsIcon icon={SquareIcon} className="size-5" />;
  } else if (status === "error") {
    Icon = <HugeiconsIcon icon={XVariableIcon} className="size-5" />;
  }

  const handleClick =
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isGenerating && onStop) {
        e.preventDefault();
        onStop();
        return;
      }
      onClick?.(e as React.MouseEvent<HTMLButtonElement> & { preventBaseUIHandler: () => void });
    };

  return (
    <InputGroupButton
      aria-label={isGenerating ? "Stop" : "Submit"}
      className={cn(
        "size-10 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50",
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
