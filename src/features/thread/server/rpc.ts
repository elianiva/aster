import { appRuntime } from "~/server/app-runtime"
import { createServerFn } from "@tanstack/react-start";
import { Effect, Option, Schema } from "effect";
import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { ThreadService, type Thread } from "./service"
import type { CreateThreadInput, RenameThreadInput, SetTeachingModeInput } from "./service"
import { deleteDOStorage } from "~/server/durable-object-helpers"
import { rpcErrorPipe } from "~/server/error-handler"
import { queryKeys } from "~/lib/query-keys"

export const setTeachingMode = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    Schema.decodeUnknownSync(
      Schema.Struct({ id: Schema.String, enabled: Schema.Boolean }),
    )(data),
  )
  .handler(async ({ data }) => {
    return Effect.gen(function* () {
      return yield* ThreadService.use((svc) => svc.setTeachingMode(data.id, data.enabled));
    }).pipe(
      Effect.withSpan("setTeachingMode"),
      rpcErrorPipe({
        ThreadNotFound: "Thread not found. It may have been deleted.",
        PersistenceError: "Failed to complete operation. Please try again.",
      }),
      appRuntime().runPromise,
    );
  });

export const listThreads = createServerFn({ method: "GET" })
  .validator((data: unknown) => Schema.decodeUnknownSync(Schema.Struct({ workspaceId: Schema.String }))(data))
  .handler(async ({ data }) => {
    return Effect.gen(function* () {
      return yield* ThreadService.use((svc) => svc.list(data.workspaceId));
    }).pipe(
      Effect.withSpan("listThreads"),
      rpcErrorPipe({
        ThreadNotFound: "Thread not found. It may have been deleted.",
        PersistenceError: "Failed to complete operation. Please try again.",
      }),
      appRuntime().runPromise,
    );
  });

export const createThread = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    Schema.decodeUnknownSync(
      Schema.Struct({
        workspaceId: Schema.String,
        name: Schema.optional(Schema.String),
      }),
    )(data),
  )
  .handler(async ({ data }) => {
    return Effect.gen(function* () {
      return yield* ThreadService.use((svc) => svc.create(data));
    }).pipe(
      Effect.withSpan("createThread"),
      rpcErrorPipe({
        ThreadNotFound: "Thread not found. It may have been deleted.",
        PersistenceError: "Failed to complete operation. Please try again.",
      }),
      appRuntime().runPromise,
    );
  });

export const renameThread = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    Schema.decodeUnknownSync(
      Schema.Struct({ id: Schema.String, name: Schema.String }),
    )(data),
  )
  .handler(async ({ data }) => {
    return Effect.gen(function* () {
      return yield* ThreadService.use((svc) => svc.rename(data.id, data.name));
    }).pipe(
      Effect.withSpan("renameThread"),
      rpcErrorPipe({
        ThreadNotFound: "Thread not found. It may have been deleted.",
        PersistenceError: "Failed to complete operation. Please try again.",
      }),
      appRuntime().runPromise,
    );
  });

export const deleteThread = createServerFn({ method: "POST" })
  .validator((data: unknown) => Schema.decodeUnknownSync(Schema.Struct({ id: Schema.String }))(data))
  .handler(async ({ data }) => {
    return Effect.gen(function* () {
      const threads = yield* ThreadService;
      const existing = yield* threads.get(data.id);
      if (Option.isSome(existing)) {
        yield* threads.delete(data.id);
        yield* deleteDOStorage(`${existing.value.workspaceId}::${data.id}`).pipe(
          Effect.catch((error) =>
            Effect.log(`DO cleanup failed for thread ${data.id}: ${error.message}`),
          ),
        );
      }
    }).pipe(
      Effect.withSpan("deleteThread"),
      rpcErrorPipe({
        ThreadNotFound: "Thread not found. It may have been deleted.",
        PersistenceError: "Failed to complete operation. Please try again.",
      }),
      appRuntime().runPromise,
    );
  });

export const getThread = createServerFn({ method: "GET" })
  .validator((data: unknown) => Schema.decodeUnknownSync(Schema.Struct({ id: Schema.String }))(data))
  .handler(async ({ data }) => {
    return Effect.gen(function* () {
      const result = yield* ThreadService.use((svc) => svc.get(data.id));
      return Option.getOrNull(result);
    }).pipe(
      Effect.withSpan("getThread"),
      rpcErrorPipe({
        ThreadNotFound: "Thread not found. It may have been deleted.",
        PersistenceError: "Failed to complete operation. Please try again.",
      }),
      appRuntime().runPromise,
    );
  });

export const ThreadRpc = {
  listThreads: (workspaceId: string) =>
    queryOptions({
      queryKey: queryKeys.threads.list(workspaceId),
      queryFn: (): Promise<Thread[]> => listThreads({ data: { workspaceId } }),
    }),
  getThread: (threadId: string) =>
    queryOptions({
      queryKey: queryKeys.threads.detail(threadId),
      queryFn: (): Promise<Thread | null> => getThread({ data: { id: threadId } }),
    }),
  createThread: () =>
    mutationOptions({
      mutationKey: ["thread", "create"],
      mutationFn: (input: CreateThreadInput) => createThread({ data: input }),
    }),
  renameThread: () =>
    mutationOptions({
      mutationKey: ["thread", "rename"],
      mutationFn: (input: RenameThreadInput) => renameThread({ data: input }),
    }),
  deleteThread: () =>
    mutationOptions({
      mutationKey: ["thread", "delete"],
      mutationFn: (input: { id: string }) => deleteThread({ data: input }),
    }),
  setTeachingMode: () =>
    mutationOptions({
      mutationKey: ["thread", "setTeachingMode"],
      mutationFn: (input: SetTeachingModeInput) => setTeachingMode({ data: input }),
    }),
};
