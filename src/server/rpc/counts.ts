import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { queryOptions } from "@tanstack/react-query";
import { AppRuntime } from "../app-runtime";
import { ArtifactService } from "../features/artifact/service";
import { createErrorHandler } from "../errors";

const onError = createErrorHandler({
  ArtifactError: "Failed to load. Please try again.",
});

export const getArtifactCounts = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    Schema.decodeUnknownSync(Schema.Struct({ workspaceId: Schema.String }))(data)
  )
  .handler(({ data }) => {
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
