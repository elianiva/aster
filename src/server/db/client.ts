import { Context, Layer } from "effect";
import { drizzle } from "drizzle-orm/d1";
import { env } from "cloudflare:workers";
import * as schema from "./schema";

export type DrizzleClient = ReturnType<typeof drizzle<typeof schema>>;

export class Database extends Context.Service<Database, {
  client: DrizzleClient;
}>()("Database") {
  static readonly layer = Layer.succeed(this, {
    client: drizzle(env.aster_db, { schema }),
  });
}
