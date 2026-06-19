import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { Settings, DEFAULT_SETTINGS } from "~/features/settings/lib/schema";
import { SettingsService } from "../features/settings/service";
import { AppRuntime } from "../app-runtime";

function errorHandler(error: unknown): never {
  if (error && typeof error === "object" && "_tag" in error) {
    switch (error._tag) {
      case "ProvidersFetchError":
        throw new Error("Failed to load AI providers. Please check your connection.");
      default:
        throw new Error("Something went wrong. Please try again.");
    }
  }
  throw new Error("Something went wrong. Please try again.");
}

export const getSettings = createServerFn({ method: "GET" }).handler(() =>
  AppRuntime.runPromise(
    Effect.gen(function* () {
      const service = yield* SettingsService;
      const settings = yield* service.get();
      if (!settings) return DEFAULT_SETTINGS;
      return settings;
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
