import { tool } from "ai";
import { z } from "zod";
import { Effect } from "effect";
import { ThreadService } from "~/server/features/thread/service";
import { WorkspaceService } from "~/server/features/workspace/service";
import { appRuntime } from "~/server/app-runtime";

const createThreadSchema = z.object({
  name: z.string().describe("A short 2-5 word name for the new thread."),
  reason: z.string().describe("Why this deserves its own thread."),
});
type CreateThreadInput = z.infer<typeof createThreadSchema>;

const updateMissionSchema = z.object({ mission: z.string() });
type UpdateMissionInput = z.infer<typeof updateMissionSchema>;

const updateKnowledgeSchema = z.object({ currentKnowledge: z.string() });
type UpdateKnowledgeInput = z.infer<typeof updateKnowledgeSchema>;

const setTeachingModeSchema = z.object({ enabled: z.boolean() });
type SetTeachingModeInput = z.infer<typeof setTeachingModeSchema>;

export function baseTools(workspaceId: string, threadId: string) {
  return {
    createThread: tool({
      description:
        "Start a new thread for a distinct sub-topic or practice session. Use only when the current conversation clearly deserves its own space. Tell the user the thread is ready in their sidebar and stay in the current thread.",
      inputSchema: createThreadSchema,
      execute: (input: CreateThreadInput) =>
        Effect.gen(function*() {
          const service = yield* ThreadService;
          const thread = yield* service.create({ workspaceId, name: input.name });
          return { threadId: thread.id, name: thread.name };
        }).pipe(appRuntime().runPromise),
    }),
    updateMission: tool({
      description:
        "Update the user's mission for this workspace when it has meaningfully evolved. Do not call every turn.",
      inputSchema: updateMissionSchema,
      execute: (input: UpdateMissionInput) =>
        Effect.gen(function*() {
          const service = yield* WorkspaceService;
          yield* service.update(workspaceId, { mission: input.mission });
          return { updated: true };
        }).pipe(appRuntime().runPromise),
    }),
    updateKnowledge: tool({
      description:
        "Update the user's current knowledge level for this workspace after meaningful progress. Do not call every turn.",
      inputSchema: updateKnowledgeSchema,
      execute: (input: UpdateKnowledgeInput) =>
        Effect.gen(function*() {
          const service = yield* WorkspaceService;
          yield* service.update(workspaceId, { currentKnowledge: input.currentKnowledge });
          return { updated: true };
        }).pipe(appRuntime().runPromise),
    }),
    setTeachingMode: tool({
      description:
        "Enable or disable full teaching mode for this thread. When enabled, detailed format instructions for creating lessons, records, glossary entries, reference docs, resources, and notes are loaded. Suggest enabling when the user would benefit from a structured lesson or record. Ask the user before enabling.",
      inputSchema: setTeachingModeSchema,
      execute: (input: SetTeachingModeInput) =>
        Effect.gen(function*() {
          const service = yield* ThreadService;
          yield* service.setTeachingMode(threadId, input.enabled);
          return { teachingMode: input.enabled };
        }).pipe(appRuntime().runPromise),
    }),
  };
}
