import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { queryOptions } from "@tanstack/react-query";
import { createErrorHandler } from "../error-handler";

const onError = createErrorHandler({
  ArtifactError: "Failed to load notes. Please try again.",
});

export const getNote = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    Schema.decodeUnknownSync(Schema.Struct({ workspaceId: Schema.String }))(data)
  )
  .handler(async ({ data }) => {
    // Static import impossible: AppRuntime/NoteService transitively import
    // "cloudflare:workers", which doesn't exist on the client bundle.
    const { AppRuntime } = await import("../app-runtime");
    const { NoteService } = await import("../features/note/service");
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