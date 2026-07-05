import { createServerFn } from "@tanstack/react-start";
import { Effect, Option, Schema } from "effect";
import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { sql } from "drizzle-orm";
import type { CreateWorkspaceInput, UpdateWorkspaceInput } from "../features/workspace/service";
import { createErrorHandler } from "../error-handler";

const onError = createErrorHandler({
  WorkspaceNotFound: "Workspace not found. It may have been deleted.",
  WorkspacePersistenceFailed: "Failed to complete operation. Please try again.",
});

export const listWorkspaces = createServerFn({ method: "GET" }).handler(async () => {
  // Lazy import: cloudflare:workers is server-only (platform exception)
  const { AppRuntime } = await import("../app-runtime");
  const { WorkspaceService } = await import("../features/workspace/service");
  return AppRuntime.runPromise(
    Effect.gen(function* () {
      yield* Effect.log("listWorkspaces");
      const service = yield* WorkspaceService;
      return yield* service.list();
    }).pipe(Effect.withSpan("listWorkspaces")),
  ).catch(onError);
});

export const getWorkspace = createServerFn({ method: "GET" })
  .validator((data: unknown) => Schema.decodeUnknownSync(Schema.Struct({ id: Schema.String }))(data))
  .handler(async ({ data }) => {
    // Lazy import: cloudflare:workers is server-only (platform exception)
    const { AppRuntime } = await import("../app-runtime");
    const { WorkspaceService } = await import("../features/workspace/service");
    return AppRuntime.runPromise(
      Effect.gen(function* () {
        yield* Effect.log("getWorkspace");
        const service = yield* WorkspaceService;
        const workspace = yield* service.get(data.id);
        return Option.getOrNull(workspace);
      }).pipe(Effect.withSpan("getWorkspace"), Effect.annotateLogs({ id: data.id })),
    ).catch(onError);
  });

export const createWorkspace = createServerFn({ method: "POST" })
  .validator(async (data: unknown) => {
    // Lazy import: cloudflare:workers is server-only (platform exception)
    const { CreateWorkspaceInput } = await import("../features/workspace/service");
    return Schema.decodeUnknownSync(CreateWorkspaceInput)(data);
  })
  .handler(async ({ data }) => {
    // Lazy import: cloudflare:workers is server-only (platform exception)
    const { AppRuntime } = await import("../app-runtime");
    const { WorkspaceService } = await import("../features/workspace/service");
    return AppRuntime.runPromise(
      Effect.gen(function* () {
        yield* Effect.log("createWorkspace");
        const service = yield* WorkspaceService;
        return yield* service.create(data);
      }).pipe(Effect.withSpan("createWorkspace"), Effect.annotateLogs({ topic: data.topic })),
    ).catch(onError);
  });

export const updateWorkspace = createServerFn({ method: "POST" })
  .validator(async (data: unknown) => {
    // Lazy import: cloudflare:workers is server-only (platform exception)
    const { UpdateWorkspaceInput } = await import("../features/workspace/service");
    return Schema.decodeUnknownSync(
      Schema.Struct({ id: Schema.String, ...UpdateWorkspaceInput.fields }),
    )(data);
  })
  .handler(async ({ data }) => {
    // Lazy import: cloudflare:workers is server-only (platform exception)
    const { AppRuntime } = await import("../app-runtime");
    const { WorkspaceService } = await import("../features/workspace/service");
    return AppRuntime.runPromise(
      Effect.gen(function* () {
        yield* Effect.log("updateWorkspace");
        const service = yield* WorkspaceService;
        const { id, ...input } = data;
        return yield* service.update(id, input);
      }).pipe(Effect.withSpan("updateWorkspace"), Effect.annotateLogs({ id: data.id })),
    ).catch(onError);
  });

