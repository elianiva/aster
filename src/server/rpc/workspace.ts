import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { WorkspaceService } from "../features/workspace/service";
import { AppRuntime } from "../app-runtime";

const CreateWorkspaceInput = Schema.Struct({
  topic: Schema.String,
  mission: Schema.String,
  currentKnowledge: Schema.String,
});

const UpdateWorkspaceInput = Schema.Struct({
  topic: Schema.optional(Schema.String),
  mission: Schema.optional(Schema.String),
  currentKnowledge: Schema.optional(Schema.String),
});

function errorHandler(error: unknown): never {
  if (error && typeof error === "object" && "_tag" in error) {
    switch (error._tag) {
      case "WorkspaceNotFound":
        throw new Error("Workspace not found. It may have been deleted.");
      case "WorkspaceQueryFailed":
        throw new Error("Failed to load workspaces. Please try again.");
      case "WorkspaceInsertFailed":
        throw new Error("Failed to create workspace. Please try again.");
      case "WorkspaceUpdateFailed":
        throw new Error("Failed to update workspace. Please try again.");
      case "WorkspaceDeleteFailed":
        throw new Error("Failed to delete workspace. Please try again.");
      default:
        throw new Error("Something went wrong. Please try again.");
    }
  }
  throw new Error("Something went wrong. Please try again.");
}

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
        return yield* service.get(data.id);
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
