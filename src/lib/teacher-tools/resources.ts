import { tool } from "ai";
import { z } from "zod";
import { Effect } from "effect";
import { ResourceService } from "~/server/features/resource/service";
import { appRuntime } from "~/server/app-runtime";

const upsertResourceSchema = z.object({
  type: z.enum(["knowledge", "wisdom"]),
  title: z.string().describe("Title of the resource"),
  url: z.string().describe("URL to the resource"),
  annotation: z.string().describe("One line: what it covers and when to reach for it"),
});
type UpsertResourceInput = z.infer<typeof upsertResourceSchema>;

const deleteResourceSchema = z.object({ resourceId: z.string() });
type DeleteResourceInput = z.infer<typeof deleteResourceSchema>;

export function resourceTools(workspaceId: string) {
  return {
    upsertResource: tool({
      description:
        "Add or update a resource for this workspace. Use type 'knowledge' for books, articles, documentation. Use type 'wisdom' for communities — forums, subreddits, classes.",
      inputSchema: upsertResourceSchema,
      execute: (input: UpsertResourceInput) =>
        Effect.gen(function* () {
          const service = yield* ResourceService;
          return yield* service.upsertResource({ workspaceId, ...input });
        }).pipe(appRuntime().runPromise),
    }),
    listResources: tool({
      description:
        "List all curated resources for this workspace. Use before pruning shallow or off-mission resources, or when you need to check whether a resource already exists.",
      inputSchema: z.object({}),
      execute: () =>
        Effect.gen(function* () {
          const service = yield* ResourceService;
          return yield* service.listResources(workspaceId);
        }).pipe(appRuntime().runPromise),
    }),
    deleteResource: tool({
      description:
        "Delete a curated resource. Use when a resource turns out to be wrong, shallow, or off-mission.",
      inputSchema: deleteResourceSchema,
      execute: (input: DeleteResourceInput) =>
        Effect.gen(function* () {
          const service = yield* ResourceService;
          yield* service.deleteResource(input.resourceId, workspaceId);
          return { deleted: true };
        }).pipe(appRuntime().runPromise),
    }),
  };
}
