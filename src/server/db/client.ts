import { env } from "cloudflare:workers";
import { Context, Layer } from "effect";
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "./schema";

export type DrizzleClient = DrizzleD1Database<typeof schema>;

interface DatabaseShape {
  client: DrizzleClient;
}

export class Database extends Context.Service<Database, DatabaseShape>()("Database") {
  static readonly layer = Layer.succeed(this, {
    client: drizzle(env.aster_db, { schema }),
  });
}
