import { appRuntime } from "~/server/app-runtime"
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { queryOptions } from "@tanstack/react-query";
import { GlossaryService, type GlossaryEntry } from "./service"
import { rpcErrorPipe } from "~/server/error-handler"
import { queryKeys } from "~/lib/query-keys"

export const listGlossary = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    Schema.decodeUnknownSync(Schema.Struct({ workspaceId: Schema.String }))(data)
  )
  .handler(async ({ data }) => {
    return Effect.gen(function* () {
      return yield* GlossaryService.use((svc) => svc.listGlossary(data.workspaceId));
    }).pipe(
      Effect.withSpan("listGlossary"),
      rpcErrorPipe({
        PersistenceError: "Failed to load glossary. Please try again.",
      }),
      appRuntime().runPromise,
    );
  });
export const getGlossaryById = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    Schema.decodeUnknownSync(Schema.Struct({
      workspaceId: Schema.String,
      termId: Schema.String,
    }))(data)
  )
  .handler(async ({ data }) => {
    return Effect.gen(function* () {
      return yield* GlossaryService.use((svc) =>
        svc.getGlossaryById(data.termId, data.workspaceId),
      );
    }).pipe(
      Effect.withSpan("getGlossaryById"),
      rpcErrorPipe({
        PersistenceError: "Failed to load glossary term. Please try again.",
      }),
      appRuntime().runPromise,
    );
  });

export const GlossaryRpc = {
  listGlossary: (workspaceId: string) =>
    queryOptions({
      queryKey: queryKeys.glossary.list(workspaceId),
      queryFn: (): Promise<GlossaryEntry[]> => listGlossary({ data: { workspaceId } }),
    }),
  getGlossaryById: (workspaceId: string, termId: string) =>
    queryOptions({
      queryKey: queryKeys.glossary.byId(workspaceId, termId),
      queryFn: (): Promise<GlossaryEntry | null> =>
        getGlossaryById({ data: { workspaceId, termId } }),
    }),
};
