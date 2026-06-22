import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { queryOptions } from "@tanstack/react-query";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema";
import { AppRuntime } from "../app-runtime";
import { Database } from "../db/client";
import { ArtifactQueryFailed } from "../errors";
import { createErrorHandler } from "./errors";

const onError = createErrorHandler({
	ArtifactQueryFailed: "Failed to load notes. Please try again.",
});

const fail = (msg: string) => (cause: unknown) => new ArtifactQueryFailed({ message: `${msg}: ${cause}` });

export const getNote = createServerFn({ method: "GET" })
	.validator((data: unknown) =>
		Schema.decodeUnknownSync(Schema.Struct({ workspaceId: Schema.String }))(data)
	)
	.handler(({ data }) => {
		const ctx = getRequestContext();
		return AppRuntime.runPromise(
			Effect.gen(function* () {
				const { client } = yield* Database;
				const note = yield* Effect.tryPromise({
					try: () =>
						client.select().from(schema.notes)
							.where(eq(schema.notes.workspaceId, data.workspaceId))
							.limit(1)
							.then((r) => r[0]),
					catch: fail("Failed to load note"),
				});
				if (!note) return null;
				const obj = yield* Effect.tryPromise({
					try: () => env.ASTER_R2.get(note.r2Key),
					catch: fail("Failed to fetch note content"),
				});
				if (!obj) return null;
				const content = yield* Effect.tryPromise({
					try: () => obj.text(),
					catch: fail("Failed to read note content"),
				});
				return {
					content,
					createdAt: note.createdAt.toISOString(),
					updatedAt: note.updatedAt.toISOString(),
				};
			}).pipe(Effect.withSpan("getNote"))
		).catch(onError);
	});

export const NoteRpc = {
	notes: (workspaceId: string) => ["notes", workspaceId] as const,
	getNote: (workspaceId: string) =>
		queryOptions({
			queryKey: [...NoteRpc.notes(workspaceId), "get"],
			queryFn: () => getNote({ data: { workspaceId } }),
		}),
};
