import { Context, Effect, Layer } from "effect";
import { eq } from "drizzle-orm";
import { Database } from "../../db/client";
import type { DrizzleClient } from "../../db/client";
import { workspaces } from "../../db/schema";

export interface Workspace {
  id: string;
  topic: string;
  mission: string;
  currentKnowledge: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkspaceInput {
  topic: string;
  mission: string;
  currentKnowledge: string;
}

export interface UpdateWorkspaceInput {
  topic?: string;
  mission?: string;
  currentKnowledge?: string;
}

export class WorkspaceNotFound extends Error {
  readonly _tag = "WorkspaceNotFound";
}

export class WorkspaceQueryFailed extends Error {
  readonly _tag = "WorkspaceQueryFailed";
}

export class WorkspaceInsertFailed extends Error {
  readonly _tag = "WorkspaceInsertFailed";
}

export class WorkspaceUpdateFailed extends Error {
  readonly _tag = "WorkspaceUpdateFailed";
}

export class WorkspaceDeleteFailed extends Error {
  readonly _tag = "WorkspaceDeleteFailed";
}

function toWorkspace(row: typeof workspaces.$inferSelect): Workspace {
  return {
    id: row.id,
    topic: row.topic,
    mission: row.mission,
    currentKnowledge: row.currentKnowledge,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function list(client: DrizzleClient) {
  return Effect.gen(function* () {
    yield* Effect.log("Listing workspaces");
    const rows = yield* Effect.tryPromise({
      try: () => client.select().from(workspaces).orderBy(workspaces.createdAt),
      catch: (cause) => new WorkspaceQueryFailed(`Failed to list workspaces: ${cause}`),
    });
    yield* Effect.log(`Listed ${rows.length} workspaces`);
    return rows.map(toWorkspace);
  }).pipe(Effect.tapError((e) => Effect.logError(`List workspaces failed: ${e}`)));
}

function get(client: DrizzleClient, id: string) {
  return Effect.gen(function* () {
    yield* Effect.log(`Getting workspace: ${id}`);
    const rows = yield* Effect.tryPromise({
      try: () => client.select().from(workspaces).where(eq(workspaces.id, id)).limit(1),
      catch: (cause) => new WorkspaceQueryFailed(`Failed to get workspace: ${cause}`),
    });
    const workspace = rows[0] ? toWorkspace(rows[0]) : null;
    yield* workspace
      ? Effect.log(`Found workspace: ${id}`)
      : Effect.log(`Workspace not found: ${id}`);
    return workspace;
  }).pipe(Effect.tapError((e) => Effect.logError(`Get workspace failed: ${e}`)));
}

function create(client: DrizzleClient, input: CreateWorkspaceInput) {
  return Effect.gen(function* () {
    yield* Effect.log(`Creating workspace: ${input.topic}`);
    const now = new Date();
    const id = crypto.randomUUID();
    const workspace: Workspace = {
      id,
      ...input,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    yield* Effect.tryPromise({
      try: () =>
        client.insert(workspaces).values({
          id,
          topic: input.topic,
          mission: input.mission,
          currentKnowledge: input.currentKnowledge,
          createdAt: now,
          updatedAt: now,
        }),
      catch: (cause) => new WorkspaceInsertFailed(`Failed to create workspace: ${cause}`),
    });
    yield* Effect.log(`Created workspace: ${id}`);
    return workspace;
  }).pipe(Effect.tapError((e) => Effect.logError(`Create workspace failed: ${e}`)));
}

function update(client: DrizzleClient, id: string, input: UpdateWorkspaceInput) {
  return Effect.gen(function* () {
    yield* Effect.log(`Updating workspace: ${id}`);
    const existing = yield* get(client, id);
    if (!existing) {
      return yield* Effect.fail(new WorkspaceNotFound(`Workspace ${id} not found`));
    }
    const now = new Date();
    const updated = {
      ...existing,
      ...input,
      updatedAt: now.toISOString(),
    };
    yield* Effect.tryPromise({
      try: () =>
        client
          .update(workspaces)
          .set({
            topic: updated.topic,
            mission: updated.mission,
            currentKnowledge: updated.currentKnowledge,
            updatedAt: now,
          })
          .where(eq(workspaces.id, id)),
      catch: (cause) => new WorkspaceUpdateFailed(`Failed to update workspace: ${cause}`),
    });
    yield* Effect.log(`Updated workspace: ${id}`);
    return updated;
  }).pipe(Effect.tapError((e) => Effect.logError(`Update workspace failed: ${e}`)));
}

function delete_(client: DrizzleClient, id: string) {
  return Effect.gen(function* () {
    yield* Effect.log(`Deleting workspace: ${id}`);
    yield* Effect.tryPromise({
      try: () => client.delete(workspaces).where(eq(workspaces.id, id)),
      catch: (cause) => new WorkspaceDeleteFailed(`Failed to delete workspace: ${cause}`),
    });
    yield* Effect.log(`Deleted workspace: ${id}`);
  }).pipe(Effect.tapError((e) => Effect.logError(`Delete workspace failed: ${e}`)));
}

export class WorkspaceService extends Context.Service<WorkspaceService, {
  list: () => Effect.Effect<Workspace[], WorkspaceQueryFailed>;
  get: (id: string) => Effect.Effect<Workspace | null, WorkspaceQueryFailed>;
  create: (input: CreateWorkspaceInput) => Effect.Effect<Workspace, WorkspaceInsertFailed>;
  update: (id: string, input: UpdateWorkspaceInput) => Effect.Effect<Workspace, WorkspaceNotFound | WorkspaceUpdateFailed | WorkspaceQueryFailed>;
  delete: (id: string) => Effect.Effect<void, WorkspaceDeleteFailed>;
}>()("WorkspaceService") {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const db = yield* Database;
      const client = db.client;

      return {
        list: () => list(client),
        get: (id: string) => get(client, id),
        create: (input: CreateWorkspaceInput) => create(client, input),
        update: (id: string, input: UpdateWorkspaceInput) => update(client, id, input),
        delete: (id: string) => delete_(client, id),
      };
    }),
  );
}
