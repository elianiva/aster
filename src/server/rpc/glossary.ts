import { appRuntime } from "../app-runtime";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { queryOptions } from "@tanstack/react-query";
import { GlossaryService, type GlossaryEntry } from "../features/glossary/service";
import { rpcErrorPipe } from "../error-handler";
import { queryKeys } from "./query-keys";

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
        GlossaryPersistenceFailed: "Failed to load glossary. Please try again.",
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
};
