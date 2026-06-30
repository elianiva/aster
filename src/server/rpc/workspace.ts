import { createServerFn } from "@tanstack/react-start";
import { Effect, Option, Schema } from "effect";
import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { WorkspaceService, CreateWorkspaceInput, UpdateWorkspaceInput } from "../features/workspace/service";
import { AppRuntime } from "../app-runtime";
import { createErrorHandler } from "./errors";

const onError = createErrorHandler({
  WorkspaceNotFound: "Workspace not found. It may have been deleted.",
  WorkspaceQueryFailed: "Failed to load workspaces. Please try again.",
  WorkspaceInsertFailed: "Failed to create workspace. Please try again.",
  WorkspaceUpdateFailed: "Failed to update workspace. Please try again.",
  WorkspaceDeleteFailed: "Failed to delete workspace. Please try again.",
  WorkspaceCascadeDeleteFailed: "Failed to delete workspace. Please try again.",
});

export const listWorkspaces = createServerFn({ method: "GET" }).handler(() => {
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
  .handler(({ data }) => {
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
  .validator((data: unknown) => Schema.decodeUnknownSync(CreateWorkspaceInput)(data))
  .handler(({ data }) => {
    return AppRuntime.runPromise(
      Effect.gen(function* () {
        yield* Effect.log("createWorkspace");
        const service = yield* WorkspaceService;
        return yield* service.create(data);
      }).pipe(Effect.withSpan("createWorkspace"), Effect.annotateLogs({ topic: data.topic })),
    ).catch(onError);
  });

export const updateWorkspace = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    Schema.decodeUnknownSync(
      Schema.Struct({ id: Schema.String, ...UpdateWorkspaceInput.fields }),
    )(data),
  )
  .handler(({ data }) => {
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
  .handler(({ data }) => {
    return AppRuntime.runPromise(
      Effect.gen(function* () {
        yield* Effect.log("deleteWorkspace");
        const { env } = yield* Effect.tryPromise(() => import("cloudflare:workers"));
        const service = yield* WorkspaceService;

        const { threadIds, r2Keys } = yield* service.cascadeDelete(data.id);

        const cleanupDO = (threadId: string) =>
          Effect.tryPromise({
            try: async () => {
              const ns = env.Teacher as DurableObjectNamespace;
              const stub = ns.get(ns.idFromName(`${data.id}::${threadId}`));
              await (stub as unknown as { deleteStorage(): Promise<void> }).deleteStorage();
            },
            catch: (cause) => new Error(`DO cleanup failed: ${cause}`),
          }).pipe(Effect.catch((e) => Effect.logWarning(e.message)));

        const cleanupR2 = (key: string) =>
          Effect.tryPromise({
            try: () => env.ASTER_R2.delete(key),
            catch: (cause) => new Error(`R2 cleanup failed: ${cause}`),
          }).pipe(Effect.catch((e) => Effect.logWarning(e.message)));

        yield* Effect.all(threadIds.map(cleanupDO), { concurrency: "unbounded" });
        yield* Effect.all(r2Keys.map(cleanupR2), { concurrency: "unbounded" });
      }).pipe(Effect.withSpan("deleteWorkspace"), Effect.annotateLogs({ id: data.id })),
    ).catch(onError);
  });

export const WorkspaceRpc = {
  workspace: () => ["workspace"],
  listWorkspaces: () =>
    queryOptions({
      queryKey: [...WorkspaceRpc.workspace(), "list"],
      queryFn: () => listWorkspaces(),
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
