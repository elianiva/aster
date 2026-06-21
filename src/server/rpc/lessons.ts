import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { queryOptions } from "@tanstack/react-query";
import { drizzle } from "drizzle-orm/d1";
import { eq, and } from "drizzle-orm";
import * as schema from "../db/schema";
import { AppRuntime } from "../app-runtime";

const db = () => drizzle(env.aster_db, { schema });

export const listLessons = createServerFn({ method: "GET" })
	.validator((data: unknown) =>
		Schema.decodeUnknownSync(Schema.Struct({ workspaceId: Schema.String }))(data)
	)
	.handler(({ data }) =>
		AppRuntime.runPromise(
			Effect.gen(function* () {
				const lessons = yield* Effect.promise(() =>
					db().select().from(schema.lessons).where(eq(schema.lessons.workspaceId, data.workspaceId))
				);
				return lessons.map((l) => ({
					id: l.id,
					title: l.title,
					createdAt: l.createdAt.toISOString(),
				}));
			}).pipe(Effect.withSpan("listLessons"))
		)
	);

export const getLessonContent = createServerFn({ method: "GET" })
	.validator((data: unknown) =>
		Schema.decodeUnknownSync(
			Schema.Struct({ workspaceId: Schema.String, lessonId: Schema.String })
		)(data)
	)
	.handler(({ data }) =>
		AppRuntime.runPromise(
			Effect.gen(function* () {
				const lesson = yield* Effect.promise(() =>
					db().select().from(schema.lessons)
						.where(and(eq(schema.lessons.id, data.lessonId), eq(schema.lessons.workspaceId, data.workspaceId)))
						.limit(1)
						.then((r) => r[0])
				);
				if (!lesson) return null;
				const obj = yield* Effect.promise(() => env.ASTER_R2.get(lesson.r2Key));
				if (!obj) return null;
				return yield* Effect.promise(() => obj.text());
			}).pipe(Effect.withSpan("getLessonContent"))
		)
	);

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
