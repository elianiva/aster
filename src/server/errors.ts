import { Schema, Cause } from "effect";
import { logJson } from "./logger";
import type { RequestContext } from "./request-context";

const DEFAULT_MESSAGE = "Something went wrong. Please try again.";

export class ProvidersFetchError extends Schema.TaggedErrorClass<ProvidersFetchError>()("ProvidersFetchError", {
  cause: Schema.Defect(),
}) {}

/** A read against D1/R2 for an artifact (lesson, record, note, reference, ...) failed. */
export class ArtifactQueryFailed extends Schema.TaggedErrorClass<ArtifactQueryFailed>()("ArtifactQueryFailed", {
  message: Schema.String,
}) {}

/**
 * Pull the structured detail out of whatever the Effect runtime threw.
 * `runPromise` rejects with the squashed failure directly (the tagged error
 * itself, carrying `_tag` / `message` / `stack`), but a few paths surface a
 * `FiberFailure` wrapping a `Cause` — handle both.
 */
function describeError(error: unknown): { tag?: string; message?: string; cause: string } {
  if (error && typeof error === "object") {
    const e = error as { _tag?: string; message?: string; stack?: string; cause?: unknown };

    if (e._tag === "FiberFailure" && e.cause && typeof e.cause === "object") {
      const cause = e.cause as Cause.Cause<unknown>;
      const failure = Cause.squash(cause) as { _tag?: string; message?: string };
      return { tag: failure._tag, message: failure.message, cause: Cause.pretty(cause) };
    }

    const detail = [
      e.message,
      e.cause !== undefined ? `cause: ${String(e.cause)}` : undefined,
      e.stack,
    ]
      .filter(Boolean)
      .join("\n");
    return { tag: e._tag, message: e.message, cause: detail || String(error) };
  }
  return { cause: String(error) };
}

/**
 * Build a per-RPC error handler. Returns a function that closes over the
 * request context (for log correlation) and converts tagged errors into
 * user-facing messages, logging the full cause — never just the tag.
 */
export function createErrorHandler(errorMap: Record<string, string>) {
  return (ctx: RequestContext) => (error: unknown): never => {
    const { tag, message, cause } = describeError(error);
    logJson("error", "rpc.error", { requestId: ctx.requestId, path: ctx.path, email: ctx.email, tag, message, cause });
    const userMessage = (tag && errorMap[tag]) || DEFAULT_MESSAGE;
    throw new Error(userMessage);
  };
}
