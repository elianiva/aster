import { Layer, ManagedRuntime } from "effect";
import { FetchHttpClient } from "effect/unstable/http";
import { SettingsService } from "./features/settings/service";
import { WorkspaceService } from "./features/workspace/service";
import { KvLayer } from "./kv-service";
import { Database } from "./db/client";

const BaseLayer = Layer.mergeAll(
  FetchHttpClient.layer,
  KvLayer,
  Database.layer,
);

export const AppLayer = Layer.merge(
  SettingsService.layer,
  WorkspaceService.layer,
).pipe(Layer.provide(BaseLayer));

export const AppRuntime = ManagedRuntime.make(AppLayer);
