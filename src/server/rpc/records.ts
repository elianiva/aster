import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { queryOptions } from "@tanstack/react-query";
import { AppRuntime } from "../app-runtime";
import { ArtifactService } from "../features/artifact/service";
import { createErrorHandler } from "../errors";

const onError = createErrorHandler({
  ArtifactError: "Failed to load records. Please try again.",
});

export const listRecords = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    Schema.decodeUnknownSync(Schema.Struct({ workspaceId: Schema.String }))(data)
  )
  .handler(({ data }) => {
    return AppRuntime.runPromise(
      Effect.gen(function* () {
        const service = yield* ArtifactService;
        return yield* service.listTitled("record")(data.workspaceId);
      }).pipe(Effect.withSpan("listRecords"))
    ).catch(onError);
  });

export const getRecordContent = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    Schema.decodeUnknownSync(
      Schema.Struct({ workspaceId: Schema.String, recordId: Schema.String })
    )(data)
  )
  .handler(({ data }) => {
    return AppRuntime.runPromise(
      Effect.gen(function* () {
        const service = yield* ArtifactService;
        const content = yield* service.getContent("record")(data.recordId, data.workspaceId);
        if (content === null) return null;
        return { content };
      }).pipe(Effect.withSpan("getRecordContent"))
    ).catch(onError);
  });

export const RecordRpc = {
  records: (workspaceId: string) => ["records", workspaceId] as const,
  listRecords: (workspaceId: string) =>
    queryOptions({
      queryKey: [...RecordRpc.records(workspaceId), "list"],
      queryFn: () => listRecords({ data: { workspaceId } }),
    }),
  getRecordContent: (workspaceId: string, recordId: string) =>
    queryOptions({
      queryKey: [...RecordRpc.records(workspaceId), recordId],
      queryFn: () => getRecordContent({ data: { workspaceId, recordId } }),
    }),
};
