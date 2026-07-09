"use client";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import type { ToolUIPart } from "ai";
import { CheckIcon, XVariableIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ComponentProps, ReactNode } from "react";
import { createContext, use } from "react";

interface ConfirmationContextValue {
  approval: NonNullable<ToolUIPart["approval"]>;
  state: ToolUIPart["state"];
}

const ConfirmationContext = createContext<ConfirmationContextValue | null>(null);

function useConfirmation() {
  const ctx = use(ConfirmationContext);
  if (!ctx) throw new Error("Confirmation components must be used within <Confirmation>");
  return ctx;
}

export type ConfirmationProps = ComponentProps<"div"> & {
  approval: ToolUIPart["approval"];
  state: ToolUIPart["state"];
};

export const Confirmation = ({ approval, state, className, children, ...props }: ConfirmationProps) => {
  const value = approval ? { approval, state } : null;
  if (!value) return null;
  if (state === "input-streaming" || state === "input-available") return null;

  return (
    <ConfirmationContext.Provider value={value}>
      <div
        data-slot="confirmation"
        role="alert"
        className={cn("rounded-lg bg-muted p-3 text-sm", className)}
        {...props}
      >
        {children}
      </div>
    </ConfirmationContext.Provider>
  );
};

export const ConfirmationRequest = ({ children }: { children: ReactNode }) => {
  const { state } = useConfirmation();
  if (state !== "approval-requested") return null;
  return <div data-slot="confirmation-request">{children}</div>;
};

export const ConfirmationAccepted = ({ children }: { children: ReactNode }) => {
  const { approval, state } = useConfirmation();
  if (state !== "approval-responded" && state !== "output-denied" && state !== "output-available")
    return null;
  if (!approval.approved) return null;
  return (
    <div data-slot="confirmation-accepted" className="flex items-center gap-2 text-success">
      <HugeiconsIcon icon={CheckIcon} className="size-4" />
      <span>{children}</span>
    </div>
  );
};

export const ConfirmationRejected = ({ children }: { children: ReactNode }) => {
  const { approval, state } = useConfirmation();
  if (state !== "approval-responded" && state !== "output-denied" && state !== "output-available")
    return null;
  if (approval.approved) return null;
  return (
    <div data-slot="confirmation-rejected" className="flex items-center gap-2 text-destructive">
      <HugeiconsIcon icon={XVariableIcon} className="size-4" />
      <span>{children}</span>
    </div>
  );
};

export const ConfirmationActions = ({ className, children, ...props }: ComponentProps<"div">) => {
  const { state } = useConfirmation();
  if (state !== "approval-requested") return null;
  return (
    <div data-slot="confirmation-actions" className={cn("mt-2 flex gap-2", className)} {...props}>
      {children}
    </div>
  );
};

export const ConfirmationAction = (props: ComponentProps<typeof Button>) => (
  <Button data-slot="confirmation-action" size="sm" {...props} />
);
