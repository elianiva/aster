import { Effect, Layer, Schema } from "effect";
import * as HttpClient from "effect/unstable/http/HttpClient";
import * as HttpClientResponse from "effect/unstable/http/HttpClientResponse";
import { Settings, ProviderWithModels, DEFAULT_SETTINGS } from "~/features/settings/lib/schema";
import { KVService } from "~/server/app-layer";

const ModelEntryRaw = Schema.Struct({
  id: Schema.String,
  name: Schema.optional(Schema.String),
});

const ProviderModels = Schema.Struct({
  name: Schema.optional(Schema.String),
  env: Schema.optional(Schema.Array(Schema.String)),
  api: Schema.optional(Schema.String),
  npm: Schema.optional(Schema.String),
  models: Schema.Record(Schema.String, ModelEntryRaw),
});

const ModelsDevResponse = Schema.Record(Schema.String, ProviderModels);

export interface SettingsService {
  readonly get: () => Effect.Effect<Settings, unknown, unknown>;
  readonly update: (settings: Settings) => Effect.Effect<void, unknown, unknown>;
  readonly fetchProviders: () => Effect.Effect<ProviderWithModels[], unknown, unknown>;
}

export const SettingsService = Effect.Service<SettingsService>("SettingsService");

export const SettingsServiceLive = Layer.effect(
  SettingsService,
  Effect.gen(function* () {
    const kv = yield* KVService;
    const httpClient = yield* HttpClient.HttpClient;

    const get = () =>
      kv.get("app:settings", Settings).pipe(Effect.catch(() => Effect.succeed(DEFAULT_SETTINGS)));

    const update = (settings: Settings) => kv.put("app:settings", settings);

    const fetchProviders = () =>
      Effect.gen(function* () {
        const response = yield* httpClient.get("https://models.dev/api.json");
        const json = yield* HttpClientResponse.schemaBodyJson(ModelsDevResponse)(response as any);

        const providers: ProviderWithModels[] = [];

        for (const [providerId, providerData] of Object.entries(json)) {
          if (Object.keys(providerData.models).length === 0) continue;

          providers.push({
            provider: {
              id: providerId,
              name: providerData.name ?? providerId,
              env: providerData.env ?? [],
              api: providerData.api ?? "",
              npm: providerData.npm ?? "",
            },
            models: Object.entries(providerData.models).map(([modelId, modelData]) => ({
              id: modelId,
              name: modelData.name,
            })),
          });
        }

        providers.sort((a, b) => a.provider.name.localeCompare(b.provider.name));

        return providers;
      });

    return { get, update, fetchProviders } satisfies SettingsService;
  }),
);
