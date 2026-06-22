import { AsyncLocalStorage } from "node:async_hooks";

export interface RequestContext {
  requestId: string;
  method: string;
  path: string;
  email: string;
}

const EMPTY: RequestContext = { requestId: "unknown", method: "", path: "", email: "" };

// nodejs_compat gives Workers AsyncLocalStorage. server.ts populates it per
// request so server-fn handlers and catch sites can correlate logs without
// threading the context through every signature.
const als = new AsyncLocalStorage<RequestContext>();

export const runRequestContext = <T>(ctx: RequestContext, fn: () => T): T => als.run(ctx, fn);

export const getRequestContext = (): RequestContext => als.getStore() ?? EMPTY;
