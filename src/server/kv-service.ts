import { Effect, Layer } from "effect";
import * as KeyValueStore from "effect/unstable/persistence/KeyValueStore";

const kvError = (method: string, key: string) =>
  `Cloudflare KV ${method} failed for key "${key}"`;

export function makeKvLayer(kv: KVNamespace) {
  return Layer.succeed(
    KeyValueStore.KeyValueStore,
    KeyValueStore.makeStringOnly({
      get: (key: string) =>
        Effect.tryPromise({
          try: () => kv.get(key).then((v) => v ?? undefined),
          catch: (cause) =>
            new KeyValueStore.KeyValueStoreError({
              method: "get",
              key,
              message: kvError("get", key),
              cause,
            }),
        }).pipe(Effect.annotateLogs({ op: "kv.get", key })),
      set: (key: string, value: string) =>
        Effect.tryPromise({
          try: () => kv.put(key, value),
          catch: (cause) =>
            new KeyValueStore.KeyValueStoreError({
              method: "set",
              key,
              message: kvError("set", key),
              cause,
            }),
        }).pipe(Effect.annotateLogs({ op: "kv.set", key })),
      remove: (key: string) =>
        Effect.tryPromise({
          try: () => kv.delete(key),
          catch: (cause) =>
            new KeyValueStore.KeyValueStoreError({
              method: "remove",
              key,
              message: kvError("remove", key),
              cause,
            }),
        }).pipe(Effect.annotateLogs({ op: "kv.remove", key })),
      clear: Effect.die("Cloudflare KV does not support clear"),
      size: Effect.die("Cloudflare KV does not support size"),
    }),
  );
}
