const DEFAULT_MESSAGE = "Something went wrong. Please try again.";

export function createErrorHandler(errorMap: Record<string, string>) {
  return (error: unknown): never => {
    if (error && typeof error === "object" && "_tag" in error) {
      const tag = (error as { _tag: string })._tag;
      if (tag in errorMap) {
        console.error(JSON.stringify({ level: "error", msg: "rpc error", tag }));
        throw new Error(errorMap[tag]);
      }
    }
    console.error(JSON.stringify({ level: "error", msg: "rpc error", error: String(error) }));
    throw new Error(DEFAULT_MESSAGE);
  };
}
