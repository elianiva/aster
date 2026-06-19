import { Layer, Logger } from "effect";

export const LoggerLive = Logger.layerLoggerFmt({
  level: "INFO",
});
