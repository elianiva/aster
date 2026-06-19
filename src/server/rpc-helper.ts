import { Cause, Effect } from "effect";

function extractCauseMessage(error: unknown, depth = 0): string {
  if (depth > 5) return "(max depth)";

  const message =
    (error as { message?: string })?.message ??
    (error as { _tag?: string })?._tag ??
    String(error);

  const cause = (error as { cause?: unknown })?.cause;
  if (cause === undefined || cause === null) return message;

  const causeStr = extractCauseMessage(cause, depth + 1);
  if (causeStr === message) return message;
  return `${message}: ${causeStr}`;
}

export interface RpcSuccess<T> {
  readonly success: true;
  readonly data: T;
}

export interface RpcError {
  readonly success: false;
  readonly error: string;
  readonly code?: string;
}

export type RpcResult<T> = RpcSuccess<T> | RpcError;

export const Rpc = {
  ok: <T>(data: T): RpcSuccess<T> => ({ success: true, data }) as const,

  err: (error: string, code?: string): Effect.Effect<RpcError> =>
    Effect.succeed({ success: false, error, ...(code && { code }) } as const),

  notFound: (resource = "Resource"): Effect.Effect<RpcError> =>
    Effect.succeed({ success: false, error: `${resource} not found`, code: "NOT_FOUND" } as const),

  badRequest: (message: string): Effect.Effect<RpcError> =>
    Effect.succeed({ success: false, error: message, code: "BAD_REQUEST" } as const),

  logError:
    (operationName: string) =>
    <TError>(error: TError) =>
      Effect.gen(function* () {
        const message = extractCauseMessage(error);
        yield* Effect.logError("RPC failed", Cause.fail(error)).pipe(
          Effect.annotateLogs({ operation: operationName, error: message }),
        );
      }),
};
