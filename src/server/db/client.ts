import { Context, Effect, Layer } from "effect";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export type DrizzleClient = ReturnType<typeof drizzle<typeof schema>>;

export class Database extends Context.Service<Database, {
  client: DrizzleClient;
}>()("Database") {
  // Lazily import `cloudflare:workers` so the binding is resolved at layer
  // provisioning time, not at module load — the Vite dev server hasn't
  // finalised the env when the module graph is first evaluated.
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const { env } = yield* Effect.tryPromise({
        try: () => import("cloudflare:workers"),
        catch: () => new Error("Failed to import cloudflare:workers"),
      });
      return { client: drizzle(env.aster_db, { schema }) };
    }),
  );
}
