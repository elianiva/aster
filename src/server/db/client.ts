import { Context, Effect, Layer } from "effect";

export interface Database {
  readonly client: unknown;
}

export const Database = Context.Service<Database>("Database");

export const DatabaseLive = Layer.succeed(Database, {
  client: null, // TODO: Initialize with Drizzle + LibSQL
});

export const DatabaseTest = Layer.succeed(Database, {
  client: null,
});
