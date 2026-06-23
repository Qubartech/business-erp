import { addDays } from "../date";
import { hashPassword, sha256, verifyPassword } from "../crypto";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../jwt";
import { Unauthorized, Conflict } from "../errors";
import { env } from "../env";
import type { Container } from "../container";
import type { LoginInput, UpdateProfileInput } from "./auth.schemas.js";
import crypto from "node:crypto";

import type { Role } from "@prisma/client";

export function createAuthService({ prisma }: Pick<Container, "prisma">) {
  async function issueTokens(user: { id: string; email: string; role: Role }) {
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

    async getApiKey(userId: string) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { apiKey: true },
      });
      if (!user) throw Unauthorized();
      return { apiKey: user.apiKey };
    },

    async generateApiKey(userId: string) {
      const apiKey = `erp_${crypto.randomBytes(24).toString("hex")}`;
      await prisma.user.update({
        where: { id: userId },
        data: { apiKey },
      });
      return { apiKey };
    },

    async deleteApiKey(userId: string) {
      await prisma.user.update({
        where: { id: userId },
        data: { apiKey: null },
      });
    },

    async updateProfile(userId: string, input: UpdateProfileInput) {
      const exists = await prisma.user.findUnique({ where: { id: userId } });
      if (!exists) throw Unauthorized("User not found");

      const data: Record<string, any> = {};
      if (input.name !== undefined) data.name = input.name;
      
      if (input.email !== undefined && input.email !== exists.email) {
        const dup = await prisma.user.findUnique({ where: { email: input.email } });
        if (dup) throw Conflict("Email already in use");
        data.email = input.email;
      }

      if (input.password !== undefined && input.password !== "") {
        data.passwordHash = await hashPassword(input.password);
      }

      return prisma.user.update({
        where: { id: userId },
        data,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });
    },

    hashPassword,
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
