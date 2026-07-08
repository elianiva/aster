import { appRuntime } from "~/server/app-runtime";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { queryOptions } from "@tanstack/react-query";
import { ArtifactService, type ArtifactSummary } from "./service";
import { rpcErrorPipe } from "~/server/error-handler";
import { queryKeys } from "~/lib/query-keys";

const listLessons = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    Schema.decodeUnknownSync(Schema.Struct({ workspaceId: Schema.String }))(data),
  )
  .handler(async ({ data }) => {
    return Effect.gen(function*() {
      return yield* ArtifactService.use((svc) => svc.listTitled("lesson", data.workspaceId));
    }).pipe(
      Effect.withSpan("lesson.list"),
      rpcErrorPipe({ ArtifactError: "Failed to load lessons." }),
      appRuntime().runPromise,
    );
  });

const getLessonContent = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    Schema.decodeUnknownSync(
      Schema.Struct({ workspaceId: Schema.String, lessonId: Schema.String }),
    )(data),
  )
  .handler(async ({ data }) => {
    return Effect.gen(function*() {
      const content = yield* ArtifactService.use((svc) =>
        svc.getContent("lesson", data.lessonId, data.workspaceId),
      );
      if (content === null) return null;
      return { content };
    }).pipe(
      Effect.withSpan("lesson.getContent"),
      rpcErrorPipe({ ArtifactError: "Failed to load lessons." }),
      appRuntime().runPromise,
    );
  });

export const LessonRpc = {
  listLessons: (wid: string) =>
    queryOptions({
      queryKey: queryKeys.lessons.list(wid),
      queryFn: (): Promise<ArtifactSummary[]> => listLessons({ data: { workspaceId: wid } }),
    }),
  getLessonContent: (wid: string, lid: string) =>
    queryOptions({
      queryKey: [...queryKeys.lessons.all(wid), lid],
      queryFn: (): Promise<{ content: string } | null> =>
        getLessonContent({ data: { workspaceId: wid, lessonId: lid } }),
    }),
};
