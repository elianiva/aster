import { Schema } from "effect";

export class ProvidersFetchError extends Schema.TaggedErrorClass<ProvidersFetchError>()("ProvidersFetchError", {
  cause: Schema.Defect(),
}) {}

/** Any R2 or D1 operation on an artifact failed. */
export class ArtifactError extends Schema.TaggedErrorClass<ArtifactError>()("ArtifactError", {
  message: Schema.String,
}) {}

export class WorkspaceNotFound extends Schema.TaggedErrorClass<WorkspaceNotFound>()("WorkspaceNotFound", {
  message: Schema.String,
}) {}

export class WorkspacePersistenceFailed extends Schema.TaggedErrorClass<WorkspacePersistenceFailed>()("WorkspacePersistenceFailed", {
  message: Schema.String,
}) {}

export class ThreadNotFound extends Schema.TaggedErrorClass<ThreadNotFound>()("ThreadNotFound", {
  message: Schema.String,
}) {}

export class ThreadPersistenceFailed extends Schema.TaggedErrorClass<ThreadPersistenceFailed>()("ThreadPersistenceFailed", {
  message: Schema.String,
}) {}
