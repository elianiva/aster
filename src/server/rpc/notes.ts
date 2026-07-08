import { appRuntime } from "../app-runtime";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { queryOptions } from "@tanstack/react-query";
import { NoteService, type NoteContent } from "../features/note/service";
import { rpcErrorPipe } from "../error-handler";
import { queryKeys } from "./query-keys";

export const getNote = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    Schema.decodeUnknownSync(Schema.Struct({ workspaceId: Schema.String }))(data)
  )
  .handler(async ({ data }) => {
    return Effect.gen(function* () {
      return yield* NoteService.use((svc) => svc.getNote(data.workspaceId));
    }).pipe(
      Effect.withSpan("getNote"),
      rpcErrorPipe({
        NotePersistenceFailed: "Failed to load notes. Please try again.",
      }),
      appRuntime().runPromise,
    );
  });

export const NoteRpc = {
  getNote: (workspaceId: string) =>
    queryOptions({
      queryKey: queryKeys.notes.get(workspaceId),
      queryFn: (): Promise<NoteContent | null> => getNote({ data: { workspaceId } }),
    }),
};
