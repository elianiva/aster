import { Effect, Layer } from "effect";
import * as KeyValueStore from "effect/unstable/persistence/KeyValueStore";

const kvError = (method: string, key: string) =>
  `Cloudflare KV ${method} failed for key "${key}"`;

// `import { env } from "cloudflare:workers"` at module scope captures the
// binding before the worker env is ready in the Vite dev server.  Access it
// lazily so every KV call reads the live binding.
const getKv = async () => {
  const { env } = await import("cloudflare:workers");
  return env.ASTER_KV;
};

export const KvLayer = Layer.succeed(
  KeyValueStore.KeyValueStore,
  KeyValueStore.makeStringOnly({
    get: (key: string) =>
      Effect.tryPromise({
        try: () => getKv().then((kv) => kv.get(key)).then((v) => v ?? undefined),
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
        try: () => getKv().then((kv) => kv.put(key, value)),
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
        try: () => getKv().then((kv) => kv.delete(key)),
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
