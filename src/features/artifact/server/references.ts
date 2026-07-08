import { appRuntime } from "~/server/app-runtime";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { queryOptions } from "@tanstack/react-query";
import { ArtifactService, type ArtifactSummary } from "./service";
import { rpcErrorPipe } from "~/server/error-handler";
import { queryKeys } from "~/lib/query-keys";

const listReferences = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    Schema.decodeUnknownSync(Schema.Struct({ workspaceId: Schema.String }))(data),
  )
  .handler(async ({ data }) => {
    return Effect.gen(function* () {
      return yield* ArtifactService.use((svc) => svc.listTitled("reference", data.workspaceId));
    }).pipe(
      Effect.withSpan("reference.list"),
      rpcErrorPipe({ ArtifactError: "Failed to load references." }),
      appRuntime().runPromise,
    );
  });

const getReferenceContent = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    Schema.decodeUnknownSync(
      Schema.Struct({ workspaceId: Schema.String, referenceId: Schema.String }),
    )(data),
  )
  .handler(async ({ data }) => {
    return Effect.gen(function* () {
      const content = yield* ArtifactService.use((svc) =>
        svc.getContent("reference", data.referenceId, data.workspaceId),
      );
      if (content === null) return null;
      return { content };
    }).pipe(
      Effect.withSpan("reference.getContent"),
      rpcErrorPipe({ ArtifactError: "Failed to load references." }),
      appRuntime().runPromise,
    );
  });

export const ReferenceRpc = {
  listReferences: (wid: string) =>
    queryOptions({
      queryKey: queryKeys.references.list(wid),
      queryFn: (): Promise<ArtifactSummary[]> =>
        listReferences({ data: { workspaceId: wid } }),
    }),
  getReferenceContent: (wid: string, rid: string) =>
    queryOptions({
      queryKey: [...queryKeys.references.all(wid), rid],
      queryFn: (): Promise<{ content: string } | null> =>
        getReferenceContent({ data: { workspaceId: wid, referenceId: rid } }),
    }),
};
