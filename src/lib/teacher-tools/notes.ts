import { tool } from "ai";
import { z } from "zod";
import { Effect } from "effect";
import { NoteService } from "~/server/features/note/service";
import { appRuntime } from "~/server/app-runtime";

const createNoteSchema = z.object({
  content: z.string().describe("Full OpenUI Lang content for the notes"),
});
type CreateNoteInput = z.infer<typeof createNoteSchema>;

export function noteTools(workspaceId: string) {
  return {
    createNote: tool({
      description:
        "Save the workspace notes scratchpad. One note per workspace — this overwrites the existing note, so append your new content to what's already there before calling. Use for user preferences and working notes, not learning insights.",
      inputSchema: createNoteSchema,
      execute: (input: CreateNoteInput) =>
        Effect.gen(function* () {
          const service = yield* NoteService;
          return yield* service.upsertNote(workspaceId, input.content);
        }).pipe(appRuntime().runPromise),
    }),
    readNote: tool({
      description:
        "Read the workspace notes — your scratchpad with user preferences, working notes, and teaching observations. Read this at the start of a conversation to recall preferences.",
      inputSchema: z.object({}),
      execute: () =>
        Effect.gen(function* () {
          const service = yield* NoteService;
          return yield* service.getNote(workspaceId);
        }).pipe(appRuntime().runPromise),
    }),
  };
}
