import { appRuntime } from "../app-runtime";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { queryOptions } from "@tanstack/react-query";
import { ArtifactService } from "../features/artifact/service";
import { rpcErrorPipe } from "../error-handler";
import { queryKeys } from "./query-keys";

export const getArtifactCounts = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    Schema.decodeUnknownSync(Schema.Struct({ workspaceId: Schema.String }))(data),
  )
  .handler(async ({ data }) => {
    return Effect.gen(function*() {
      return yield* ArtifactService.use((svc) => svc.getArtifactCounts(data.workspaceId));
    }).pipe(
      Effect.withSpan("getArtifactCounts"),
      rpcErrorPipe({
        ArtifactError: "Failed to load. Please try again.",
      }),
      appRuntime().runPromise,
    );
  });

export const CountRpc = {
  getArtifactCounts: (workspaceId: string) =>
    queryOptions({
      queryKey: queryKeys.counts.all(workspaceId),
      queryFn: (): Promise<{
        threads: number;
        lessons: number;
        records: number;
        references: number;
        glossary: number;
        resources: number;
        notes: number;
      }> => getArtifactCounts({ data: { workspaceId } }),
    }),
};
