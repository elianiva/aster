import { Layer, ManagedRuntime } from "effect";
import { FetchHttpClient } from "effect/unstable/http";
import { SettingsService } from "./features/settings/service";
import { WorkspaceService } from "./features/workspace/service";
import { ThreadService } from "./features/thread/service";
import { KvLayer } from "./kv-service";
import { Database } from "./db/client";
import { LoggerLayer } from "./logger";

const BaseLayer = Layer.mergeAll(
  LoggerLayer,
  FetchHttpClient.layer,
  KvLayer,
  Database.layer,
);

const ServicesLayer = Layer.mergeAll(
  SettingsService.layer,
  WorkspaceService.layer,
  ThreadService.layer.pipe(Layer.provide(WorkspaceService.layer)),
);

// Services consume BaseLayer internally; re-expose BaseLayer (Database, KV, …)
// alongside the services so RPCs that read directly from D1/R2 can access the
// shared client without re-instantiating drizzle per call.
export const AppLayer = Layer.mergeAll(ServicesLayer, BaseLayer).pipe(
  Layer.provide(BaseLayer),
);

export const AppRuntime = ManagedRuntime.make(AppLayer);
