import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { queryOptions } from "@tanstack/react-query";
import { AppRuntime } from "../app-runtime";
import { ResourceService } from "../features/resource/service";
import { createErrorHandler } from "../errors";

const onError = createErrorHandler({
  ArtifactError: "Failed to load resources. Please try again.",
});

export const listResources = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    Schema.decodeUnknownSync(Schema.Struct({ workspaceId: Schema.String }))(data)
  )
  .handler(({ data }) => {
    return AppRuntime.runPromise(
      Effect.gen(function* () {
        const service = yield* ResourceService;
        return yield* service.listResources(data.workspaceId);
      }).pipe(Effect.withSpan("listResources"))
    ).catch(onError);
  });

export const ResourceRpc = {
  resources: (workspaceId: string) => ["resources", workspaceId] as const,
  listResources: (workspaceId: string) =>
    queryOptions({
      queryKey: [...ResourceRpc.resources(workspaceId), "list"],
      queryFn: () => listResources({ data: { workspaceId } }),
    }),
};