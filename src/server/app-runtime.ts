import { Layer, ManagedRuntime } from "effect";
import { FetchHttpClient } from "effect/unstable/http";
import { SettingsService } from "./features/settings/service";
import { WorkspaceService } from "./features/workspace/service";
import { ThreadService } from "./features/thread/service";
import { ArtifactService } from "./features/artifact/service";
import { NoteService } from "./features/note/service";
import { GlossaryService } from "./features/glossary/service";
import { ResourceService } from "./features/resource/service";
import { KvLayer } from "./kv-service";
import { Database } from "./db/client";
import { R2 } from "./r2-service";
import { LoggerLayer } from "./logger";

const BaseLayer = Layer.mergeAll(
  LoggerLayer,
  FetchHttpClient.layer,
  KvLayer,
  Database.layer,
  R2.layer,
);

const ServicesLayer = Layer.mergeAll(
  SettingsService.layer,
  WorkspaceService.layer,
  ThreadService.layer,
  ArtifactService.layer,
  NoteService.layer,
  GlossaryService.layer,
  ResourceService.layer,
);

export const AppLayer = Layer.mergeAll(ServicesLayer, BaseLayer).pipe(
  Layer.provide(BaseLayer),
);

export const AppRuntime = ManagedRuntime.make(AppLayer);
