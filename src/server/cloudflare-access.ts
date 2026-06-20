import { createRemoteJWKSet, jwtVerify } from "jose";

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

export const verifyAccess = async (
  request: Request,
  config: AccessConfig,
): Promise<AccessIdentity | null> => {
  if (config.enableDevAuth) {
    return { sub: "dev", email: config.adminEmail || "dev@local" };
  }

  const token = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!token) return null;

  const issuer = `https://${config.teamDomain}`;
  if (jwks === null || cachedIssuer !== issuer) {
    jwks = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
    cachedIssuer = issuer;
  }

  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer,
      audience: config.aud,
    });

    const email = typeof payload.email === "string" ? payload.email : "";
    const sub = typeof payload.sub === "string" ? payload.sub : "";

    return { sub, email };
  } catch {
    return null;
  }
};
