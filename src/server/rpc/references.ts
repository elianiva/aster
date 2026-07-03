import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { queryOptions } from "@tanstack/react-query";
import { AppRuntime } from "../app-runtime";
import { ArtifactService } from "../features/artifact/service";
import { createErrorHandler } from "../errors";

const onError = createErrorHandler({
  ArtifactError: "Failed to load references. Please try again.",
});

export const listReferences = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    Schema.decodeUnknownSync(Schema.Struct({ workspaceId: Schema.String }))(data)
  )
  .handler(({ data }) => {
    return AppRuntime.runPromise(
      Effect.gen(function* () {
        const service = yield* ArtifactService;
        return yield* service.listTitled("reference")(data.workspaceId);
      }).pipe(Effect.withSpan("listReferences"))
    ).catch(onError);
  });

export const getReferenceContent = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    Schema.decodeUnknownSync(
      Schema.Struct({ workspaceId: Schema.String, referenceId: Schema.String })
    )(data)
  )
  .handler(({ data }) => {
    return AppRuntime.runPromise(
      Effect.gen(function* () {
        const service = yield* ArtifactService;
        const content = yield* service.getContent("reference")(data.referenceId, data.workspaceId);
        if (content === null) return null;
        return { content };
      }).pipe(Effect.withSpan("getReferenceContent"))
    ).catch(onError);
  });

export const ReferenceRpc = {
  references: (workspaceId: string) => ["references", workspaceId] as const,
  listReferences: (workspaceId: string) =>
    queryOptions({
      queryKey: [...ReferenceRpc.references(workspaceId), "list"],
      queryFn: () => listReferences({ data: { workspaceId } }),
    }),
  getReferenceContent: (workspaceId: string, referenceId: string) =>
    queryOptions({
      queryKey: [...ReferenceRpc.references(workspaceId), referenceId],
      queryFn: () => getReferenceContent({ data: { workspaceId, referenceId } }),
    }),
};
