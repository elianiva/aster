import { tool } from "ai";
import { z } from "zod";
import { Effect } from "effect";
import { GlossaryService } from "~/server/features/glossary/service";
import { appRuntime } from "~/server/app-runtime";

const upsertGlossarySchema = z.object({
  term: z.string().describe("The canonical term"),
  definition: z
    .string()
    .describe("One or two sentences. Define what it IS, not what it does."),
  avoid: z.string().optional().describe("Aliases to avoid — comma-separated"),
});
type UpsertGlossaryInput = z.infer<typeof upsertGlossarySchema>;

const deleteGlossarySchema = z.object({ termId: z.string() });
type DeleteGlossaryInput = z.infer<typeof deleteGlossarySchema>;

export function glossaryTools(workspaceId: string) {
  return {
    upsertGlossary: tool({
      description:
        "Add or update a glossary term for this workspace. Add a term only when the user understands it — the glossary is compressed knowledge, not a dictionary. If the term already exists, its definition is replaced.",
      inputSchema: upsertGlossarySchema,
      execute: (input: UpsertGlossaryInput) =>
        Effect.gen(function* () {
          const service = yield* GlossaryService;
          return yield* service.upsertGlossary({ workspaceId, ...input });
        }).pipe(appRuntime().runPromise),
    }),
    listGlossary: tool({
      description:
        "List all glossary terms for this workspace. Use before pruning stale or outdated terms, or when you need to check whether a term already exists.",
      inputSchema: z.object({}),
      execute: () =>
        Effect.gen(function* () {
          const service = yield* GlossaryService;
          return yield* service.listGlossary(workspaceId);
        }).pipe(appRuntime().runPromise),
    }),
    deleteGlossary: tool({
      description:
        "Delete a glossary term. Use when a term is stale, redundant, or the user's understanding has moved past it.",
      inputSchema: deleteGlossarySchema,
      execute: (input: DeleteGlossaryInput) =>
        Effect.gen(function* () {
          const service = yield* GlossaryService;
          yield* service.deleteGlossary(input.termId, workspaceId);
          return { deleted: true };
        }).pipe(appRuntime().runPromise),
    }),
  };
}
