import { addDays } from "../lib/date.js";
import { hashPassword, sha256, verifyPassword } from "../lib/crypto.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt.js";
import { Unauthorized } from "../lib/errors.js";
import { env } from "../lib/env.js";
import type { Container } from "../lib/container.js";
import type { LoginInput } from "./auth.schemas.js";
import crypto from "node:crypto";

export function createAuthService({ prisma }: Pick<Container, "prisma">) {
  async function issueTokens(user: { id: string; email: string; role: "admin" | "manager" | "member" }) {
    const jti = crypto.randomUUID();
    const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ sub: user.id, jti });
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: sha256(refreshToken),
        expiresAt: addDays(new Date(), env.refreshTokenTtlDays),
      },
    });
    return { accessToken, refreshToken };
  }

  return {
    async login({ email, password }: LoginInput) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.isActive) throw Unauthorized("Invalid credentials");
      const ok = await verifyPassword(password, user.passwordHash);
      if (!ok) throw Unauthorized("Invalid credentials");
      const tokens = await issueTokens({ id: user.id, email: user.email, role: user.role });
      return {
        ...tokens,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      };
    },

    async refresh(refreshToken: string) {
      let payload;
      try {
        payload = verifyRefreshToken(refreshToken);
      } catch {
        throw Unauthorized("Invalid refresh token");
      }
      const tokenHash = sha256(refreshToken);
      const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
      if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
        throw Unauthorized("Refresh token expired or revoked");
      }
      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || !user.isActive) throw Unauthorized("User inactive");

      // rotate: revoke old, issue new
      return prisma.$transaction(async (tx) => {
        await tx.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
        const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
        const newJti = crypto.randomUUID();
        const newRefresh = signRefreshToken({ sub: user.id, jti: newJti });
        await tx.refreshToken.create({
          data: {
            userId: user.id,
            tokenHash: sha256(newRefresh),
            expiresAt: addDays(new Date(), env.refreshTokenTtlDays),
          },
        });
        return { accessToken, refreshToken: newRefresh };
      });
    },

    async logout(refreshToken: string) {
      const tokenHash = sha256(refreshToken);
      await prisma.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    },

    async me(userId: string) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
      });
      if (!user) throw Unauthorized();
      return user;
    },

    hashPassword,
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
