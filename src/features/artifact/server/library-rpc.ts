import { appRuntime } from "~/server/app-runtime";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { queryOptions } from "@tanstack/react-query";
import { ArtifactService, type ArtifactKind } from "./service";
import { rpcErrorPipe } from "~/server/error-handler";
import { queryKeys } from "~/lib/query-keys";

export interface LibraryItem {
	id: string;
	title: string;
	createdAt: string;
	kind: ArtifactKind;
}

const listAllArtifacts = createServerFn({ method: "GET" })
	.validator((data: unknown) =>
		Schema.decodeUnknownSync(Schema.Struct({ workspaceId: Schema.String }))(data),
	)
	.handler(async ({ data }) => {
		return Effect.gen(function* () {
			return yield* ArtifactService.use((svc) => svc.listAllTitled(data.workspaceId));
		}).pipe(
			Effect.withSpan("library.listAll"),
			rpcErrorPipe({ ArtifactError: "Failed to load library." }),
			appRuntime().runPromise,
		);
	});

const getArtifactById = createServerFn({ method: "GET" })
	.validator((data: unknown) =>
		Schema.decodeUnknownSync(
			Schema.Struct({ workspaceId: Schema.String, artifactId: Schema.String }),
		)(data),
	)
	.handler(async ({ data }) => {
		return Effect.gen(function* () {
			return yield* ArtifactService.use((svc) =>
				svc.getArtifactById(data.artifactId, data.workspaceId),
			);
		}).pipe(
			Effect.withSpan("library.getById"),
			rpcErrorPipe({ ArtifactError: "Failed to load artifact." }),
			appRuntime().runPromise,
		);
	});

export const LibraryRpc = {
	listAllArtifacts: (wid: string) =>
		queryOptions({
			queryKey: queryKeys.library.list(wid),
			queryFn: (): Promise<LibraryItem[]> =>
				listAllArtifacts({ data: { workspaceId: wid } }),
		}),
	getArtifactById: (wid: string, aid: string) =>
		queryOptions({
			queryKey: [...queryKeys.library.all(wid), aid],
			queryFn: (): Promise<{ kind: ArtifactKind; title: string; content: string | null } | null> =>
				getArtifactById({ data: { workspaceId: wid, artifactId: aid } }),
		}),
};
