import { Schema } from "effect";

export class ProvidersFetchError extends Schema.TaggedErrorClass<ProvidersFetchError>()("ProvidersFetchError", {
  cause: Schema.Defect(),
}) {}
