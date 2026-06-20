import handler from "@tanstack/react-start/server-entry";
import type { ThinkAppContext } from "@cloudflare/think/server-entry";
import { verifyAccess, type AccessConfig } from "./server/cloudflare-access";

const log = (level: string, msg: string, extra?: Record<string, unknown>) =>
  console.log(JSON.stringify({ level, msg, ...extra }));

export default {
  async fetch(
    request: Request,
    env: Env,
    _ctx: ExecutionContext,
    _think?: ThinkAppContext
  ) {
    const url = new URL(request.url);
    const start = Date.now();

    // Skip auth for agent API routes (handled by Think)
    if (url.pathname.startsWith("/api/agents/")) {
      const res = await handler.fetch(request);
      log("info", "request", {
        method: request.method,
        path: url.pathname,
        status: res.status,
        durationMs: Date.now() - start,
      });
      return res;
    }

    const accessConfig: AccessConfig = {
      teamDomain: env.ACCESS_TEAM_DOMAIN,
      aud: env.ACCESS_AUD,
      adminEmail: env.ADMIN_EMAIL,
      enableDevAuth: String(env.ENABLE_DEV_AUTH) === "true",
    };

    // Verify Cloudflare Access JWT
    const identity = await verifyAccess(request, accessConfig);
    if (!identity) {
      log("warn", "auth denied", {
        method: request.method,
        path: url.pathname,
      });
      return new Response("Unauthorized", { status: 401 });
    }

    // Forward identity as header for downstream use
    const headers = new Headers(request.headers);
    headers.set("x-access-email", identity.email);
    headers.set("x-access-sub", identity.sub);
    const res = await handler.fetch(
      new Request(request.url, {
        method: request.method,
        headers,
        body: request.body,
      }),
    );
    log("info", "request", {
      method: request.method,
      path: url.pathname,
      status: res.status,
      durationMs: Date.now() - start,
      email: identity.email,
    });
    return res;
  },
};
