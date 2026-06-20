import { createServerFn } from "@tanstack/react-start";
import { Effect, Option, Schema } from "effect";
import { Settings, DEFAULT_SETTINGS } from "~/features/settings/lib/schema";
import { SettingsService } from "../features/settings/service";
import { AppRuntime } from "../app-runtime";
import { createErrorHandler } from "./errors";

const errorHandler = createErrorHandler({
  ProvidersFetchError: "Failed to load AI providers. Please check your connection.",
});

export const getSettings = createServerFn({ method: "GET" }).handler(() =>
  AppRuntime.runPromise(
    Effect.gen(function* () {
      const service = yield* SettingsService;
      const settings = yield* service.get();
      return Option.getOrElse(settings, () => DEFAULT_SETTINGS);
    }),
  ).catch(errorHandler),
);

export const updateSettings = createServerFn({ method: "POST" })
  .validator((data: unknown) => Schema.decodeUnknownSync(Settings)(data))
  .handler(({ data }) =>
    AppRuntime.runPromise(
      Effect.gen(function* () {
        const service = yield* SettingsService;
        yield* service.update(data);
      }),
    ).catch(errorHandler),
  );

export const fetchProviders = createServerFn({ method: "GET" }).handler(() =>
  AppRuntime.runPromise(
    Effect.gen(function* () {
      const service = yield* SettingsService;
      return yield* service.fetchProviders();
    }),
  ).catch(errorHandler),
);
