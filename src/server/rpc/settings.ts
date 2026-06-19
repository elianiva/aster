import { createServerFn } from "@tanstack/react-start"
import { Effect } from "effect"
import { Settings } from "~/features/settings/lib/schema"
import { SettingsService } from "../features/settings/service"
import { AppLayer } from "../app-layer"

const runEffect = <A>(effect: Effect.Effect<A, unknown>) =>
  Effect.runPromise(Effect.provide(effect, AppLayer) as Effect.Effect<A, never, never>)

export const getSettings = createServerFn({ method: "GET" }).handler(async () => {
  const program = Effect.gen(function* () {
    const service = yield* SettingsService;
    return yield* service.get();
  })
  return runEffect(program)
})

export const updateSettings = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as Settings)
  .handler(async ({ data }) => {
    const program = Effect.gen(function* () {
      const service = yield* SettingsService;
      return yield* service.update(data);
    })
    return runEffect(program)
  })

export const fetchProviders = createServerFn({ method: "GET" })
  .handler(async () => {
    const program = Effect.gen(function* () {
      const service = yield* SettingsService;
      return yield* service.fetchProviders();
    })
    return runEffect(program)
  })
