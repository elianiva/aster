import { Context, Effect, Layer } from "effect";
import { PersistenceError } from "./errors";

const fail = (op: string) => (cause: unknown) =>
  new PersistenceError({ service: "r2", message: `${op}: ${cause}` });

export class R2 extends Context.Service<R2>()("R2", {
  make: (bucket: R2Bucket) =>
    Effect.sync(() => ({
      fetch: (r2Key: string): Effect.Effect<string | null, PersistenceError> =>
        Effect.gen(function* () {
          const obj = yield* Effect.tryPromise({
            try: () => bucket.get(r2Key),
            catch: fail("get"),
          });
          if (!obj) return null;
          return yield* Effect.tryPromise({
            try: () => obj.text(),
            catch: fail("read"),
          });
        }),

      put: (r2Key: string, content: string): Effect.Effect<void, PersistenceError> =>
        Effect.tryPromise({
          try: () => bucket.put(r2Key, content),
          catch: fail("put"),
        }),

      delete: (r2Key: string): Effect.Effect<void, PersistenceError> =>
        Effect.tryPromise({
          try: () => bucket.delete(r2Key),
          catch: fail("delete"),
        }),
    })),
}) {
  static layer = (bucket: R2Bucket) => Layer.effect(this, this.make(bucket));
}
