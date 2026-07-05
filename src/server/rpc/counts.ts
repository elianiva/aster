import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { queryOptions } from "@tanstack/react-query";
import { createErrorHandler } from "../error-handler";

const onError = createErrorHandler({
  ArtifactError: "Failed to load. Please try again.",
});

export const getArtifactCounts = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    Schema.decodeUnknownSync(Schema.Struct({ workspaceId: Schema.String }))(data)
  )
  .handler(async ({ data }) => {
    // Dynamic import: cloudflare:workers is unavailable on the client;
    // static import would break the browser bundle.
    const { AppRuntime } = await import("../app-runtime");
    const { ArtifactService } = await import("../features/artifact/service");
    return AppRuntime.runPromise(
      Effect.gen(function* () {
        const service = yield* ArtifactService;
        return yield* service.getArtifactCounts(data.workspaceId);
      }).pipe(Effect.withSpan("getArtifactCounts"))
    ).catch(onError);
  });

export const CountRpc = {
  counts: (workspaceId: string) => ["counts", workspaceId] as const,
  getArtifactCounts: (workspaceId: string) =>
    queryOptions({
      queryKey: [...CountRpc.counts(workspaceId)],
      queryFn: () => getArtifactCounts({ data: { workspaceId } }),
    }),
};
