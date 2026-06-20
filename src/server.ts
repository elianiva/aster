import handler from "@tanstack/react-start/server-entry";
import type { ThinkAppContext } from "@cloudflare/think/server-entry";
import { verifyAccess, type AccessConfig } from "./server/cloudflare-access";

export default {
  async fetch(
    request: Request,
    env: Env,
    _ctx: ExecutionContext,
    _think?: ThinkAppContext
  ) {
    const url = new URL(request.url);

    // Skip auth for agent API routes (handled by Think)
    if (url.pathname.startsWith("/api/agents/")) {
      return handler.fetch(request);
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
      return new Response("Unauthorized", { status: 401 });
    }

    // Forward identity as header for downstream use
    const headers = new Headers(request.headers);
    headers.set("x-access-email", identity.email);
    headers.set("x-access-sub", identity.sub);

    return handler.fetch(new Request(request.url, { ...request, headers }));
  },
};
