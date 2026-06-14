import { BadRequest, NotFound } from "../lib/errors.js";
import type { Container } from "../lib/container.js";
import type { z } from "zod";
import type { listAttendanceQuerySchema } from "./attendance.schemas.js";

type ListQuery = z.infer<typeof listAttendanceQuerySchema>;

const include = {
  user: { select: { id: true, name: true, email: true } },
} as const;

export function createAttendanceService({ prisma }: Pick<Container, "prisma">) {
  return {
    async checkIn(userId: string) {
      // Check if user is already checked in (has an entry with checkout null)
      const active = await prisma.attendance.findFirst({
        where: { userId, checkOut: null },
      });
      if (active) {
        throw BadRequest("You are already checked in");
      }

      return prisma.attendance.create({
        data: {
          userId,
          checkIn: new Date(),
        },
        include,
      });
    },

    async checkOut(userId: string) {
      // Find open check-in
      const active = await prisma.attendance.findFirst({
        where: { userId, checkOut: null },
      });
      if (!active) {
        throw NotFound("No active check-in found");
      }

      return prisma.attendance.update({
        where: { id: active.id },
        data: {
          checkOut: new Date(),
        },
        include,
      });
    },

    async getTodayStatus(userId: string) {
      // Find active check-in or any check-ins from today (local date)
      const active = await prisma.attendance.findFirst({
        where: { userId, checkOut: null },
        include,
      });
      if (active) {
        return { status: "checked-in", activeEntry: active };
      }

      // Check if there is a completed check-in today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const lastToday = await prisma.attendance.findFirst({
        where: {
          userId,
          checkIn: { gte: today },
        },
        orderBy: { checkIn: "desc" },
        include,
      });

      if (lastToday) {
        return { status: "checked-out", activeEntry: lastToday };
      }

      return { status: "none", activeEntry: null };
    },

    async list(currentUserId: string, currentRole: string, q: ListQuery) {
      // Members can only see their own attendance logs
      const targetUserId = currentRole === "member" ? currentUserId : q.userId;

      const where: any = {};
      if (targetUserId) {
        where.userId = targetUserId;
      }

      if (q.date) {
        const startOfDay = new Date(q.date + "T00:00:00");
        const endOfDay = new Date(q.date + "T23:59:59.999");
        where.checkIn = {
          gte: startOfDay,
          lte: endOfDay,
        };
      }

      const [items, total] = await Promise.all([
        prisma.attendance.findMany({
          where,
          include,
          orderBy: { checkIn: "desc" },
          skip: (q.page - 1) * q.pageSize,
          take: q.pageSize,
        }),
        prisma.attendance.count({ where }),
      ]);

      return { items, total, page: q.page, pageSize: q.pageSize };
    },
  };
}