export const deleteWorkspace = createServerFn({ method: "POST" })
  .validator((data: unknown) => Schema.decodeUnknownSync(Schema.Struct({ id: Schema.String }))(data))
  .handler(async ({ data }) => {
    // Lazy import: cloudflare:workers is server-only (platform exception)
    const { AppRuntime } = await import("../app-runtime");
    const { WorkspaceService } = await import("../features/workspace/service");
    const { deleteDOStorage } = await import("../durable-object-helpers");
    const { deleteR2Content } = await import("../r2-service");
    return AppRuntime.runPromise(
      Effect.gen(function* () {
        yield* Effect.log("deleteWorkspace");
        const service = yield* WorkspaceService;
        const { threadIds, r2Keys } = yield* service.cascadeDelete(data.id);

        const cleanupDO = (threadId: string) =>
          deleteDOStorage(`${data.id}::${threadId}`).pipe(
            Effect.catch((error) =>
              Effect.log(`DO cleanup failed for threadId=${threadId}: ${error.message}`),
            ),
          );

        const cleanupR2 = (key: string) =>
          deleteR2Content(key).pipe(
            Effect.catch((error) =>
              Effect.log(`R2 cleanup failed for key=${key}: ${error.message}`),
            ),
          );

        yield* Effect.all(
          [...threadIds.map(cleanupDO), ...r2Keys.map(cleanupR2)],
          { concurrency: "unbounded" },
        );
      }).pipe(Effect.withSpan("deleteWorkspace"), Effect.annotateLogs({ id: data.id })),
    ).catch(onError);
  });
export interface RecentThread {
  workspaceId: string;
  threadId: string;
  threadName: string;
}

export const getRecentThreads = createServerFn({ method: "GET" }).handler(async () => {
  // Lazy import: cloudflare:workers is server-only (platform exception)
  const { AppRuntime } = await import("../app-runtime");
  const { Database } = await import("../db/client");
  return AppRuntime.runPromise(
    Effect.gen(function* () {
      yield* Effect.log("getRecentThreads");
      const db = yield* Database;
      const rows = yield* Effect.tryPromise({
        try: () =>
          db.client.all<{
            workspace_id: string;
            thread_id: string;
            thread_name: string;
          }>(sql`
            SELECT t.workspace_id, t.id as thread_id, t.name as thread_name
            FROM threads t
            INNER JOIN (
              SELECT workspace_id, MAX(updated_at) as max_updated
              FROM threads
              GROUP BY workspace_id
            ) latest ON t.workspace_id = latest.workspace_id AND t.updated_at = latest.max_updated
          `),
        catch: (e) => new Error(`Failed to query recent threads: ${e}`),
      }).pipe(Effect.withSpan("getRecentThreads"));
      return rows.map((row) => ({
        workspaceId: row.workspace_id,
        threadId: row.thread_id,
        threadName: row.thread_name,
      }));
    }).pipe(Effect.withSpan("getRecentThreads")),
  ).catch(onError);
});

export const WorkspaceRpc = {
  workspace: () => ["workspace"],
  listWorkspaces: () =>
    queryOptions({
      queryKey: [...WorkspaceRpc.workspace(), "list"],
      queryFn: () => listWorkspaces(),
    }),
  recentThreads: () =>
    queryOptions({
      queryKey: [...WorkspaceRpc.workspace(), "recentThreads"],
      queryFn: () => getRecentThreads(),
    }),
  getWorkspace: (id: string) =>
    queryOptions({
      queryKey: [...WorkspaceRpc.workspace(), id],
      queryFn: () => getWorkspace({ data: { id } }),
    }),
  createWorkspace: () =>
    mutationOptions({
      mutationKey: [...WorkspaceRpc.workspace()],
      mutationFn: (input: CreateWorkspaceInput) => createWorkspace({ data: input }),
    }),
  updateWorkspace: () =>
    mutationOptions({
      mutationKey: [...WorkspaceRpc.workspace()],
      mutationFn: (input: UpdateWorkspaceInput & { id: string }) => updateWorkspace({ data: input }),
    }),
  deleteWorkspace: () =>
    mutationOptions({
      mutationKey: [...WorkspaceRpc.workspace()],
      mutationFn: (input: { id: string }) => deleteWorkspace({ data: input }),
    }),
};
