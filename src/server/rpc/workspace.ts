import { appRuntime } from "../app-runtime";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Option, Schema } from "effect";
import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { WorkspaceService, type Workspace, CreateWorkspaceInput, UpdateWorkspaceInput } from "../features/workspace/service";
import type { RecentThread } from "../features/thread/service";
import { ThreadService } from "../features/thread/service";
import { deleteDOStorage } from "../durable-object-helpers";
import { R2 } from "../r2-service";
import { rpcErrorPipe } from "../error-handler";
import { queryKeys } from "./query-keys";

export const listWorkspaces = createServerFn({ method: "GET" }).handler(async () => {
  return Effect.gen(function* () {
    return yield* WorkspaceService.use((svc) => svc.list());
  }).pipe(
    Effect.withSpan("listWorkspaces"),
    rpcErrorPipe({
      WorkspaceNotFound: "Workspace not found. It may have been deleted.",
      WorkspacePersistenceFailed: "Failed to complete operation. Please try again.",
    }),
    appRuntime().runPromise,
  );
});

export const getWorkspace = createServerFn({ method: "GET" })
  .validator((data: unknown) => Schema.decodeUnknownSync(Schema.Struct({ id: Schema.String }))(data))
  .handler(async ({ data }) => {
    return Effect.gen(function* () {
      const result = yield* WorkspaceService.use((svc) => svc.get(data.id));
      return Option.getOrNull(result);
    }).pipe(
      Effect.withSpan("getWorkspace"),
      Effect.annotateLogs({ id: data.id }),
      rpcErrorPipe({
        WorkspaceNotFound: "Workspace not found. It may have been deleted.",
        WorkspacePersistenceFailed: "Failed to complete operation. Please try again.",
      }),
      appRuntime().runPromise,
    );
  });

export const createWorkspace = createServerFn({ method: "POST" })
  .validator((data: unknown) => Schema.decodeUnknownSync(CreateWorkspaceInput)(data))
  .handler(async ({ data }) => {
    return Effect.gen(function* () {
      return yield* WorkspaceService.use((svc) => svc.create(data));
    }).pipe(
      Effect.withSpan("createWorkspace"),
      Effect.annotateLogs({ topic: data.topic }),
      rpcErrorPipe({
        WorkspaceNotFound: "Workspace not found. It may have been deleted.",
        WorkspacePersistenceFailed: "Failed to complete operation. Please try again.",
      }),
      appRuntime().runPromise,
    );
  });

export const updateWorkspace = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    return Schema.decodeUnknownSync(
      Schema.Struct({ id: Schema.String, ...UpdateWorkspaceInput.fields }),
    )(data);
  })
  .handler(async ({ data }) => {
    return Effect.gen(function* () {
      return yield* WorkspaceService.use((svc) => svc.update(data.id, data));
    }).pipe(
      Effect.withSpan("updateWorkspace"),
      Effect.annotateLogs({ id: data.id }),
      rpcErrorPipe({
        WorkspaceNotFound: "Workspace not found. It may have been deleted.",
        WorkspacePersistenceFailed: "Failed to complete operation. Please try again.",
      }),
      appRuntime().runPromise,
    );
  });

export const deleteWorkspace = createServerFn({ method: "POST" })
  .validator((data: unknown) => Schema.decodeUnknownSync(Schema.Struct({ id: Schema.String }))(data))
  .handler(async ({ data }) => {
    return Effect.gen(function* () {
      yield* Effect.log("deleteWorkspace");
      const service = yield* WorkspaceService;
      const { threadIds, r2Keys } = yield* service.cascadeDelete(data.id);
      const r2 = yield* R2;

      const cleanupDO = (threadId: string) =>
        deleteDOStorage(`${data.id}::${threadId}`).pipe(
          Effect.catch((error) =>
            Effect.log(`DO cleanup failed for threadId=${threadId}: ${error.message}`),
          ),
        );

      const cleanupR2 = (key: string) =>
        r2.delete(key).pipe(
          Effect.catch((error) =>
            Effect.log(`R2 cleanup failed for key=${key}: ${error.message}`),
          ),
        );

      yield* Effect.all(
        [...threadIds.map(cleanupDO), ...r2Keys.map(cleanupR2)],
        { concurrency: "unbounded" },
      );
    }).pipe(
      Effect.withSpan("deleteWorkspace"),
      Effect.annotateLogs({ id: data.id }),
      rpcErrorPipe({
        WorkspaceNotFound: "Workspace not found. It may have been deleted.",
        WorkspacePersistenceFailed: "Failed to complete operation. Please try again.",
      }),
      appRuntime().runPromise,
    );
  });

export const getRecentThreads = createServerFn({ method: "GET" }).handler(async () => {
  return Effect.gen(function* () {
    return yield* ThreadService.use((svc) => svc.getRecent());
  }).pipe(
    Effect.withSpan("getRecentThreads"),
    rpcErrorPipe({
      WorkspaceNotFound: "Workspace not found. It may have been deleted.",
      WorkspacePersistenceFailed: "Failed to complete operation. Please try again.",
    }),
    appRuntime().runPromise,
  );
});

export const WorkspaceRpc = {
  listWorkspaces: () =>
    queryOptions({
      queryKey: queryKeys.workspaces.list(),
      queryFn: (): Promise<Workspace[]> => listWorkspaces(),
    }),
  recentThreads: () =>
    queryOptions({
      queryKey: queryKeys.workspaces.recentThreads(),
      queryFn: (): Promise<RecentThread[]> => getRecentThreads(),
    }),
  getWorkspace: (id: string) =>
    queryOptions({
      queryKey: queryKeys.workspaces.detail(id),
      queryFn: (): Promise<Workspace | null> => getWorkspace({ data: { id } }),
    }),
  createWorkspace: () =>
    mutationOptions({
      mutationKey: queryKeys.workspaces.all,
      mutationFn: (input: CreateWorkspaceInput) => createWorkspace({ data: input }),
    }),
  updateWorkspace: () =>
    mutationOptions({
      mutationKey: queryKeys.workspaces.all,
      mutationFn: (input: UpdateWorkspaceInput & { id: string }) => updateWorkspace({ data: input }),
    }),
  deleteWorkspace: () =>
    mutationOptions({
      mutationKey: queryKeys.workspaces.all,
      mutationFn: (input: { id: string }) => deleteWorkspace({ data: input }),
    }),
};
