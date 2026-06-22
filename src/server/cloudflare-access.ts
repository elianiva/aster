import { createRemoteJWKSet, jwtVerify } from "jose";
import { Effect } from "effect";
import { logJson } from "./logger";

// Cloudflare Access sits in front of the Worker and authenticates the user.
// It forwards a signed Cf-Access-Jwt-Assertion JWT on every request.
// This module verifies that JWT against the team's public JWKS.

export interface AccessConfig {
  teamDomain: string;
  aud: string;
  adminEmail: string;
  enableDevAuth: boolean;
}

export interface AccessIdentity {
  sub: string;
  email: string;
}

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
let cachedIssuer: string | null = null;

class AccessDenied {
  readonly _tag = "AccessDenied" as const;
  constructor(readonly reason: string, readonly cause: unknown) {}
}

export const verifyAccess = (
  request: Request,
  config: AccessConfig,
): Promise<AccessIdentity | null> => {
  if (config.enableDevAuth) {
    return Promise.resolve({ sub: "dev", email: config.adminEmail || "dev@local" });
  }

  const token = request.headers.get("Cf-Access-Jwt-Assertion");
  const issuer = `https://${config.teamDomain}`;
  if (jwks === null || cachedIssuer !== issuer) {
    jwks = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
    cachedIssuer = issuer;
  }

  if (!token) {
    logJson("warn", "auth.denied", { reason: "missing-token" });
    return Promise.resolve(null);
  }

  // Expired vs invalid-signature vs wrong-audience are very different signals —
  // log the reason here so denials are debuggable. The message is never
  // returned to the client.
  return Effect.runPromise(
    Effect.tryPromise({
      try: () => jwtVerify(token, jwks!, { issuer, audience: config.aud }),
      catch: (cause) => new AccessDenied("invalid-token", cause),
    }).pipe(
      Effect.map(({ payload }) => ({
        sub: typeof payload.sub === "string" ? payload.sub : "",
        email: typeof payload.email === "string" ? payload.email : "",
      })),
      Effect.catchTag("AccessDenied", (err) =>
        Effect.sync(() => {
          logJson("warn", "auth.denied", { reason: err.reason, cause: String(err.cause) });
          return null;
        }),
      ),
    ),
  );
};
