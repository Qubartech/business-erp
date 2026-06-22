import { verifyAccessToken, type AccessTokenPayload } from "./jwt";
import { prisma } from "./prisma";
import { Unauthorized, Forbidden } from "./errors";
import type { Role } from "@prisma/client";

export async function requireAuth(req: Request): Promise<AccessTokenPayload> {
  const apiKeyHeader = req.headers.get("x-api-key") || undefined;
  const authHeader = req.headers.get("authorization") || undefined;

  let apiKey = apiKeyHeader;
  if (!apiKey && authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    if (token.startsWith("erp_")) {
      apiKey = token;
    }
  }

  if (apiKey) {
    try {
      const user = await prisma.user.findUnique({
        where: { apiKey },
        select: { id: true, email: true, role: true, isActive: true },
      });
      if (!user || !user.isActive) {
        throw Unauthorized("Invalid or inactive API key");
      }
      return { sub: user.id, email: user.email, role: user.role };
    } catch (e: any) {
      if (e instanceof Error && "status" in e && (e as any).status === 401) throw e;
      console.error("API Key verification error:", e);
      throw Unauthorized("Error verifying API key");
    }
  }

  if (!authHeader?.startsWith("Bearer ")) {
    throw Unauthorized("Missing bearer token or API key");
  }
  const token = authHeader.slice(7);
  try {
    return verifyAccessToken(token);
  } catch {
    throw Unauthorized("Invalid or expired token");
  }
}

export function requireRole(user: AccessTokenPayload, ...roles: Role[]) {
  if (!roles.includes(user.role)) {
    throw Forbidden("Insufficient role");
  }
}
