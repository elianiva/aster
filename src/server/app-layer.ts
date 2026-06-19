import { Context, Effect, Layer, Schema } from "effect";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";
import { env } from "cloudflare:workers";

import { DatabaseLive } from "./db/client";
import { SettingsServiceLive } from "./features/settings/service";

// Shared KV service — lives here so all features can use it
export interface KVService {
  readonly get: <A>(key: string, schema: Schema.Schema<A>) => Effect.Effect<A, unknown, unknown>;
  readonly put: (key: string, value: unknown) => Effect.Effect<void, unknown, unknown>;
}

export const KVService = Context.Service<KVService>("KVService");

const KVServiceLive = Layer.succeed(KVService, {
  get: <A>(key: string, schema: Schema.Schema<A>) =>
    Effect.gen(function* () {
      const value = yield* Effect.tryPromise({
        try: () => env.ASTER_KV.get(key, "json"),
        catch: () => new Error("Failed to read from KV"),
      });
      if (value === null) {
        return yield* Effect.fail(new Error("Key not found"));
      }
      return yield* Schema.decodeUnknownEffect(schema)(value);
    }),
  put: (key: string, value: unknown) =>
    Effect.gen(function* () {
      yield* Effect.tryPromise({
        try: () => env.ASTER_KV.put(key, JSON.stringify(value)),
        catch: () => new Error("Failed to write to KV"),
      });
    }),
});

export const AppLayer = Layer.mergeAll(
  DatabaseLive,
  FetchHttpClient.layer,
  KVServiceLive,
  SettingsServiceLive,
);

export const AppLayerTest = Layer.mergeAll(
  DatabaseLive,
  FetchHttpClient.layer,
  KVServiceLive,
  SettingsServiceLive,
);
