import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { queryOptions } from "@tanstack/react-query";
import type { ArtifactKind } from "../features/artifact/service";
import { createErrorHandler } from "../error-handler";

/**
 * Generate list + getContent server functions and TanStack Query options
 * for a titled artifact kind (lesson, record, reference).
 */
function createTitledArtifactApi(kind: ArtifactKind, errorMsg: string) {
  const onError = createErrorHandler({ ArtifactError: errorMsg });

  const list = createServerFn({ method: "GET" })
    .validator((data: unknown) =>
      Schema.decodeUnknownSync(Schema.Struct({ workspaceId: Schema.String }))(data),
    )
    .handler(async ({ data }) => {
      // Lazy import: cloudflare:workers is server-only (platform exception)
      const { AppRuntime } = await import("../app-runtime");
      const { ArtifactService } = await import("../features/artifact/service");
      return AppRuntime.runPromise(
        Effect.gen(function* () {
          const service = yield* ArtifactService;
          return yield* service.listTitled(kind)(data.workspaceId);
        }).pipe(Effect.withSpan(`${kind}.list`)),
      ).catch(onError);
    });

  const getContent = createServerFn({ method: "GET" })
    .validator((data: unknown) => {
      const idKey = `${kind}Id` as const;
      return Schema.decodeUnknownSync(
        Schema.Struct({ workspaceId: Schema.String, [idKey]: Schema.String }),
      )(data);
    })
    .handler(async ({ data }) => {
      // Lazy import: cloudflare:workers is server-only (platform exception)
      const { AppRuntime } = await import("../app-runtime");
      const { ArtifactService } = await import("../features/artifact/service");
      return AppRuntime.runPromise(
        Effect.gen(function* () {
          const service = yield* ArtifactService;
          const id = data[`${kind}Id`];
          const content = yield* service.getContent(kind)(id, data.workspaceId);
          if (content === null) return null;
          return { content };
        }).pipe(Effect.withSpan(`${kind}.getContent`)),
      ).catch(onError);
    });

  return { list, getContent };
}

const lesson = createTitledArtifactApi("lesson", "Failed to load lessons.");
const record = createTitledArtifactApi("record", "Failed to load records.");
const reference = createTitledArtifactApi("reference", "Failed to load reference docs.");

function prefix(kind: ArtifactKind, wid: string) {
  return [`${kind}s`, wid] as const;
}

export const LessonRpc = {
  lessons: (wid: string) => prefix("lesson", wid),
  listLessons: (wid: string) =>
    queryOptions({
      queryKey: [...LessonRpc.lessons(wid), "list"],
      queryFn: () => lesson.list({ data: { workspaceId: wid } }),
    }),
  getLessonContent: (wid: string, lid: string) =>
    queryOptions({
      queryKey: [...LessonRpc.lessons(wid), lid],
      queryFn: () => lesson.getContent({ data: { workspaceId: wid, lessonId: lid } }),
    }),
};

export const RecordRpc = {
  records: (wid: string) => prefix("record", wid),
  listRecords: (wid: string) =>
    queryOptions({
      queryKey: [...RecordRpc.records(wid), "list"],
      queryFn: () => record.list({ data: { workspaceId: wid } }),
    }),
  getRecordContent: (wid: string, rid: string) =>
    queryOptions({
      queryKey: [...RecordRpc.records(wid), rid],
      queryFn: () => record.getContent({ data: { workspaceId: wid, recordId: rid } }),
    }),
};

export const ReferenceRpc = {
  references: (wid: string) => prefix("reference", wid),
  listReferences: (wid: string) =>
    queryOptions({
      queryKey: [...ReferenceRpc.references(wid), "list"],
      queryFn: () => reference.list({ data: { workspaceId: wid } }),
    }),
  getReferenceContent: (wid: string, rid: string) =>
    queryOptions({
      queryKey: [...ReferenceRpc.references(wid), rid],
      queryFn: () => reference.getContent({ data: { workspaceId: wid, referenceId: rid } }),
    }),
};