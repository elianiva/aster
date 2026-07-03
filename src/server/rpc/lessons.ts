import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { queryOptions } from "@tanstack/react-query";
import { AppRuntime } from "../app-runtime";
import { ArtifactService } from "../features/artifact/service";
import { createErrorHandler } from "../errors";

const onError = createErrorHandler({
  ArtifactError: "Failed to load lessons. Please try again.",
});

export const listLessons = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    Schema.decodeUnknownSync(Schema.Struct({ workspaceId: Schema.String }))(data)
  )
  .handler(({ data }) => {
    return AppRuntime.runPromise(
      Effect.gen(function* () {
        const service = yield* ArtifactService;
        return yield* service.listTitled("lesson")(data.workspaceId);
      }).pipe(Effect.withSpan("listLessons"))
    ).catch(onError);
  });

export const getLessonContent = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    Schema.decodeUnknownSync(
      Schema.Struct({ workspaceId: Schema.String, lessonId: Schema.String })
    )(data)
  )
  .handler(({ data }) => {
    return AppRuntime.runPromise(
      Effect.gen(function* () {
        const service = yield* ArtifactService;
        const content = yield* service.getContent("lesson")(data.lessonId, data.workspaceId);
        if (content === null) return null;
        return { content };
      }).pipe(Effect.withSpan("getLessonContent"))
    ).catch(onError);
  });

export const LessonRpc = {
  lessons: (workspaceId: string) => ["lessons", workspaceId] as const,
  listLessons: (workspaceId: string) =>
    queryOptions({
      queryKey: [...LessonRpc.lessons(workspaceId), "list"],
      queryFn: () => listLessons({ data: { workspaceId } }),
    }),
  getLessonContent: (workspaceId: string, lessonId: string) =>
    queryOptions({
      queryKey: [...LessonRpc.lessons(workspaceId), lessonId],
      queryFn: () => getLessonContent({ data: { workspaceId, lessonId } }),
    }),
};
