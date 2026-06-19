import { Context, Effect, Layer, Option, Schema } from "effect";
import { Settings, ProviderWithModels } from "~/features/settings/lib/schema";
import { ProvidersFetchError } from "~/server/errors";
import { HttpClient, HttpClientResponse } from "effect/unstable/http";
import * as KeyValueStore from "effect/unstable/persistence/KeyValueStore";

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

const toProviders = (json: typeof ModelsDevResponse.Type): ProviderWithModels[] => {
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
};

export class SettingsService extends Context.Service<SettingsService>()("SettingsService", {
  make: Effect.gen(function*() {
    const kv = yield* KeyValueStore.KeyValueStore;
    const httpClient = yield* HttpClient.HttpClient;
    const store = KeyValueStore.toSchemaStore(kv, Settings);

    const get = () =>
      store.get("app:settings").pipe(Effect.map(Option.getOrNull));

    const update = (settings: Settings) => store.set("app:settings", settings);

    const fetchProviders = () =>
      Effect.gen(function*() {
        const response = yield* httpClient.get("https://models.dev/api.json");
        const json = yield* HttpClientResponse.schemaBodyJson(ModelsDevResponse)(response);
        return toProviders(json);
      }).pipe(Effect.mapError((cause) => new ProvidersFetchError({ cause })));

    return { get, update, fetchProviders } as const;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);
}
