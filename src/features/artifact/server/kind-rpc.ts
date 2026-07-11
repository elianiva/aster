import { appRuntime } from "~/server/app-runtime";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { queryOptions } from "@tanstack/react-query";
import { ArtifactService, type ArtifactKind, type ArtifactSummary } from "./service";
import { rpcErrorPipe } from "~/server/error-handler";
import { queryKeys } from "~/lib/query-keys";

export function createArtifactRpc(kind: ArtifactKind, fieldId: string) {
  const listServerFn = createServerFn({ method: "GET" })
    .validator((data: unknown) =>
      Schema.decodeUnknownSync(Schema.Struct({ workspaceId: Schema.String }))(data),
    )
    .handler(async ({ data }) => {
      return Effect.gen(function* () {
        return yield* ArtifactService.use((svc) => svc.listTitled(kind, data.workspaceId));
      }).pipe(
        Effect.withSpan(`${kind}.list`),
        rpcErrorPipe({ ArtifactError: `Failed to load ${kind}s.`, PersistenceError: `Failed to load ${kind}s.` }),
        appRuntime().runPromise,
      );
    });

  const getContentServerFn = createServerFn({ method: "GET" })
    .validator((data: unknown) =>
      Schema.decodeUnknownSync(
        Schema.Struct({ workspaceId: Schema.String, [fieldId]: Schema.String }),
      )(data),
    )
    .handler(async ({ data }) => {
      return Effect.gen(function* () {
        const id = (data as Record<string, string>)[fieldId];
        const content = yield* ArtifactService.use((svc) =>
          svc.getContent(kind, id, data.workspaceId),
        );
        if (content === null) return null;
        return { content };
      }).pipe(
        Effect.withSpan(`${kind}.getContent`),
        rpcErrorPipe({ ArtifactError: `Failed to load ${kind}s.`, PersistenceError: `Failed to load ${kind}s.` }),
        appRuntime().runPromise,
      );
    });

  const getServerFn = createServerFn({ method: "GET" })
    .validator((data: unknown) =>
      Schema.decodeUnknownSync(
        Schema.Struct({ workspaceId: Schema.String, [fieldId]: Schema.String }),
      )(data),
    )
    .handler(async ({ data }) => {
      return Effect.gen(function* () {
        const id = (data as Record<string, string>)[fieldId];
        return yield* ArtifactService.use((svc) =>
          svc.getArtifact(kind, id, data.workspaceId),
        );
      }).pipe(
        Effect.withSpan(`${kind}.getArtifact`),
        rpcErrorPipe({ ArtifactError: `Failed to load ${kind}.`, PersistenceError: `Failed to load ${kind}.` }),
        appRuntime().runPromise,
      );
    });

  const keyFactory =
    kind === "lesson" ? queryKeys.lessons
    : kind === "record" ? queryKeys.records
    : queryKeys.references;

  return {
    list: (wid: string) =>
      queryOptions({
        queryKey: keyFactory.list(wid),
        queryFn: (): Promise<ArtifactSummary[]> =>
          listServerFn({ data: { workspaceId: wid } }),
      }),
    getContent: (wid: string, id: string) =>
      queryOptions({
        queryKey: [...keyFactory.all(wid), id],
        queryFn: (): Promise<{ content: string } | null> =>
          getContentServerFn({ data: { workspaceId: wid, [fieldId]: id } }),
      }),
    get: (wid: string, id: string) =>
      queryOptions({
        queryKey: [...keyFactory.all(wid), id, "detail"],
        queryFn: (): Promise<{ title: string; content: string | null } | null> =>
          getServerFn({ data: { workspaceId: wid, [fieldId]: id } }),
      }),
  } as const;
}
