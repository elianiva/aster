import { Logger } from "effect";

export const LoggerLayer = Logger.layer([
  Logger.formatJson,
], { mergeWithExisting: false });
