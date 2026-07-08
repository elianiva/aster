import { appRuntime } from "../app-runtime";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Match, Schema } from "effect";
import { queryOptions } from "@tanstack/react-query";
import {
  ArtifactService,
  type ArtifactKind,
  type ArtifactSummary,
} from "../features/artifact/service";
import { rpcErrorPipe } from "../error-handler";
import { queryKeys } from "./query-keys";

function createTitledArtifactHandlers(kind: ArtifactKind) {
  async function list(data: { workspaceId: string }) {
    return Effect.gen(function*() {
      const result = yield* ArtifactService.use((svc) => svc.listTitled(kind)(data.workspaceId));
      return result;
    }).pipe(
      Effect.withSpan(`${kind}.list`),
      rpcErrorPipe({ ArtifactError: `Failed to load ${kind}s.` }),
      appRuntime().runPromise,
    );
  }

  async function getContent(data: Record<string, string>) {
    return Effect.gen(function*() {
      const id = data[`${kind}Id`];
      const content = yield* ArtifactService.use((svc) =>
        svc.getContent(kind)(id, data.workspaceId),
      );
      if (content === null) return null;
      return { content };
    }).pipe(
      Effect.withSpan(`${kind}.getContent`),
      rpcErrorPipe({ ArtifactError: `Failed to load ${kind}s.` }),
      appRuntime().runPromise,
    );
  }

  return { list, getContent };
}

const lessonHandlers = createTitledArtifactHandlers("lesson");
const recordHandlers = createTitledArtifactHandlers("record");
const referenceHandlers = createTitledArtifactHandlers("reference");

function createTitledArtifactApi(kind: ArtifactKind) {
  const handlers = Match.value(kind).pipe(
    Match.when("lesson", () => lessonHandlers),
    Match.when("record", () => recordHandlers),
    Match.when("reference", () => referenceHandlers),
    Match.exhaustive,
  );

  const list = createServerFn({ method: "GET" })
    .validator((data) =>
      Schema.decodeUnknownSync(Schema.Struct({ workspaceId: Schema.String }))(data),
    )
    .handler(({ data }) => handlers.list(data));

  const getContent = createServerFn({ method: "GET" })
    .validator((data) => {
      const idKey = `${kind}Id` as const;
      return Schema.decodeUnknownSync(
        Schema.Struct({ workspaceId: Schema.String, [idKey]: Schema.String }),
      )(data);
    })
    .handler(({ data }) => handlers.getContent(data));

  return { list, getContent };
}

const lesson = createTitledArtifactApi("lesson");
const record = createTitledArtifactApi("record");
const reference = createTitledArtifactApi("reference");

export const LessonRpc = {
  listLessons: (wid: string) =>
    queryOptions({
      queryKey: queryKeys.lessons.list(wid),
      queryFn: (): Promise<ArtifactSummary[]> => lesson.list({ data: { workspaceId: wid } }),
    }),
  getLessonContent: (wid: string, lid: string) =>
    queryOptions({
      queryKey: [...queryKeys.lessons.all(wid), lid],
      queryFn: (): Promise<{ content: string } | null> =>
        lesson.getContent({ data: { workspaceId: wid, lessonId: lid } }),
    }),
};

export const RecordRpc = {
  listRecords: (wid: string) =>
    queryOptions({
      queryKey: queryKeys.records.list(wid),
      queryFn: (): Promise<ArtifactSummary[]> => record.list({ data: { workspaceId: wid } }),
    }),
  getRecordContent: (wid: string, rid: string) =>
    queryOptions({
      queryKey: [...queryKeys.records.all(wid), rid],
      queryFn: (): Promise<{ content: string } | null> =>
        record.getContent({ data: { workspaceId: wid, recordId: rid } }),
    }),
};

export const ReferenceRpc = {
  listReferences: (wid: string) =>
    queryOptions({
      queryKey: queryKeys.references.list(wid),
      queryFn: (): Promise<ArtifactSummary[]> => reference.list({ data: { workspaceId: wid } }),
    }),
  getReferenceContent: (wid: string, rid: string) =>
    queryOptions({
      queryKey: [...queryKeys.references.all(wid), rid],
      queryFn: (): Promise<{ content: string } | null> =>
        reference.getContent({ data: { workspaceId: wid, referenceId: rid } }),
    }),
};
