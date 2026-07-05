import { createServerFn } from "@tanstack/react-start";
import { Effect, Option, Schema } from "effect";
import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { Settings, DEFAULT_SETTINGS } from "~/features/settings/lib/schema";
import { createErrorHandler } from "../error-handler";

const onError = createErrorHandler({
  ProvidersFetchError: "Failed to load AI providers. Please check your connection.",
  KeyValueStoreError: "Failed to save settings. Please try again.",
  ArtifactError: "Failed to load. Please try again.",
});

export const getSettings = createServerFn({ method: "GET" }).handler(async () => {
  // Lazy-import: transitive dep on cloudflare:workers — must not load on client
  const { AppRuntime } = await import("../app-runtime");
  const { SettingsService } = await import("../features/settings/service");
  return AppRuntime.runPromise(
    Effect.gen(function*() {
      yield* Effect.log("getSettings");
      const service = yield* SettingsService;
      const settings = yield* service.get();
      return Option.getOrElse(settings, () => DEFAULT_SETTINGS);
    }).pipe(Effect.withSpan("getSettings")),
  ).catch(onError);
});

export const updateSettings = createServerFn({ method: "POST" })
  .validator((data: unknown) => Schema.decodeUnknownSync(Settings)(data))
  .handler(async ({ data }) => {
    // Lazy-import: transitive dep on cloudflare:workers — must not load on client
    const { AppRuntime } = await import("../app-runtime");
    const { SettingsService } = await import("../features/settings/service");
    return AppRuntime.runPromise(
      Effect.gen(function*() {
        yield* Effect.log("updateSettings");
        const service = yield* SettingsService;
        yield* service.update(data);
      }).pipe(Effect.withSpan("updateSettings")),
    ).catch(onError);
  });

export const fetchProviders = createServerFn({ method: "GET" }).handler(async () => {
  // Lazy-import: transitive dep on cloudflare:workers — must not load on client
  const { AppRuntime } = await import("../app-runtime");
  const { SettingsService } = await import("../features/settings/service");
  return AppRuntime.runPromise(
    Effect.gen(function*() {
      yield* Effect.log("fetchProviders");
      const service = yield* SettingsService;
      return yield* service.fetchProviders();
    }).pipe(Effect.withSpan("fetchProviders")),
  ).catch(onError);
});

export const SettingsRpc = {
  settings: () => ["settings"],
  getSettings: () =>
    queryOptions({
      queryKey: [...SettingsRpc.settings()],
      queryFn: () => getSettings(),
    }),
  updateSettings: () =>
    mutationOptions({
      mutationKey: [...SettingsRpc.settings()],
      mutationFn: (input: Settings) => updateSettings({ data: input }),
    }),
  providers: () =>
    queryOptions({
      queryKey: [...SettingsRpc.settings(), "providers"],
      queryFn: () => fetchProviders(),
    }),
};
