import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { queryOptions } from "@tanstack/react-query";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema";
import { AppRuntime } from "../app-runtime";

const db = () => drizzle(env.aster_db, { schema });

export const getNote = createServerFn({ method: "GET" })
	.validator((data: unknown) =>
		Schema.decodeUnknownSync(Schema.Struct({ workspaceId: Schema.String }))(data)
	)
	.handler(({ data }) =>
		AppRuntime.runPromise(
			Effect.gen(function* () {
				const note = yield* Effect.promise(() =>
					db().select().from(schema.notes)
						.where(eq(schema.notes.workspaceId, data.workspaceId))
						.limit(1)
						.then((r) => r[0])
				);
				if (!note) return null;
				const obj = yield* Effect.promise(() => env.ASTER_R2.get(note.r2Key));
				if (!obj) return null;
				const content = yield* Effect.promise(() => obj.text());
				return {
					content,
					createdAt: note.createdAt.toISOString(),
					updatedAt: note.updatedAt.toISOString(),
				};
			}).pipe(Effect.withSpan("getNote"))
		)
	);

export const NoteRpc = {
	notes: (workspaceId: string) => ["notes", workspaceId] as const,
	getNote: (workspaceId: string) =>
		queryOptions({
			queryKey: [...NoteRpc.notes(workspaceId), "get"],
			queryFn: () => getNote({ data: { workspaceId } }),
		}),
};
