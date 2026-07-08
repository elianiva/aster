import { Layer, ManagedRuntime } from "effect";
import { env } from "cloudflare:workers";
import { FetchHttpClient } from "effect/unstable/http";
import { SettingsService } from "~/features/settings/server/service"
import { WorkspaceService } from "~/features/workspace/server/service"
import { ThreadService } from "~/features/thread/server/service"
import { ArtifactService } from "~/features/artifact/server/service"
import { NoteService } from "~/features/artifact/server/note-service"
import { GlossaryService } from "~/features/glossary/server/service"
import { ResourceService } from "~/features/resource/server/service"
import { KvLayer } from "./kv-service";
import { Database } from "./db/client";
import { R2 } from "./r2-service";
import { LoggerLayer } from "./logger";

const BaseLayer = Layer.mergeAll(
  LoggerLayer,
  FetchHttpClient.layer,
  KvLayer,
  Database.layer,
  R2.layer(env.ASTER_R2),
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

export type AllServices = Layer.Success<typeof ServicesLayer> | R2;

export const AppLayer: Layer.Layer<AllServices, never, never> = Layer.mergeAll(
  ServicesLayer.pipe(Layer.provide(BaseLayer)),
  R2.layer(env.ASTER_R2),
);

// Deferred — cloudflare:workers bindings only available at runtime
let managed: ManagedRuntime.ManagedRuntime<AllServices, never> | null = null;

export function appRuntime() {
  if (!managed) managed = ManagedRuntime.make(AppLayer);
  return managed;
}
