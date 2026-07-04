import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { queryOptions } from "@tanstack/react-query";
import { AppRuntime } from "../app-runtime";
import { NoteService } from "../features/note/service";
import { createErrorHandler } from "../errors";

const onError = createErrorHandler({
  ArtifactError: "Failed to load notes. Please try again.",
});

export const getNote = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    Schema.decodeUnknownSync(Schema.Struct({ workspaceId: Schema.String }))(data)
  )
  .handler(({ data }) => {
    return AppRuntime.runPromise(
      Effect.gen(function* () {
        const service = yield* NoteService;
        return yield* service.getNote(data.workspaceId);
      }).pipe(Effect.withSpan("getNote"))
    ).catch(onError);
  });

export const NoteRpc = {
  notes: (workspaceId: string) => ["notes", workspaceId] as const,
  getNote: (workspaceId: string) =>
    queryOptions({
      queryKey: [...NoteRpc.notes(workspaceId), "get"],
      queryFn: () => getNote({ data: { workspaceId } }),
    }),
};