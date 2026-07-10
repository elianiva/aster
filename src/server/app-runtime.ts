import { Layer, ManagedRuntime } from "effect";
import { env } from "cloudflare:workers";
import { FetchHttpClient } from "effect/unstable/http";
import { SettingsService } from "~/features/settings/server/service";
import { WorkspaceService } from "~/features/workspace/server/service";
import { ThreadService } from "~/features/thread/server/service";
import { ArtifactService } from "~/features/artifact/server/service";
import { NoteService } from "~/features/artifact/server/note-service";
import { GlossaryService } from "~/features/glossary/server/service";
import { ResourceService } from "~/features/resource/server/service";
import { makeKvLayer } from "./kv-service";
import { Database } from "./db/client";
import { R2 } from "./r2-service";
import { LoggerLayer } from "./logger";

interface AppBindings {
  db: D1Database;
  r2: R2Bucket;
  kv: KVNamespace;
}

type AppServices =
  | SettingsService
  | WorkspaceService
  | ThreadService
  | ArtifactService
  | NoteService
  | GlossaryService
  | ResourceService
  | R2;

export type AppLayer = Layer.Layer<AppServices, never, never>;

export function makeAppLayer(bindings: AppBindings): AppLayer {
  const base = Layer.mergeAll(
    LoggerLayer,
    FetchHttpClient.layer,
    makeKvLayer(bindings.kv),
    Database.layer(bindings.db),
    R2.layer(bindings.r2),
  );

  const services = Layer.mergeAll(
    SettingsService.layer,
    WorkspaceService.layer,
    ThreadService.layer,
    ArtifactService.layer,
    NoteService.layer,
    GlossaryService.layer,
    ResourceService.layer,
  );

  return Layer.mergeAll(
    services.pipe(Layer.provide(base)),
    R2.layer(bindings.r2),
  );
}

const defaultLayer = makeAppLayer({ db: env.aster_db, r2: env.ASTER_R2, kv: env.ASTER_KV });

let managed: ManagedRuntime.ManagedRuntime<AppServices, never> | null = null;

export function appRuntime() {
  if (!managed) managed = ManagedRuntime.make<AppServices, never>(defaultLayer);
  return managed;
}
