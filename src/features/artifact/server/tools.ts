import { tool } from "ai";
import { z } from "zod";
import { Effect } from "effect";
import { ArtifactService } from "~/features/artifact/server/service";
import { appRuntime } from "~/server/app-runtime";

const createLessonSchema = z.object({
  title: z.string().describe("Short descriptive title for the lesson"),
  content: z.string().describe("Full OpenUI Lang content for the lesson"),
});
type CreateLessonInput = z.infer<typeof createLessonSchema>;

const createRecordSchema = z.object({
  title: z.string().describe("Short descriptive title for the learning record"),
  content: z.string().describe("Full OpenUI Lang content for the learning record"),
});
type CreateRecordInput = z.infer<typeof createRecordSchema>;

const createReferenceSchema = z.object({
  title: z.string().describe("Short descriptive title for the reference doc"),
  content: z.string().describe("Full OpenUI Lang content for the reference doc"),
});
type CreateReferenceInput = z.infer<typeof createReferenceSchema>;

const deleteSchema = z.object({ id: z.string() });
type DeleteInput = z.infer<typeof deleteSchema>;

export function artifactTools(workspaceId: string) {
  return {
    createLesson: tool({
      description:
        "Save a lesson to the workspace. Use when you've produced substantial teaching content worth preserving, or when the user asks to save something as a lesson.",
      inputSchema: createLessonSchema,
      execute: (input: CreateLessonInput) =>
        Effect.gen(function*() {
          return yield* ArtifactService.use((svc) =>
            svc.createTitled("lesson", {
              workspaceId,
              title: input.title,
              content: input.content,
            }),
          );
        }).pipe(appRuntime().runPromise),
    }),
    createRecord: tool({
      description:
        "Save a learning record capturing what the user has learned. Use after meaningful progress to track insights and knowledge.",
      inputSchema: createRecordSchema,
      execute: (input: CreateRecordInput) =>
        Effect.gen(function*() {
          return yield* ArtifactService.use((svc) =>
            svc.createTitled("record", {
              workspaceId,
              title: input.title,
              content: input.content,
            }),
          );
        }).pipe(appRuntime().runPromise),
    }),
    createReference: tool({
      description:
        "Save a reference document to the workspace — cheat sheets, syntax guides, glossaries. These are the compressed essence designed for quick reference, revisited more than lessons.",
      inputSchema: createReferenceSchema,
      execute: (input: CreateReferenceInput) =>
        Effect.gen(function*() {
          return yield* ArtifactService.use((svc) =>
            svc.createTitled("reference", {
              workspaceId,
              title: input.title,
              content: input.content,
            }),
          );
        }).pipe(appRuntime().runPromise),
    }),
    listReferences: tool({
      description:
        "List all reference documents for this workspace. Use before pruning stale reference docs.",
      inputSchema: z.object({}),
      execute: () =>
        Effect.gen(function*() {
          return yield* ArtifactService.use((svc) => svc.listTitled("reference", workspaceId));
        }).pipe(appRuntime().runPromise),
    }),
    listLessons: tool({
      description:
        "List all lessons in this workspace. Use to check what you've already taught, avoid repeating topics, or find a lesson to reference.",
      inputSchema: z.object({}),
      execute: () =>
        Effect.gen(function*() {
          return yield* ArtifactService.use((svc) => svc.listTitled("lesson", workspaceId));
        }).pipe(appRuntime().runPromise),
    }),
    listRecords: tool({
      description:
        "List all learning records in this workspace. Use to understand what the user has already learned, gauge their level, or check before creating a new record.",
      inputSchema: z.object({}),
      execute: () =>
        Effect.gen(function*() {
          return yield* ArtifactService.use((svc) => svc.listTitled("record", workspaceId));
        }).pipe(appRuntime().runPromise),
    }),
    deleteLesson: tool({
      description:
        "Delete a lesson and its R2 content. Use when a lesson is stale, incorrect, or the user wants to clean up.",
      inputSchema: deleteSchema,
      execute: (input: DeleteInput) =>
        Effect.gen(function*() {
          const deleted = yield* ArtifactService.use((svc) =>
            svc.deleteTitled("lesson", input.id, workspaceId),
          );
          return { deleted };
        }).pipe(appRuntime().runPromise),
    }),
    deleteRecord: tool({
      description:
        "Delete a learning record and its R2 content. Use when a record is stale, incorrect, or the user wants to clean up.",
      inputSchema: deleteSchema,
      execute: (input: DeleteInput) =>
        Effect.gen(function*() {
          const deleted = yield* ArtifactService.use((svc) =>
            svc.deleteTitled("record", input.id, workspaceId),
          );
          return { deleted };
        }).pipe(appRuntime().runPromise),
    }),
    deleteReference: tool({
      description:
        "Delete a reference document and its R2 content. Use when a reference doc is stale or no longer accurate.",
      inputSchema: deleteSchema,
      execute: (input: DeleteInput) =>
        Effect.gen(function*() {
          const deleted = yield* ArtifactService.use((svc) =>
            svc.deleteTitled("reference", input.id, workspaceId),
          );
          return { deleted };
        }).pipe(appRuntime().runPromise),
    }),
  };
}
