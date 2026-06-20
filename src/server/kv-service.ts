import { Effect, Layer } from "effect";
import * as KeyValueStore from "effect/unstable/persistence/KeyValueStore";
import { env } from "cloudflare:workers";

const KV_ERROR = "Unable to access Cloudflare KV";

export const KvLayer = Layer.succeed(
  KeyValueStore.KeyValueStore,
  KeyValueStore.makeStringOnly({
    get: (key: string) =>
      Effect.tryPromise({
        try: () => env.ASTER_KV.get(key).then((v) => v ?? undefined),
        catch: (cause) =>
          new KeyValueStore.KeyValueStoreError({
            method: "get",
            key,
            message: KV_ERROR,
            cause,
          }),
      }),
    set: (key: string, value: string) =>
      Effect.tryPromise({
        try: () => env.ASTER_KV.put(key, value),
        catch: (cause) =>
          new KeyValueStore.KeyValueStoreError({
            method: "set",
            key,
            message: KV_ERROR,
            cause,
          }),
      }),
    remove: (key: string) =>
      Effect.tryPromise({
        try: () => env.ASTER_KV.delete(key),
        catch: (cause) =>
          new KeyValueStore.KeyValueStoreError({
            method: "remove",
            key,
            message: KV_ERROR,
            cause,
          }),
      }),
    clear: Effect.die("Cloudflare KV does not support clear"),
    size: Effect.die("Cloudflare KV does not support size"),
  }),
);
