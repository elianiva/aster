import { createServerFn } from "@tanstack/react-start"
import { env } from "cloudflare:workers"
import { Effect, Layer, Schema } from "effect"
import { Settings } from "./schema"
import { SettingsService, SettingsServiceLive, KVService } from "./service"
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient"

const KVServiceLive = Layer.succeed(KVService, {
  get: <A>(key: string, schema: Schema.Schema<A>) =>
    Effect.gen(function*() {
      const value = yield* Effect.tryPromise({
        try: () => env.ASTER_KV.get(key, "json"),
        catch: () => new Error("Failed to read from KV"),
      })
      if (value === null) {
        return yield* Effect.fail(new Error("Key not found"))
      }
      return yield* Schema.decodeUnknownEffect(schema)(value)
    }),
  put: (key: string, value: unknown) =>
    Effect.gen(function*() {
      yield* Effect.tryPromise({
        try: () => env.ASTER_KV.put(key, JSON.stringify(value)),
        catch: () => new Error("Failed to write to KV"),
      })
    })
})

const AppLayer = SettingsServiceLive.pipe(
  Layer.provide([KVServiceLive, FetchHttpClient.layer]),
)

const runEffect = <A, R>(effect: Effect.Effect<A, unknown, R>) =>
  Effect.runPromise(Effect.provide(effect, AppLayer) as Effect.Effect<A, never, never>)

export const getSettings = createServerFn({ method: "GET" }).handler(async () => {
  const program = Effect.gen(function*() {
    const service = yield* SettingsService
    return yield* service.get()
  })
  return runEffect(program)
})

export const updateSettings = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as Settings)
  .handler(async ({ data }) => {
    const program = Effect.gen(function*() {
      const service = yield* SettingsService
      return yield* service.update(data)
    })
    return runEffect(program)
  })

export const fetchProviders = createServerFn({ method: "GET" })
  .handler(async () => {
    const program = Effect.gen(function*() {
      const service = yield* SettingsService
      return yield* service.fetchProviders()
    })
    return runEffect(program)
  })
