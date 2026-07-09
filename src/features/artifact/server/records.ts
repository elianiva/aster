import { appRuntime } from "~/server/app-runtime";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { queryOptions } from "@tanstack/react-query";
import { ArtifactService, type ArtifactSummary } from "./service";
import { rpcErrorPipe } from "~/server/error-handler";
import { queryKeys } from "~/lib/query-keys";

const listRecords = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    Schema.decodeUnknownSync(Schema.Struct({ workspaceId: Schema.String }))(data),
  )
  .handler(async ({ data }) => {
    return Effect.gen(function* () {
      return yield* ArtifactService.use((svc) => svc.listTitled("record", data.workspaceId));
    }).pipe(
      Effect.withSpan("record.list"),
      rpcErrorPipe({ ArtifactError: "Failed to load records." }),
      appRuntime().runPromise,
    );
  });

const getRecordContent = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    Schema.decodeUnknownSync(
      Schema.Struct({ workspaceId: Schema.String, recordId: Schema.String }),
    )(data),
  )
  .handler(async ({ data }) => {
    return Effect.gen(function* () {
      const content = yield* ArtifactService.use((svc) =>
        svc.getContent("record", data.recordId, data.workspaceId),
      );
      if (content === null) return null;
      return { content };
    }).pipe(
      Effect.withSpan("record.getContent"),
      rpcErrorPipe({ ArtifactError: "Failed to load records." }),
      appRuntime().runPromise,
    );
  });

const getRecord = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    Schema.decodeUnknownSync(
      Schema.Struct({ workspaceId: Schema.String, recordId: Schema.String }),
    )(data),
  )
  .handler(async ({ data }) => {
    return Effect.gen(function* () {
      return yield* ArtifactService.use((svc) =>
        svc.getArtifact("record", data.recordId, data.workspaceId),
      );
    }).pipe(
      Effect.withSpan("record.getArtifact"),
      rpcErrorPipe({ ArtifactError: "Failed to load record." }),
      appRuntime().runPromise,
    );
  });

export const RecordRpc = {
  listRecords: (wid: string) =>
    queryOptions({
      queryKey: queryKeys.records.list(wid),
      queryFn: (): Promise<ArtifactSummary[]> => listRecords({ data: { workspaceId: wid } }),
    }),
  getRecord: (wid: string, rid: string) =>
    queryOptions({
      queryKey: [...queryKeys.records.all(wid), rid, 'detail'],
      queryFn: (): Promise<{ title: string; content: string | null } | null> =>
        getRecord({ data: { workspaceId: wid, recordId: rid } }),
    }),
  getRecordContent: (wid: string, rid: string) =>
    queryOptions({
      queryKey: [...queryKeys.records.all(wid), rid],
      queryFn: (): Promise<{ content: string } | null> =>
        getRecordContent({ data: { workspaceId: wid, recordId: rid } }),
    }),
};
