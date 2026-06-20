import { Logger } from "effect";

/** JSON to stdout — picked up by Workers Logs / Logpush / Pipelines. */
export const LoggerLayer = Logger.layer([Logger.consoleJson], {
  mergeWithExisting: false,
});
