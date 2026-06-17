import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken, type AccessTokenPayload } from "../lib/jwt.js";
import { Forbidden, Unauthorized } from "../lib/errors.js";
import type { Role } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const apiKeyHeader = req.headers["x-api-key"] as string | undefined;
  const authHeader = req.headers.authorization;

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
        return next(Unauthorized("Invalid or inactive API key"));
      }
      req.user = { sub: user.id, email: user.email, role: user.role };
      return next();
    } catch (e: any) {
      console.error("API Key verification error:", e);
      return next(Unauthorized("Error verifying API key"));
    }
  }

  if (!authHeader?.startsWith("Bearer ")) return next(Unauthorized("Missing bearer token or API key"));
  const token = authHeader.slice(7);
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(Unauthorized("Invalid or expired token"));
  }
}

export const requireRole =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(Unauthorized());
    if (!roles.includes(req.user.role)) return next(Forbidden("Insufficient role"));
    next();
  };
