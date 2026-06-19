import { Context, Effect, Layer } from "effect";

export class Database extends Context.Service<Database>()("Database", {
  make: Effect.gen(function*() {
    const client = null;

    return { client } as const;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);
}
