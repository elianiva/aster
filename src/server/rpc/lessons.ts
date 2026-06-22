import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { queryOptions } from "@tanstack/react-query";
import { eq, and } from "drizzle-orm";
import * as schema from "../db/schema";
import { AppRuntime } from "../app-runtime";
import { Database } from "../db/client";
import { ArtifactQueryFailed } from "../errors";
import { createErrorHandler } from "./errors";

const onError = createErrorHandler({
	ArtifactQueryFailed: "Failed to load lessons. Please try again.",
});

const fail = (msg: string) => (cause: unknown) => new ArtifactQueryFailed({ message: `${msg}: ${cause}` });

export const listLessons = createServerFn({ method: "GET" })
	.validator((data: unknown) =>
		Schema.decodeUnknownSync(Schema.Struct({ workspaceId: Schema.String }))(data)
	)
	.handler(({ data }) => {
		return AppRuntime.runPromise(
			Effect.gen(function* () {
				const { client } = yield* Database;
				const lessons = yield* Effect.tryPromise({
					try: () =>
						client.select().from(schema.lessons).where(eq(schema.lessons.workspaceId, data.workspaceId)),
					catch: fail("Failed to list lessons"),
				});
				return lessons.map((l) => ({
					id: l.id,
					title: l.title,
					createdAt: l.createdAt.toISOString(),
				}));
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
				const { client } = yield* Database;
				const lesson = yield* Effect.tryPromise({
					try: () =>
						client.select().from(schema.lessons)
							.where(and(eq(schema.lessons.id, data.lessonId), eq(schema.lessons.workspaceId, data.workspaceId)))
							.limit(1)
							.then((r) => r[0]),
					catch: fail("Failed to load lesson"),
				});
				if (!lesson) return null;
				const obj = yield* Effect.tryPromise({
					try: () => env.ASTER_R2.get(lesson.r2Key),
					catch: fail("Failed to fetch lesson content"),
				});
				if (!obj) return null;
				return yield* Effect.tryPromise({
					try: () => obj.text(),
					catch: fail("Failed to read lesson content"),
				});
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
