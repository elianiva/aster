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

export const listWorkspaces = createServerFn({ method: "GET" }).handler(() =>
  AppRuntime.runPromise(
    Effect.gen(function* () {
      const service = yield* WorkspaceService;
      return yield* service.list();
    }),
  ),
);

export const getWorkspace = createServerFn({ method: "GET" })
  .validator((data: unknown) => Schema.decodeUnknownSync(Schema.Struct({ id: Schema.String }))(data))
  .handler(({ data }) =>
    AppRuntime.runPromise(
      Effect.gen(function* () {
        const service = yield* WorkspaceService;
        return yield* service.get(data.id);
      }),
    ),
  );

export const createWorkspace = createServerFn({ method: "POST" })
  .validator((data: unknown) => Schema.decodeUnknownSync(CreateWorkspaceInput)(data))
  .handler(({ data }) =>
    AppRuntime.runPromise(
      Effect.gen(function* () {
        const service = yield* WorkspaceService;
        return yield* service.create(data);
      }),
    ),
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
    ),
  );

export const deleteWorkspace = createServerFn({ method: "POST" })
  .validator((data: unknown) => Schema.decodeUnknownSync(Schema.Struct({ id: Schema.String }))(data))
  .handler(({ data }) =>
    AppRuntime.runPromise(
      Effect.gen(function* () {
        const service = yield* WorkspaceService;
        yield* service.delete(data.id);
      }),
    ),
  );
