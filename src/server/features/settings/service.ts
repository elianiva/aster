import { Context, Effect, Layer } from "effect";
import { Settings, ProviderWithModels } from "~/features/settings/lib/schema";
import { ModelsDevResponse } from "~/features/settings/lib/models-dev-schema";
import { ProvidersFetchError } from "~/server/errors";
import { HttpClient, HttpClientResponse } from "effect/unstable/http";
import * as KeyValueStore from "effect/unstable/persistence/KeyValueStore";

const PROVIDER_WHITELIST = ["opencode-go"];

const toProviders = (json: ModelsDevResponse): ProviderWithModels[] => {
  const providers: ProviderWithModels[] = [];
  for (const [providerId, providerData] of Object.entries(json)) {
    if (!PROVIDER_WHITELIST.includes(providerId)) continue;
    if (Object.keys(providerData.models).length === 0) continue;
    providers.push({
      provider: {
        id: providerId,
        name: providerData.name,
        env: providerData.env,
        api: providerData.api ?? "",
        npm: providerData.npm,
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

export class SettingsService extends Context.Service<SettingsService>()(
  "@aster/features/settings/SettingsService",
  {
    make: Effect.gen(function*() {
      const kv = yield* KeyValueStore.KeyValueStore;
      const httpClient = yield* HttpClient.HttpClient;
      const store = KeyValueStore.toSchemaStore(kv, Settings);

      const get = Effect.fn("SettingsService.get")(function*() {
        yield* Effect.log("kv get: app:settings");
        return yield* store.get("app:settings");
      });

      const update = Effect.fn("SettingsService.update")(function*(settings: Settings) {
        yield* Effect.log("kv set: app:settings");
        yield* store.set("app:settings", settings);
      });

      const fetchProviders = Effect.fn("SettingsService.fetchProviders")(function*() {
        yield* Effect.log("http get: models.dev/api.json");
        const response = yield* httpClient.get("https://models.dev/api.json");
        const json = yield* HttpClientResponse.schemaBodyJson(ModelsDevResponse)(response);
        return toProviders(json);
      });

      const fetchProvidersSafe = (...args: Parameters<typeof fetchProviders>) =>
        fetchProviders(...args).pipe(
          Effect.mapError((cause) => new ProvidersFetchError({ cause })),
        );

      return { get, update, fetchProviders: fetchProvidersSafe } as const;
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make);
}
