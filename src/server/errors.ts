import { Schema, Cause } from "effect";
import { logJson } from "./logger";
import { getRequestContext } from "./request-context";

const DEFAULT_MESSAGE = "Something went wrong. Please try again.";

export class ProvidersFetchError extends Schema.TaggedErrorClass<ProvidersFetchError>()("ProvidersFetchError", {
  cause: Schema.Defect(),
}) {}

/** Any R2 or D1 operation on an artifact failed. */
export class ArtifactError extends Schema.TaggedErrorClass<ArtifactError>()("ArtifactError", {
  message: Schema.String,
}) {}

export class WorkspaceNotFound extends Schema.TaggedErrorClass<WorkspaceNotFound>()("WorkspaceNotFound", {
  message: Schema.String,
}) {}

export class WorkspacePersistenceFailed extends Schema.TaggedErrorClass<WorkspacePersistenceFailed>()("WorkspacePersistenceFailed", {
  message: Schema.String,
}) {}

export class ThreadNotFound extends Schema.TaggedErrorClass<ThreadNotFound>()("ThreadNotFound", {
  message: Schema.String,
}) {}

export class ThreadPersistenceFailed extends Schema.TaggedErrorClass<ThreadPersistenceFailed>()("ThreadPersistenceFailed", {
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
 * Build an RPC error handler. Reads request context from AsyncLocalStorage
 * (populated by server.ts) for log correlation. Converts tagged errors into
 * user-facing messages while logging the full cause.
 */
export function createErrorHandler(errorMap: Record<string, string>) {
  return (error: unknown): never => {
    const ctx = getRequestContext();
    const { tag, message, cause } = describeError(error);
    logJson("error", "rpc.error", { requestId: ctx.requestId, path: ctx.path, email: ctx.email, tag, message, cause });
    const userMessage = (tag && errorMap[tag]) || DEFAULT_MESSAGE;
    throw new Error(userMessage);
  };
}
