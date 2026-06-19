import { Effect, Layer } from "effect";
import * as KeyValueStore from "effect/unstable/persistence/KeyValueStore";
import { env } from "cloudflare:workers";

const KV_ERROR = "Unable to access Cloudflare KV";

export const KvLayer = Layer.succeed(
  KeyValueStore.KeyValueStore,
  KeyValueStore.makeStringOnly({
    get: (key: string) =>
      Effect.gen(function* () {
        yield* Effect.log(`KV get: ${key}`);
        const value = yield* Effect.tryPromise({
          try: () => env.ASTER_KV.get(key).then((v) => v ?? undefined),
          catch: (cause) =>
            new KeyValueStore.KeyValueStoreError({
              method: "get",
              key,
              message: KV_ERROR,
              cause,
            }),
        });
        yield* value
          ? Effect.log(`KV get hit: ${key}`)
          : Effect.log(`KV get miss: ${key}`);
        return value;
      }).pipe(Effect.tapError((e) => Effect.logError(`KV get failed for ${key}: ${e}`))),
    set: (key: string, value: string) =>
      Effect.gen(function* () {
        yield* Effect.log(`KV set: ${key}`);
        yield* Effect.tryPromise({
          try: () => env.ASTER_KV.put(key, value),
          catch: (cause) =>
            new KeyValueStore.KeyValueStoreError({
              method: "set",
              key,
              message: KV_ERROR,
              cause,
            }),
        });
        yield* Effect.log(`KV set done: ${key}`);
      }).pipe(Effect.tapError((e) => Effect.logError(`KV set failed for ${key}: ${e}`))),
    remove: (key: string) =>
      Effect.gen(function* () {
        yield* Effect.log(`KV remove: ${key}`);
        yield* Effect.tryPromise({
          try: () => env.ASTER_KV.delete(key),
          catch: (cause) =>
            new KeyValueStore.KeyValueStoreError({
              method: "remove",
              key,
              message: KV_ERROR,
              cause,
            }),
        });
        yield* Effect.log(`KV remove done: ${key}`);
      }).pipe(Effect.tapError((e) => Effect.logError(`KV remove failed for ${key}: ${e}`))),
    clear: Effect.die("Cloudflare KV does not support clear"),
    size: Effect.die("Cloudflare KV does not support size"),
  }),
);
