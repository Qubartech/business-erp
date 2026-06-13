import { z } from "zod";

export const projectStatusEnum = z.enum(["draft", "active", "on_hold", "completed", "archived"]);

const dateish = z.union([z.string().datetime(), z.string().date(), z.coerce.date()]).transform((v) => new Date(v as never));

export const createProjectSchema = z.object({
  name: z.string().min(1).max(160),
  description: z.string().max(5000).optional(),
  status: projectStatusEnum.default("draft"),
  startDate: dateish.optional(),
  endDate: dateish.optional(),
  memberIds: z.array(z.string().uuid()).default([]),
});

export const updateProjectSchema = createProjectSchema.partial();

export const listProjectsQuerySchema = z.object({
  search: z.string().optional(),
  status: projectStatusEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const membersSchema = z.object({ userIds: z.array(z.string().uuid()).min(1) });
