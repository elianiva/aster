import { appRuntime } from "~/server/app-runtime"
import { createServerFn } from "@tanstack/react-start";
import { Effect, Option, Schema } from "effect";
import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { SettingsService } from "./service"
import {
  Settings,
  DEFAULT_SETTINGS,
  type ProviderWithModels,
} from "~/features/settings/lib/schema";
import { rpcErrorPipe } from "~/server/error-handler"
import { queryKeys } from "~/lib/query-keys"

export const getSettings = createServerFn({ method: "GET" }).handler(async () => {
  return Effect.gen(function*() {
    const settings = yield* SettingsService.use((svc) => svc.get());
    return Option.getOrElse(settings, () => DEFAULT_SETTINGS);
  }).pipe(
    Effect.withSpan("getSettings"),
    rpcErrorPipe({
      ProvidersFetchError: "Failed to load AI providers. Please check your connection.",
      KeyValueStoreError: "Failed to save settings. Please try again.",
      ArtifactError: "Failed to load. Please try again.",
    }),
    appRuntime().runPromise,
  );
});

export const updateSettings = createServerFn({ method: "POST" })
  .validator((data: unknown) => Schema.decodeUnknownSync(Settings)(data))
  .handler(async ({ data }) => {
    return Effect.gen(function*() {
      yield* SettingsService.use((svc) => svc.update(data));
    }).pipe(
      Effect.withSpan("updateSettings"),
      rpcErrorPipe({
        ProvidersFetchError: "Failed to load AI providers. Please check your connection.",
        KeyValueStoreError: "Failed to save settings. Please try again.",
        ArtifactError: "Failed to load. Please try again.",
      }),
      appRuntime().runPromise,
    );
  });

export const fetchProviders = createServerFn({ method: "GET" }).handler(async () => {
  return Effect.gen(function*() {
    return yield* SettingsService.use((svc) => svc.fetchProviders());
  }).pipe(
    Effect.withSpan("fetchProviders"),
    rpcErrorPipe({
      ProvidersFetchError: "Failed to load AI providers. Please check your connection.",
      KeyValueStoreError: "Failed to save settings. Please try again.",
      ArtifactError: "Failed to load. Please try again.",
    }),
    appRuntime().runPromise,
  );
});

export const SettingsRpc = {
  getSettings: () =>
    queryOptions({
      queryKey: queryKeys.settings.all,
      queryFn: (): Promise<Settings> => getSettings(),
    }),
  updateSettings: () =>
    mutationOptions({
      mutationKey: queryKeys.settings.all,
      mutationFn: (input: Settings) => updateSettings({ data: input }),
    }),
  providers: () =>
    queryOptions({
      queryKey: queryKeys.settings.providers(),
      queryFn: (): Promise<ProviderWithModels[]> => fetchProviders(),
    }),
};
