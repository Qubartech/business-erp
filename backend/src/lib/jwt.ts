import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "./env.js";
import type { Role } from "@prisma/client";

export type AccessTokenPayload = { sub: string; role: Role; email: string };
export type RefreshTokenPayload = { sub: string; jti: string };

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.accessTokenTtl } as SignOptions);
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: `${env.refreshTokenTtlDays}d` } as SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwtSecret) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.jwtRefreshSecret) as RefreshTokenPayload;
}
