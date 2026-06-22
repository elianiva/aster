import handler from "@tanstack/react-start/server-entry";
import type { ThinkAppContext } from "@cloudflare/think/server-entry";
import { verifyAccess, type AccessConfig } from "./server/cloudflare-access";
import { logJson } from "./server/logger";
import { runRequestContext, type RequestContext } from "./server/request-context";

function levelFor(status: number): "info" | "warn" | "error" {
  if (status >= 500) return "error";
  if (status >= 400) return "warn";
  return "info";
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
    think?: ThinkAppContext,
  ) {
    const url = new URL(request.url);
    const start = Date.now();
    const requestId = crypto.randomUUID();
    const isAgentRoute = url.pathname.startsWith("/api/agents/");

    const accessConfig: AccessConfig = {
      teamDomain: env.ACCESS_TEAM_DOMAIN,
      aud: env.ACCESS_AUD,
      adminEmail: env.ADMIN_EMAIL,
      enableDevAuth: String(env.ENABLE_DEV_AUTH) === "true",
    };

    const identity = await verifyAccess(request, accessConfig);
    if (!identity) {
      // verifyAccess already logged the denial reason.
      logJson("warn", "request", {
        requestId,
        method: request.method,
        path: url.pathname,
        status: 401,
        durationMs: Date.now() - start,
      });
      return new Response("Unauthorized", { status: 401 });
    }

    const headers = new Headers(request.headers);
    headers.set("x-access-email", identity.email);
    headers.set("x-access-sub", identity.sub);
    headers.set("x-request-id", requestId);
    const authedRequest = new Request(request.url, {
      method: request.method,
      headers,
      body: request.body,
    });

    const reqCtx: RequestContext = {
      requestId,
      method: request.method,
      path: url.pathname,
      email: identity.email,
    };

    const finish = (res: Response): Response => {
      logJson(levelFor(res.status), "request", {
        requestId,
        method: request.method,
        path: url.pathname,
        status: res.status,
        durationMs: Date.now() - start,
        email: identity.email,
      });
      return res;
    };

    // Agent routes go to the Think router directly — returning null here would
    // fall through to Think without our authed headers, and forwarding to the
    // TanStack handler would 404 the DO/WebSocket upgrade.
    if (isAgentRoute) {
      return runRequestContext(reqCtx, async () => {
        try {
          const res =
            (await think?.router.route(authedRequest, env, ctx)) ??
            new Response("Not found", { status: 404 });
          return finish(res);
        } catch (cause) {
          logJson("error", "agent.unhandled", {
            requestId,
            method: request.method,
            path: url.pathname,
            email: identity.email,
            cause: String(cause),
            stack: cause instanceof Error ? cause.stack : undefined,
          });
          return finish(new Response("Internal Server Error", { status: 500 }));
        }
      });
    }

    return runRequestContext(reqCtx, async () => {
      try {
        const res = await handler.fetch(authedRequest);
        return finish(res);
      } catch (cause) {
        logJson("error", "request.unhandled", {
          requestId,
          method: request.method,
          path: url.pathname,
          email: identity.email,
          cause: String(cause),
          stack: cause instanceof Error ? cause.stack : undefined,
        });
        return finish(new Response("Internal Server Error", { status: 500 }));
      }
    });
  },
};
