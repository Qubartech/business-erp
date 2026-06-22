import { z } from "zod";

export const taskStatusEnum = z.enum(["todo", "in_progress", "review", "done"]);
export const taskPriorityEnum = z.enum(["low", "medium", "high", "critical"]);

const dateish = z.preprocess(
  (val) => (val === "" || val === undefined ? undefined : val),
  z.union([z.string().datetime(), z.string().date(), z.coerce.date()]).transform((v) => new Date(v as never))
);

export const createTaskSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  status: taskStatusEnum.default("todo"),
  priority: taskPriorityEnum.default("medium"),
  assignedTo: z.string().uuid().nullable().optional(),
  dueDate: dateish.nullable().optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  projectId: z.string().uuid().optional(),
});

export const listTasksQuerySchema = z.object({
  projectId: z.string().uuid().optional(),
  status: taskStatusEnum.optional(),
  priority: taskPriorityEnum.optional(),
  assignedTo: z.string().uuid().optional(),
  search: z.string().optional(),
  dueBefore: z.coerce.date().optional(),
  dueAfter: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
