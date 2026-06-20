const DEFAULT_MESSAGE = "Something went wrong. Please try again.";

export function createErrorHandler(errorMap: Record<string, string>) {
  return (error: unknown): never => {
    if (error && typeof error === "object" && "_tag" in error) {
      const tag = (error as { _tag: string })._tag;
      if (tag in errorMap) {
        throw new Error(errorMap[tag]);
      }
    }
    throw new Error(DEFAULT_MESSAGE);
  };
}
