import { tool } from "ai";
import { z } from "zod";
import { Effect } from "effect";
import { ArtifactService, type ArtifactKind } from "./service";
import { appRuntime } from "~/server/app-runtime";

interface KindToolConfig {
  createDesc: string;
  deleteDesc: string;
  listDesc: string;
  fieldLabel: string;
}

const kindConfigs: Record<ArtifactKind, KindToolConfig> = {
  lesson: {
    createDesc:
      "Save a lesson to the workspace. Use when you've produced substantial teaching content worth preserving, or when the user asks to save something as a lesson.",
    deleteDesc:
      "Delete a lesson and its R2 content. Use when a lesson is stale, incorrect, or the user wants to clean up.",
    listDesc:
      "List all lessons in this workspace. Use to check what you've already taught, avoid repeating topics, or find a lesson to reference.",
    fieldLabel: "lesson",
  },
  record: {
    createDesc:
      "Save a learning record capturing what the user has learned. Use after meaningful progress to track insights and knowledge.",
    deleteDesc:
      "Delete a learning record and its R2 content. Use when a record is stale, incorrect, or the user wants to clean up.",
    listDesc:
      "List all learning records in this workspace. Use to understand what the user has already learned, gauge their level, or check before creating a new record.",
    fieldLabel: "learning record",
  },
  reference: {
    createDesc:
      "Save a reference document to the workspace — cheat sheets, syntax guides, glossaries. These are the compressed essence designed for quick reference, revisited more than lessons.",
    deleteDesc:
      "Delete a reference document and its R2 content. Use when a reference doc is stale or no longer accurate.",
    listDesc:
      "List all reference documents for this workspace. Use before pruning stale reference docs.",
    fieldLabel: "reference doc",
  },
};

const deleteSchema = z.object({ id: z.string() });

function createKindTools(kind: ArtifactKind, workspaceId: string) {
  const label = kind.charAt(0).toUpperCase() + kind.slice(1);
  const config = kindConfigs[kind];

  const createSchema = z.object({
    title: z.string().describe(`Short descriptive title for the ${config.fieldLabel}`),
    content: z.string().describe(`Full OpenUI Lang content for the ${config.fieldLabel}`),
  });

  return {
    [`create${label}`]: tool({
      description: config.createDesc,
      inputSchema: createSchema,
      execute: (input: { title: string; content: string }) =>
        Effect.gen(function* () {
          return yield* ArtifactService.use((svc) =>
            svc.createTitled(kind, {
              workspaceId,
              title: input.title,
              content: input.content,
            }),
          );
        }).pipe(appRuntime().runPromise),
    }),
    [`delete${label}`]: tool({
      description: config.deleteDesc,
      inputSchema: deleteSchema,
      execute: (input: { id: string }) =>
        Effect.gen(function* () {
          const deleted = yield* ArtifactService.use((svc) =>
            svc.deleteTitled(kind, input.id, workspaceId),
          );
          return { deleted };
        }).pipe(appRuntime().runPromise),
    }),
    [`list${label}s`]: tool({
      description: config.listDesc,
      inputSchema: z.object({}),
      execute: () =>
        Effect.gen(function* () {
          return yield* ArtifactService.use((svc) =>
            svc.listTitled(kind, workspaceId),
          );
        }).pipe(appRuntime().runPromise),
    }),
  };
}

export function artifactTools(workspaceId: string) {
  return {
    ...createKindTools("lesson", workspaceId),
    ...createKindTools("record", workspaceId),
    ...createKindTools("reference", workspaceId),
  };
}
