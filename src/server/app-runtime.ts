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

export const AppLayer = Layer.mergeAll(
  SettingsService.layer,
  WorkspaceService.layer,
  ThreadService.layer.pipe(Layer.provide(WorkspaceService.layer)),
).pipe(Layer.provide(BaseLayer));

export const AppRuntime = ManagedRuntime.make(AppLayer);
