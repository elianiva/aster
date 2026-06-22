import { Logger } from "effect";

/** In-runtime JSON logger — picked up by Workers Logs / Logpush / Pipelines. */
export const LoggerLayer = Logger.layer([Logger.consoleJson], {
  mergeWithExisting: false,
});

type LogLevel = "info" | "warn" | "error";

/**
 * Boundary JSON logger for code that runs outside the Effect runtime
 * (the Worker fetch handler, server-fn catch sites, the agent Durable Object).
 * Kept in the same shape as the Effect consoleJson logger so stdout is uniform.
 */
export function logJson(level: LogLevel, msg: string, extra?: Record<string, unknown>) {
  const line = JSON.stringify({ level, msg, ts: new Date().toISOString(), ...extra });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}
