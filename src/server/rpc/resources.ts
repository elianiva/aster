import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { queryOptions } from "@tanstack/react-query";
import { createErrorHandler } from "../error-handler";

const onError = createErrorHandler({
  ArtifactError: "Failed to load resources. Please try again.",
});

export const listResources = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    Schema.decodeUnknownSync(Schema.Struct({ workspaceId: Schema.String }))(data)
  )
  .handler(async ({ data }) => {
    // Dynamic import: cloudflare:workers is unavailable on the client bundle.
    const { AppRuntime } = await import("../app-runtime");
    const { ResourceService } = await import("../features/resource/service");
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