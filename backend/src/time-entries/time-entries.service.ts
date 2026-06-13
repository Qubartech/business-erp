import { BadRequest, NotFound, Forbidden } from "../lib/errors.js";
import { diffMinutes } from "../lib/date.js";
import type { Container } from "../lib/container.js";
import type { z } from "zod";
import type { listEntriesQuerySchema, manualEntrySchema } from "./time-entries.schemas.js";

type ListQuery = z.infer<typeof listEntriesQuerySchema>;
type ManualInput = z.infer<typeof manualEntrySchema>;

const include = {
  task: { select: { id: true, title: true, projectId: true } },
  user: { select: { id: true, name: true } },
} as const;

export function createTimeEntriesService({ prisma }: Pick<Container, "prisma">) {
  return {
    async list(currentUserId: string, currentRole: string, q: ListQuery) {
      const where = {
        ...(q.taskId ? { taskId: q.taskId } : {}),
        ...(q.userId ? { userId: q.userId } : currentRole === "member" ? { userId: currentUserId } : {}),
      };
      const [items, total] = await Promise.all([
        prisma.timeEntry.findMany({ where, include, orderBy: { startTime: "desc" }, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
        prisma.timeEntry.count({ where }),
      ]);
      return { items, total, page: q.page, pageSize: q.pageSize };
    },

    async startTimer(userId: string, taskId: string) {
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (!task) throw NotFound("Task not found");
      const open = await prisma.timeEntry.findFirst({ where: { userId, endTime: null } });
      if (open) throw BadRequest("You already have a running timer", { entryId: [open.id] });
      return prisma.timeEntry.create({ data: { taskId, userId, startTime: new Date() }, include });
    },

    async stopTimer(userId: string, entryId: string) {
      const entry = await prisma.timeEntry.findUnique({ where: { id: entryId } });
      if (!entry) throw NotFound("Timer not found");
      if (entry.userId !== userId) throw Forbidden("Not your timer");
      if (entry.endTime) throw BadRequest("Timer already stopped");
      const end = new Date();
      return prisma.timeEntry.update({
        where: { id: entryId },
        data: { endTime: end, durationMinutes: diffMinutes(entry.startTime, end) },
        include,
      });
    },

    async currentTimer(userId: string) {
      return prisma.timeEntry.findFirst({ where: { userId, endTime: null }, include });
    },

    async addManual(userId: string, input: ManualInput) {
      const task = await prisma.task.findUnique({ where: { id: input.taskId } });
      if (!task) throw NotFound("Task not found");
      return prisma.timeEntry.create({
        data: {
          userId,
          taskId: input.taskId,
          startTime: input.startTime,
          endTime: input.endTime,
          durationMinutes: diffMinutes(input.startTime, input.endTime),
        },
        include,
      });
    },

    async remove(userId: string, role: string, id: string) {
      const e = await prisma.timeEntry.findUnique({ where: { id } });
      if (!e) throw NotFound();
      if (e.userId !== userId && role !== "admin") throw Forbidden();
      await prisma.timeEntry.delete({ where: { id } });
      return { id };
    },
  };
}
