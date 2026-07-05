import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { queryOptions } from "@tanstack/react-query";
import { createErrorHandler } from "../error-handler";

const onError = createErrorHandler({
  ArtifactError: "Failed to load glossary. Please try again.",
});

export const listGlossary = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    Schema.decodeUnknownSync(Schema.Struct({ workspaceId: Schema.String }))(data)
  )
  .handler(async ({ data }) => {
    // Dynamic import: AppRuntime/GlossaryService transitively pull in cloudflare:workers,
    // which doesn't exist in the browser. Lazy-loading keeps this module client-safe.
    const { AppRuntime } = await import("../app-runtime");
    const { GlossaryService } = await import("../features/glossary/service");
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