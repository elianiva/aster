import { Layer, ManagedRuntime } from "effect";
import { FetchHttpClient } from "effect/unstable/http";
import { SettingsService } from "./features/settings/service";
import { KvLayer } from "./kv-service";
import { Database } from "./db/client";

export const AppLayer = Layer.provideMerge(
  SettingsService.layer,
  Layer.mergeAll(FetchHttpClient.layer, KvLayer, Database.layer),
);

export const AppRuntime = ManagedRuntime.make(AppLayer);
