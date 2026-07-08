import { env } from "cloudflare:workers";
import { Effect } from "effect";

/**
 * Delete a Teacher DO's hibernated storage by name.
 * The name format is `${workspaceId}::${threadId}`.
 */
export function deleteDOStorage(
  name: string,
): Effect.Effect<void, Error> {
  return Effect.tryPromise({
    try: async () => {
      const stub = env.Teacher.get(env.Teacher.idFromName(name));
      await (stub as unknown as { deleteStorage(): Promise<void> }).deleteStorage();
    },
    catch: (cause) => new Error(`DO cleanup failed for ${name}: ${cause}`),
  });
}
