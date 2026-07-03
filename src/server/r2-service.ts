import { Context, Effect, Layer } from "effect";
import { ArtifactError } from "./errors";

export class R2 extends Context.Service<R2, { bucket: R2Bucket }>()("R2") {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const { env } = yield* Effect.tryPromise({
        try: () => import("cloudflare:workers"),
        catch: () => new Error("Failed to import cloudflare:workers"),
      });
      return { bucket: env.ASTER_R2 };
    }),
  );
}

const fail = (op: string) => (cause: unknown) =>
  new ArtifactError({ message: `R2 ${op}: ${cause}` });

/** Fetch text content from R2 by key. Returns null when the object doesn't exist. */
export function fetchR2Content(
  r2Key: string,
): Effect.Effect<string | null, ArtifactError, R2> {
  return Effect.gen(function* () {
    const { bucket } = yield* R2;
    const obj = yield* Effect.tryPromise({
      try: () => bucket.get(r2Key),
      catch: fail("get"),
    });
    if (!obj) return null;
    return yield* Effect.tryPromise({
      try: () => obj.text(),
      catch: fail("read"),
    });
  });
}

/** Put text content into R2 at the given key. */
export function putR2Content(
  r2Key: string,
  content: string,
): Effect.Effect<void, ArtifactError, R2> {
  return Effect.gen(function* () {
    const { bucket } = yield* R2;
    yield* Effect.tryPromise({
      try: () => bucket.put(r2Key, content),
      catch: fail("put"),
    });
  });
}

/** Delete an object from R2 by key. No-op if the key doesn't exist. */
export function deleteR2Content(
  r2Key: string,
): Effect.Effect<void, ArtifactError, R2> {
  return Effect.gen(function* () {
    const { bucket } = yield* R2;
    yield* Effect.tryPromise({
      try: () => bucket.delete(r2Key),
      catch: fail("delete"),
    });
  });
}
