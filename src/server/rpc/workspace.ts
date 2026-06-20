import { createServerFn } from "@tanstack/react-start";
import { Effect, Option, Schema } from "effect";
import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { WorkspaceService, CreateWorkspaceInput, UpdateWorkspaceInput } from "../features/workspace/service";
import { AppRuntime } from "../app-runtime";
import { createErrorHandler } from "./errors";

const errorHandler = createErrorHandler({
  WorkspaceNotFound: "Workspace not found. It may have been deleted.",
  WorkspaceQueryFailed: "Failed to load workspaces. Please try again.",
  WorkspaceInsertFailed: "Failed to create workspace. Please try again.",
  WorkspaceUpdateFailed: "Failed to update workspace. Please try again.",
  WorkspaceDeleteFailed: "Failed to delete workspace. Please try again.",
});

export const listWorkspaces = createServerFn({ method: "GET" }).handler(() =>
  AppRuntime.runPromise(
    Effect.gen(function* () {
      yield* Effect.log("listWorkspaces");
      const service = yield* WorkspaceService;
      return yield* service.list();
    }).pipe(Effect.withSpan("listWorkspaces")),
  ).catch(errorHandler),
);

export const getWorkspace = createServerFn({ method: "GET" })
  .validator((data: unknown) => Schema.decodeUnknownSync(Schema.Struct({ id: Schema.String }))(data))
  .handler(({ data }) =>
    AppRuntime.runPromise(
      Effect.gen(function* () {
        yield* Effect.log("getWorkspace");
        const service = yield* WorkspaceService;
        const workspace = yield* service.get(data.id);
        return Option.getOrNull(workspace);
      }).pipe(Effect.withSpan("getWorkspace"), Effect.annotateLogs({ id: data.id })),
    ).catch(errorHandler),
  );

export const createWorkspace = createServerFn({ method: "POST" })
  .validator((data: unknown) => Schema.decodeUnknownSync(CreateWorkspaceInput)(data))
  .handler(({ data }) =>
    AppRuntime.runPromise(
      Effect.gen(function* () {
        yield* Effect.log("createWorkspace");
        const service = yield* WorkspaceService;
        return yield* service.create(data);
      }).pipe(Effect.withSpan("createWorkspace"), Effect.annotateLogs({ topic: data.topic })),
    ).catch(errorHandler),
  );

export const updateWorkspace = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    Schema.decodeUnknownSync(
      Schema.Struct({ id: Schema.String, ...UpdateWorkspaceInput.fields }),
    )(data),
  )
  .handler(({ data }) =>
    AppRuntime.runPromise(
      Effect.gen(function* () {
        yield* Effect.log("updateWorkspace");
        const service = yield* WorkspaceService;
        const { id, ...input } = data;
        return yield* service.update(id, input);
      }).pipe(Effect.withSpan("updateWorkspace"), Effect.annotateLogs({ id: data.id })),
    ).catch(errorHandler),
  );

export const deleteWorkspace = createServerFn({ method: "POST" })
  .validator((data: unknown) => Schema.decodeUnknownSync(Schema.Struct({ id: Schema.String }))(data))
  .handler(({ data }) =>
    AppRuntime.runPromise(
      Effect.gen(function* () {
        yield* Effect.log("deleteWorkspace");
        const service = yield* WorkspaceService;
        yield* service.delete(data.id);
      }).pipe(Effect.withSpan("deleteWorkspace"), Effect.annotateLogs({ id: data.id })),
    ).catch(errorHandler),
  );

export const incrementThreadCount = createServerFn({ method: "POST" })
  .validator((data: unknown) => Schema.decodeUnknownSync(Schema.Struct({ id: Schema.String, delta: Schema.Number }))(data))
  .handler(({ data }) =>
    AppRuntime.runPromise(
      Effect.gen(function* () {
        yield* Effect.log("incrementThreadCount");
        const service = yield* WorkspaceService;
        yield* service.incrementThreadCount(data.id, data.delta);
      }).pipe(Effect.withSpan("incrementThreadCount"), Effect.annotateLogs({ id: data.id, delta: data.delta })),
    ).catch(errorHandler),
  );

export const incrementLessonCount = createServerFn({ method: "POST" })
  .validator((data: unknown) => Schema.decodeUnknownSync(Schema.Struct({ id: Schema.String, delta: Schema.Number }))(data))
  .handler(({ data }) =>
    AppRuntime.runPromise(
      Effect.gen(function* () {
        yield* Effect.log("incrementLessonCount");
        const service = yield* WorkspaceService;
        yield* service.incrementLessonCount(data.id, data.delta);
      }).pipe(Effect.withSpan("incrementLessonCount"), Effect.annotateLogs({ id: data.id, delta: data.delta })),
    ).catch(errorHandler),
  );

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
  incrementThreadCount: () =>
    mutationOptions({
      mutationKey: [...WorkspaceRpc.workspace()],
      mutationFn: (input: { id: string; delta: number }) => incrementThreadCount({ data: input }),
    }),
  incrementLessonCount: () =>
    mutationOptions({
      mutationKey: [...WorkspaceRpc.workspace()],
      mutationFn: (input: { id: string; delta: number }) => incrementLessonCount({ data: input }),
    }),
};
