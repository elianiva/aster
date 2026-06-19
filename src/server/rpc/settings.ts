import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { Settings, DEFAULT_SETTINGS } from "~/features/settings/lib/schema";
import { SettingsService } from "../features/settings/service";
import { AppRuntime } from "../app-runtime";

export const getSettings = createServerFn({ method: "GET" }).handler(() =>
  AppRuntime.runPromise(
    Effect.gen(function*() {
      const service = yield* SettingsService;
      const settings = yield* service.get();
      if (!settings) return DEFAULT_SETTINGS;
      return settings;
    }),
  ),
);

export const updateSettings = createServerFn({ method: "POST" })
  .validator((data: unknown) => Schema.decodeUnknownSync(Settings)(data))
  .handler(({ data }) =>
    AppRuntime.runPromise(
      Effect.gen(function*() {
        const service = yield* SettingsService;
        yield* service.update(data);
      }),
    ),
  );

export const fetchProviders = createServerFn({ method: "GET" }).handler(() =>
  AppRuntime.runPromise(
    Effect.gen(function*() {
      const service = yield* SettingsService;
      return yield* service.fetchProviders();
    }),
  ),
);
