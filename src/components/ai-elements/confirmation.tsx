"use client";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import type { ToolUIPart } from "ai";
import { CheckIcon, XIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { createContext, useContext, useMemo } from "react";

interface ConfirmationContextValue {
  approval: NonNullable<ToolUIPart["approval"]>;
  state: ToolUIPart["state"];
}

const ConfirmationContext = createContext<ConfirmationContextValue | null>(null);

function useConfirmation() {
  const ctx = useContext(ConfirmationContext);
  if (!ctx) throw new Error("Confirmation components must be used within <Confirmation>");
  return ctx;
}

export type ConfirmationProps = ComponentProps<"div"> & {
  approval: ToolUIPart["approval"];
  state: ToolUIPart["state"];
};

export const Confirmation = ({ approval, state, className, children, ...props }: ConfirmationProps) => {
  if (!approval) return null;
  if (state === "input-streaming" || state === "input-available") return null;

  const value = useMemo(() => ({ approval, state }), [approval, state]);
  return (
    <ConfirmationContext.Provider value={value}>
      <div
        data-slot="confirmation"
        role="alert"
        className={cn("rounded-lg border bg-card p-3 text-sm", className)}
        {...props}
      >
        {children}
      </div>
    </ConfirmationContext.Provider>
  );
};

export const ConfirmationTitle = ({ className, children, ...props }: ComponentProps<"div">) => (
  <div data-slot="confirmation-title" className={cn("mb-1 font-medium", className)} {...props}>
    {children}
  </div>
);

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
      <CheckIcon className="size-4" />
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
      <XIcon className="size-4" />
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
