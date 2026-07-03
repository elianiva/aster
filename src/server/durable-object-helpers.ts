import { Effect } from "effect";

interface DeletableStub {
  deleteStorage(): Promise<void>;
}

/**
 * Delete a Teacher DO's hibernated storage by name.
 * The name format is `${workspaceId}::${threadId}`.
 */
export function deleteDOStorage(
  name: string,
): Effect.Effect<void, Error> {
  return Effect.tryPromise({
    try: async () => {
      // Dynamic import: cloudflare:workers is a platform-specific virtual module
      // unavailable at static-import time during Vite dev server startup.
      const { env } = await import("cloudflare:workers");
      const stub = env.Teacher.get(env.Teacher.idFromName(name));
      await (stub as unknown as DeletableStub).deleteStorage();
    },
    catch: (cause) => new Error(`DO cleanup failed for ${name}: ${cause}`),
  });
}
