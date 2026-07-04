import { tool } from "ai";
import { z } from "zod";
import { Effect } from "effect";
import { ThreadService } from "../server/features/thread/service";
import { WorkspaceService } from "../server/features/workspace/service";
import { ArtifactService } from "../server/features/artifact/service";
import { NoteService } from "../server/features/note/service";
import { GlossaryService } from "../server/features/glossary/service";
import { ResourceService } from "../server/features/resource/service";
import { R2 } from "../server/r2-service";
import { Database } from "../server/db/client";
type RunFn = <A>(program: Effect.Effect<A, unknown, ServiceUnion | R2 | Database>) => Promise<A>;

type ServiceUnion =
  | ThreadService | WorkspaceService | ArtifactService
  | NoteService | GlossaryService | ResourceService;


export function createTeacherTools(
  workspaceId: string,
  threadId: string,
  runWithServices: RunFn,
  teachingMode: boolean,
) {
  const base = {
    createThread: tool({
      description:
        "Start a new thread for a distinct sub-topic or practice session. Use only when the current conversation clearly deserves its own space. Tell the user the thread is ready in their sidebar and stay in the current thread.",
      inputSchema: z.object({
        name: z.string().describe("A short 2-5 word name for the new thread."),
        reason: z.string().describe("Why this deserves its own thread."),
      }),
      execute: ({ name }: { name: string }) =>
        runWithServices(
          Effect.gen(function* () {
            const service = yield* ThreadService;
            const thread = yield* service.create({ workspaceId, name });
            return { threadId: thread.id, name: thread.name };
          }),
        ),
    }),
    updateMission: tool({
      description:
        "Update the user's mission for this workspace when it has meaningfully evolved. Do not call every turn.",
      inputSchema: z.object({ mission: z.string() }),
      execute: ({ mission }: { mission: string }) =>
        runWithServices(
          Effect.gen(function* () {
            const service = yield* WorkspaceService;
            yield* service.update(workspaceId, { mission });
            return { updated: true };
          }),
        ),
    }),
    updateKnowledge: tool({
      description:
        "Update the user's current knowledge level for this workspace after meaningful progress. Do not call every turn.",
      inputSchema: z.object({ currentKnowledge: z.string() }),
      execute: ({ currentKnowledge }: { currentKnowledge: string }) =>
        runWithServices(
          Effect.gen(function* () {
            const service = yield* WorkspaceService;
            yield* service.update(workspaceId, { currentKnowledge });
            return { updated: true };
          }),
        ),
    }),
    setTeachingMode: tool({
      description:
        "Enable or disable full teaching mode for this thread. When enabled, detailed format instructions for creating lessons, records, glossary entries, reference docs, resources, and notes are loaded. Suggest enabling when the user would benefit from a structured lesson or record. Ask the user before enabling.",
      inputSchema: z.object({ enabled: z.boolean() }),
      execute: ({ enabled }: { enabled: boolean }) =>
        runWithServices(
          Effect.gen(function* () {
            const service = yield* ThreadService;
            yield* service.setTeachingMode(threadId, enabled);
            return { teachingMode: enabled };
          }),
        ),
    }),
  };

  if (!teachingMode) return base;

  return {
    ...base,
    createLesson: tool({
      description:
        "Save a lesson to the workspace. Use when you've produced substantial teaching content worth preserving, or when the user asks to save something as a lesson.",
      inputSchema: z.object({
        title: z.string().describe("Short descriptive title for the lesson"),
        content: z.string().describe("Full OpenUI Lang content for the lesson"),
      }),
      execute: ({ title, content }: { title: string; content: string }) =>
        runWithServices(
          Effect.gen(function* () {
            const service = yield* ArtifactService;
            return yield* service.createTitled("lesson")({ workspaceId, title, content });
          }),
        ),
    }),
    createRecord: tool({
      description:
        "Save a learning record capturing what the user has learned. Use after meaningful progress to track insights and knowledge.",
      inputSchema: z.object({
        title: z.string().describe("Short descriptive title for the learning record"),
        content: z.string().describe("Full OpenUI Lang content for the learning record"),
      }),
      execute: ({ title, content }: { title: string; content: string }) =>
        runWithServices(
          Effect.gen(function* () {
            const service = yield* ArtifactService;
            return yield* service.createTitled("record")({ workspaceId, title, content });
          }),
        ),
    }),
    createReference: tool({
      description:
        "Save a reference document to the workspace — cheat sheets, syntax guides, glossaries. These are the compressed essence designed for quick reference, revisited more than lessons.",
      inputSchema: z.object({
        title: z.string().describe("Short descriptive title for the reference doc"),
        content: z.string().describe("Full OpenUI Lang content for the reference doc"),
      }),
      execute: ({ title, content }: { title: string; content: string }) =>
        runWithServices(
          Effect.gen(function* () {
            const service = yield* ArtifactService;
            return yield* service.createTitled("reference")({ workspaceId, title, content });
          }),
        ),
    }),
    createNote: tool({
      description:
        "Save the workspace notes scratchpad. One note per workspace — this overwrites the existing note, so append your new content to what's already there before calling. Use for user preferences and working notes, not learning insights.",
      inputSchema: z.object({
        content: z.string().describe("Full OpenUI Lang content for the notes"),
      }),
      execute: ({ content }: { content: string }) =>
        runWithServices(
          Effect.gen(function* () {
            const service = yield* NoteService;
            return yield* service.upsertNote(workspaceId, content);
          }),
        ),
    }),
    upsertGlossary: tool({
      description:
        "Add or update a glossary term for this workspace. Add a term only when the user understands it — the glossary is compressed knowledge, not a dictionary. If the term already exists, its definition is replaced.",
      inputSchema: z.object({
        term: z.string().describe("The canonical term"),
        definition: z
          .string()
          .describe("One or two sentences. Define what it IS, not what it does."),
        avoid: z.string().optional().describe("Aliases to avoid — comma-separated"),
      }),
      execute: ({
        term,
        definition,
        avoid,
      }: {
        term: string;
        definition: string;
        avoid?: string;
      }) =>
        runWithServices(
          Effect.gen(function* () {
            const service = yield* GlossaryService;
            return yield* service.upsertGlossary({ workspaceId, term, definition, avoid });
          }),
        ),
    }),
    upsertResource: tool({
      description:
        "Add or update a resource for this workspace. Use type 'knowledge' for books, articles, documentation. Use type 'wisdom' for communities — forums, subreddits, classes.",
      inputSchema: z.object({
        type: z.enum(["knowledge", "wisdom"]),
        title: z.string().describe("Title of the resource"),
        url: z.string().describe("URL to the resource"),
        annotation: z.string().describe("One line: what it covers and when to reach for it"),
      }),
      execute: ({
        type,
        title,
        url,
        annotation,
      }: {
        type: "knowledge" | "wisdom";
        title: string;
        url: string;
        annotation: string;
      }) =>
        runWithServices(
          Effect.gen(function* () {
            const service = yield* ResourceService;
            return yield* service.upsertResource({ workspaceId, type, title, url, annotation });
          }),
        ),
    }),
    listGlossary: tool({
      description:
        "List all glossary terms for this workspace. Use before pruning stale or outdated terms, or when you need to check whether a term already exists.",
      inputSchema: z.object({}),
      execute: () =>
        runWithServices(
          Effect.gen(function* () {
            const service = yield* GlossaryService;
            return yield* service.listGlossary(workspaceId);
          }),
        ),
    }),
    listResources: tool({
      description:
        "List all curated resources for this workspace. Use before pruning shallow or off-mission resources, or when you need to check whether a resource already exists.",
      inputSchema: z.object({}),
      execute: () =>
        runWithServices(
          Effect.gen(function* () {
            const service = yield* ResourceService;
            return yield* service.listResources(workspaceId);
          }),
        ),
    }),
    listReferences: tool({
      description:
        "List all reference documents for this workspace. Use before pruning stale reference docs.",
      inputSchema: z.object({}),
      execute: () =>
        runWithServices(
          Effect.gen(function* () {
            const service = yield* ArtifactService;
            return yield* service.listTitled("reference")(workspaceId);
          }),
        ),
    }),
    deleteGlossary: tool({
      description:
        "Delete a glossary term. Use when a term is stale, redundant, or the user's understanding has moved past it.",
      inputSchema: z.object({ termId: z.string() }),
      execute: ({ termId }: { termId: string }) =>
        runWithServices(
          Effect.gen(function* () {
            const service = yield* GlossaryService;
            yield* service.deleteGlossary(termId, workspaceId);
            return { deleted: true };
          }),
        ),
    }),
    deleteResource: tool({
      description:
        "Delete a curated resource. Use when a resource turns out to be wrong, shallow, or off-mission.",
      inputSchema: z.object({ resourceId: z.string() }),
      execute: ({ resourceId }: { resourceId: string }) =>
        runWithServices(
          Effect.gen(function* () {
            const service = yield* ResourceService;
            yield* service.deleteResource(resourceId, workspaceId);
            return { deleted: true };
          }),
        ),
    }),
    deleteLesson: tool({
      description:
        "Delete a lesson and its R2 content. Use when a lesson is stale, incorrect, or the user wants to clean up.",
      inputSchema: z.object({ lessonId: z.string() }),
      execute: ({ lessonId }: { lessonId: string }) =>
        runWithServices(
          Effect.gen(function* () {
            const service = yield* ArtifactService;
            const deleted = yield* service.deleteTitled("lesson")(lessonId, workspaceId);
            return { deleted };
          }),
        ),
    }),
    deleteRecord: tool({
      description:
        "Delete a learning record and its R2 content. Use when a record is stale, incorrect, or the user wants to clean up.",
      inputSchema: z.object({ recordId: z.string() }),
      execute: ({ recordId }: { recordId: string }) =>
        runWithServices(
          Effect.gen(function* () {
            const service = yield* ArtifactService;
            const deleted = yield* service.deleteTitled("record")(recordId, workspaceId);
            return { deleted };
          }),
        ),
    }),
    deleteReference: tool({
      description:
        "Delete a reference document and its R2 content. Use when a reference doc is stale or no longer accurate.",
      inputSchema: z.object({ referenceId: z.string() }),
      execute: ({ referenceId }: { referenceId: string }) =>
        runWithServices(
          Effect.gen(function* () {
            const service = yield* ArtifactService;
            const deleted = yield* service.deleteTitled("reference")(referenceId, workspaceId);
            return { deleted };
          }),
        ),
    }),
  };
}