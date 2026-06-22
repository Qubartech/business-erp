import { NotFound } from "../errors";
import type { Container } from "../container";
import type { z } from "zod";
import type { createTaskSchema, listTasksQuerySchema, updateTaskSchema } from "./tasks.schemas.js";

type CreateInput = z.infer<typeof createTaskSchema>;
type UpdateInput = z.infer<typeof updateTaskSchema>;
type ListQuery = z.infer<typeof listTasksQuerySchema>;

const include = {
  project: { select: { id: true, name: true } },
  assignee: { select: { id: true, name: true, email: true } },
  creator: { select: { id: true, name: true, email: true } },
} as const;

export function createTasksService({ prisma }: Pick<Container, "prisma">) {
  return {
    async list(q: ListQuery) {
      const where = {
        ...(q.projectId ? { projectId: q.projectId } : {}),
        ...(q.status ? { status: q.status } : {}),
        ...(q.priority ? { priority: q.priority } : {}),
        ...(q.assignedTo ? { assignedTo: q.assignedTo } : {}),
        ...(q.search ? { title: { contains: q.search, mode: "insensitive" as const } } : {}),
        ...(q.dueBefore || q.dueAfter
          ? { dueDate: { ...(q.dueAfter ? { gte: q.dueAfter } : {}), ...(q.dueBefore ? { lte: q.dueBefore } : {}) } }
          : {}),
      };
      const [items, total] = await Promise.all([
        prisma.task.findMany({
          where, include, orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
          skip: (q.page - 1) * q.pageSize, take: q.pageSize,
        }),
        prisma.task.count({ where }),
      ]);
      return { items, total, page: q.page, pageSize: q.pageSize };
    },

    async get(id: string) {
      const task = await prisma.task.findUnique({ where: { id }, include });
      if (!task) throw NotFound("Task not found");
      return task;
    },

    async create(input: CreateInput, createdBy: string) {
      return prisma.task.create({
        data: {
          projectId: input.projectId,
          title: input.title,
          description: input.description ?? null,
          status: input.status,
          priority: input.priority,
          assignedTo: input.assignedTo ?? null,
          dueDate: input.dueDate ?? null,
          createdBy,
        },
        include,
      });
    },

    async update(id: string, input: UpdateInput) {
      const exists = await prisma.task.findUnique({ where: { id } });
      if (!exists) throw NotFound("Task not found");
      return prisma.task.update({ where: { id }, data: input, include });
    },

    async remove(id: string) {
      const exists = await prisma.task.findUnique({ where: { id } });
      if (!exists) throw NotFound("Task not found");
      await prisma.task.delete({ where: { id } });
      return { id };
    },
  };
}
