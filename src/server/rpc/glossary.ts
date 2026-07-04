import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { queryOptions } from "@tanstack/react-query";
import { AppRuntime } from "../app-runtime";
import { GlossaryService } from "../features/glossary/service";
import { createErrorHandler } from "../errors";

const onError = createErrorHandler({
  ArtifactError: "Failed to load glossary. Please try again.",
});

export const listGlossary = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    Schema.decodeUnknownSync(Schema.Struct({ workspaceId: Schema.String }))(data)
  )
  .handler(({ data }) => {
    return AppRuntime.runPromise(
      Effect.gen(function* () {
        const service = yield* GlossaryService;
        return yield* service.listGlossary(data.workspaceId);
      }).pipe(Effect.withSpan("listGlossary"))
    ).catch(onError);
  });

export const GlossaryRpc = {
  glossary: (workspaceId: string) => ["glossary", workspaceId] as const,
  listGlossary: (workspaceId: string) =>
    queryOptions({
      queryKey: [...GlossaryRpc.glossary(workspaceId), "list"],
      queryFn: () => listGlossary({ data: { workspaceId } }),
    }),
};