import { appRuntime } from "~/server/app-runtime"
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { queryOptions } from "@tanstack/react-query";
import { ResourceService, type ResourceEntry } from "./service"
import { rpcErrorPipe } from "~/server/error-handler"
import { queryKeys } from "~/lib/query-keys"

export const listResources = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    Schema.decodeUnknownSync(Schema.Struct({ workspaceId: Schema.String }))(data)
  )
  .handler(async ({ data }) => {
    return Effect.gen(function* () {
      return yield* ResourceService.use((svc) => svc.listResources(data.workspaceId));
    }).pipe(
      Effect.withSpan("listResources"),
      rpcErrorPipe({
        PersistenceError: "Failed to load resources. Please try again.",
      }),
      appRuntime().runPromise,
    );
  });

export const ResourceRpc = {
  listResources: (workspaceId: string) =>
    queryOptions({
      queryKey: queryKeys.resources.list(workspaceId),
      queryFn: (): Promise<ResourceEntry[]> => listResources({ data: { workspaceId } }),
    }),
};
