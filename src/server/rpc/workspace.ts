import { createServerFn } from "@tanstack/react-start";
import { Effect, Option, Schema } from "effect";
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
      const service = yield* WorkspaceService;
      return yield* service.list();
    }),
  ).catch(errorHandler),
);

export const getWorkspace = createServerFn({ method: "GET" })
  .validator((data: unknown) => Schema.decodeUnknownSync(Schema.Struct({ id: Schema.String }))(data))
  .handler(({ data }) =>
    AppRuntime.runPromise(
      Effect.gen(function* () {
        const service = yield* WorkspaceService;
        const workspace = yield* service.get(data.id);
        return Option.getOrNull(workspace);
      }),
    ).catch(errorHandler),
  );

export const createWorkspace = createServerFn({ method: "POST" })
  .validator((data: unknown) => Schema.decodeUnknownSync(CreateWorkspaceInput)(data))
  .handler(({ data }) =>
    AppRuntime.runPromise(
      Effect.gen(function* () {
        const service = yield* WorkspaceService;
        return yield* service.create(data);
      }),
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
        const service = yield* WorkspaceService;
        const { id, ...input } = data;
        return yield* service.update(id, input);
      }),
    ).catch(errorHandler),
  );

export const deleteWorkspace = createServerFn({ method: "POST" })
  .validator((data: unknown) => Schema.decodeUnknownSync(Schema.Struct({ id: Schema.String }))(data))
  .handler(({ data }) =>
    AppRuntime.runPromise(
      Effect.gen(function* () {
        const service = yield* WorkspaceService;
        yield* service.delete(data.id);
      }),
    ).catch(errorHandler),
  );
