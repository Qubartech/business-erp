import { Conflict, NotFound } from "../errors";
import { hashPassword } from "../crypto";
import type { Container } from "../container";
import type { z } from "zod";
import type { createUserSchema, listUsersQuerySchema, updateUserSchema } from "./users.schemas.js";

type CreateInput = z.infer<typeof createUserSchema>;
type UpdateInput = z.infer<typeof updateUserSchema>;
type ListQuery = z.infer<typeof listUsersQuerySchema>;

const safeSelect = {
  id: true, name: true, email: true, role: true, isActive: true, createdAt: true, updatedAt: true,
} as const;

export function createUsersService({ prisma }: Pick<Container, "prisma">) {
  return {
    async list(q: ListQuery) {
      const where = {
        ...(q.role ? { role: q.role } : {}),
        ...(q.search
          ? { OR: [{ name: { contains: q.search, mode: "insensitive" as const } }, { email: { contains: q.search, mode: "insensitive" as const } }] }
          : {}),
      };
      const [items, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: safeSelect,
          orderBy: { createdAt: "desc" },
          skip: (q.page - 1) * q.pageSize,
          take: q.pageSize,
        }),
        prisma.user.count({ where }),
      ]);
      return { items, total, page: q.page, pageSize: q.pageSize };
    },

    async get(id: string) {
      const user = await prisma.user.findUnique({ where: { id }, select: safeSelect });
      if (!user) throw NotFound("User not found");
      return user;
    },

    async create(input: CreateInput) {
      const existing = await prisma.user.findUnique({ where: { email: input.email } });
      if (existing) throw Conflict("Email already in use");
      const passwordHash = await hashPassword(input.password);
      return prisma.user.create({
        data: {
          name: input.name, email: input.email, passwordHash,
          role: input.role, isActive: input.isActive,
        },
        select: safeSelect,
      });
    },

    async update(id: string, input: UpdateInput) {
      const exists = await prisma.user.findUnique({ where: { id } });
      if (!exists) throw NotFound("User not found");
      const data: Record<string, unknown> = { ...input };
      if (input.password) {
        data.passwordHash = await hashPassword(input.password);
        delete data.password;
      }
      if (input.email && input.email !== exists.email) {
        const dup = await prisma.user.findUnique({ where: { email: input.email } });
        if (dup) throw Conflict("Email already in use");
      }
      return prisma.user.update({ where: { id }, data, select: safeSelect });
    },

    async setActive(id: string, isActive: boolean) {
      const exists = await prisma.user.findUnique({ where: { id } });
      if (!exists) throw NotFound("User not found");
      return prisma.user.update({ where: { id }, data: { isActive }, select: safeSelect });
    },
  };
}
