import { z } from "zod";

export const roleEnum = z.enum(["admin", "manager", "member", "account"]);

export const createUserSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: roleEnum.default("member"),
  isActive: z.boolean().default(true),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).max(128).optional(),
  role: roleEnum.optional(),
  isActive: z.boolean().optional(),
});

export const listUsersQuerySchema = z.object({
  search: z.string().optional(),
  role: roleEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
