import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { mutationOptions, queryOptions } from "@tanstack/react-query";
import {
  ThreadService,
  CreateThreadInput,
  RenameThreadInput,
} from "../features/thread/service";
import { AppRuntime } from "../app-runtime";
import { createErrorHandler } from "./errors";

const onError = createErrorHandler({
  ThreadNotFound: "Thread not found. It may have been deleted.",
  ThreadQueryFailed: "Failed to load threads. Please try again.",
  ThreadInsertFailed: "Failed to create thread. Please try again.",
  ThreadUpdateFailed: "Failed to update thread. Please try again.",
  ThreadDeleteFailed: "Failed to delete thread. Please try again.",
});

export const listThreads = createServerFn({ method: "GET" })
  .validator((data: unknown) => Schema.decodeUnknownSync(Schema.Struct({ workspaceId: Schema.String }))(data))
  .handler(({ data }) => {
    return AppRuntime.runPromise(
      Effect.gen(function* () {
        const service = yield* ThreadService;
        return yield* service.list(data.workspaceId);
      }).pipe(Effect.withSpan("listThreads")),
    ).catch(onError);
  });

export const createThread = createServerFn({ method: "POST" })
  .validator((data: unknown) => Schema.decodeUnknownSync(CreateThreadInput)(data))
  .handler(({ data }) => {
    return AppRuntime.runPromise(
      Effect.gen(function* () {
        const service = yield* ThreadService;
        return yield* service.create(data);
      }).pipe(Effect.withSpan("createThread")),
    ).catch(onError);
  });

export const renameThread = createServerFn({ method: "POST" })
  .validator((data: unknown) => Schema.decodeUnknownSync(RenameThreadInput)(data))
  .handler(({ data }) => {
    return AppRuntime.runPromise(
      Effect.gen(function* () {
        const service = yield* ThreadService;
        return yield* service.rename(data.id, data.name);
      }).pipe(Effect.withSpan("renameThread")),
    ).catch(onError);
  });

export const deleteThread = createServerFn({ method: "POST" })
  .validator((data: unknown) => Schema.decodeUnknownSync(Schema.Struct({ id: Schema.String }))(data))
  .handler(({ data }) => {
    return AppRuntime.runPromise(
      Effect.gen(function* () {
        const threads = yield* ThreadService;
        yield* threads.delete(data.id);
      }).pipe(Effect.withSpan("deleteThread")),
    ).catch(onError);
  });

export const ThreadRpc = {
  thread: (workspaceId: string) => ["thread", workspaceId] as const,
  listThreads: (workspaceId: string) =>
    queryOptions({
      queryKey: [...ThreadRpc.thread(workspaceId), "list"],
      queryFn: () => listThreads({ data: { workspaceId } }),
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
};
