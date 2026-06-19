import { Data } from "effect";

export class ProvidersFetchError extends Data.TaggedError("ProvidersFetchError")<{
  readonly cause?: unknown;
}> { }
