import { getRequestHeader } from "@tanstack/react-start/server";
import { Cause, Effect, Predicate, Result } from "effect";
import { logJson } from "./logger";

const DEFAULT_MESSAGE = "Something went wrong. Please try again.";

function describeError(error: unknown): { tag?: string; message?: string; cause: string } {
  if (Predicate.hasProperty(error, "_tag")) {
    const message =
      Predicate.hasProperty(error, "message") && typeof error.message === "string"
        ? error.message
        : undefined;
    const cause = Predicate.isError(error) ? error.stack || error.message : String(error);
    return { tag: String(error._tag), message, cause };
  }

  if (Predicate.isError(error)) {
    return { message: error.message, cause: error.stack || error.message };
  }

  return { cause: String(error) };
}

/**
 * Effect pipeline that catches typed errors, logs them, and re-throws as
 * user-facing Error. Use inside Effect.gen pipelines at the RPC boundary.
 *
 * The errorMap must contain entries for all error tags in the effect's error
 * channel. This ensures exhaustive handling at the type level.
 *
 * Usage:
 *   .pipe(rpcErrorPipe({ SomeError: "User message", OtherError: "Other message" }))
 */
export function rpcErrorPipe<E extends { readonly _tag: string }>(
  errorMap: Record<E["_tag"], string>,
) {
  return Effect.catchCause((cause) => {
    const requestId = getRequestHeader("x-request-id") ?? "unknown";
    const path = getRequestHeader("x-path") ?? "";
    const email = getRequestHeader("x-access-email") ?? "";
    const result = Cause.findError(cause);
    const error = Result.isSuccess(result) ? result.success : Cause.squash(cause);
    const { tag, message, cause: causeText } = describeError(error);
    logJson("error", "rpc.error", { requestId, path, email, tag, message, cause: causeText });
    const userMessage = (tag && errorMap[tag as E["_tag"]]) || DEFAULT_MESSAGE;
    return Effect.fail(new Error(userMessage));
  });
}
