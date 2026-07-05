import { getRequestHeader } from "@tanstack/react-start/server";
import { Cause, Predicate, Result } from "effect";
import { logJson } from "./logger";

const DEFAULT_MESSAGE = "Something went wrong. Please try again.";

function describeError(error: unknown): { tag?: string; message?: string; cause: string } {
  // FiberFailure from runSync: Error wrapping a typed Cause
  if (Predicate.isError(error) && "cause" in error && Cause.isCause(error.cause)) {
    const result = Cause.findError(error.cause);
    if (Result.isSuccess(result) && Predicate.hasProperty(result.success, "_tag")) {
      return { tag: String(result.success._tag), cause: Cause.pretty(error.cause) };
    }
    return { message: error.message, cause: Cause.pretty(error.cause) };
  }

  // runPromise throws Cause.squash — tagged errors arrive as their instance
  if (Predicate.hasProperty(error, "_tag")) {
    const message = Predicate.hasProperty(error, "message") && typeof error.message === "string" ? error.message : undefined;
    const cause = Predicate.isError(error) ? (error.stack || error.message) : String(error);
    return { tag: String(error._tag), message, cause };
  }

  if (Predicate.isError(error)) {
    return { message: error.message, cause: error.stack || error.message };
  }

  return { cause: String(error) };
}

/**
 * Build an RPC error handler. Reads request headers set by server.ts for log
 * correlation. Converts tagged errors into user-facing messages while logging
 * the full cause.
 */
export function createErrorHandler(errorMap: Record<string, string>) {
  return (error: unknown): never => {
    const requestId = getRequestHeader("x-request-id") ?? "unknown";
    const path = getRequestHeader("x-path") ?? "";
    const email = getRequestHeader("x-access-email") ?? "";
    const { tag, message, cause } = describeError(error);
    logJson("error", "rpc.error", { requestId, path, email, tag, message, cause });
    const userMessage = (tag && errorMap[tag]) || DEFAULT_MESSAGE;
    throw new Error(userMessage);
  };
}
