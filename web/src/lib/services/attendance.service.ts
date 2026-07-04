import { Conflict, NotFound } from "../errors";
import type { Container } from "../container";
import type { z } from "zod";
import type { listAttendanceQuerySchema } from "./attendance.schemas.js";

type ListQuery = z.infer<typeof listAttendanceQuerySchema>;

const include = {
  user: { select: { id: true, name: true, email: true } },
} as const;

function getLocalDayRange(now = new Date()) {
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  return { startOfDay, endOfDay };
}

import { createActivityService } from "./activity.service";

export function createAttendanceService({ prisma }: Pick<Container, "prisma">) {
  const activityService = createActivityService({ prisma });

  async function findLatestEntryForToday(userId: string) {
    const { startOfDay, endOfDay } = getLocalDayRange();

    return prisma.attendance.findFirst({
      where: {
        userId,
        checkIn: { gte: startOfDay, lte: endOfDay },
      },
      orderBy: { checkIn: "desc" },
      include,
    });
  }

  return {
    async checkIn(userId: string) {
      // Check if user is already checked in (has an entry with checkout null)
      const active = await prisma.attendance.findFirst({
        where: { userId, checkOut: null },
      });
      if (active) {
        throw Conflict("You are already checked in");
      }

      const res = await prisma.attendance.create({
        data: {
          userId,
          checkIn: new Date(),
        },
        include,
      });

      await activityService.log({
        type: "attendance",
        action: "check_in",
        userId,
        description: "checked in",
      });

      return res;
    },

    async checkOut(userId: string) {
      // Find open check-in
      const active = await prisma.attendance.findFirst({
        where: { userId, checkOut: null },
      });
      if (!active) {
        throw NotFound("No active check-in found");
      }

      const res = await prisma.attendance.update({
        where: { id: active.id },
        data: {
          checkOut: new Date(),
        },
        include,
      });

      await activityService.log({
        type: "attendance",
        action: "check_out",
        userId,
        description: "checked out",
      });

      return res;
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

      const lastToday = await findLatestEntryForToday(userId);
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
      } else if (q.month) {
        const [year, month] = q.month.split("-").map(Number);
        const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0);
        const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
        where.checkIn = {
          gte: startOfMonth,
          lte: endOfMonth,
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

    async update(id: string, data: { checkIn?: string | Date; checkOut?: string | Date | null }) {
      const entry = await prisma.attendance.findUnique({
        where: { id },
      });
      if (!entry) {
        throw NotFound("Attendance record not found");
      }

      const updateData: any = {};
      if (data.checkIn !== undefined) {
        updateData.checkIn = new Date(data.checkIn);
      }
      if (data.checkOut !== undefined) {
        updateData.checkOut = data.checkOut ? new Date(data.checkOut) : null;
      }

      // Basic validation: checkIn should be before checkOut
      const checkInDate = updateData.checkIn || entry.checkIn;
      const checkOutDate = updateData.checkOut !== undefined ? updateData.checkOut : entry.checkOut;

      if (checkInDate && checkOutDate && checkInDate > checkOutDate) {
        throw Conflict("Check-in time must be before check-out time");
      }

      const res = await prisma.attendance.update({
        where: { id },
        data: updateData,
        include,
      });

      await activityService.log({
        type: "attendance",
        action: "update",
        userId: entry.userId,
        description: `attendance log edited by admin: check-in ${res.checkIn.toISOString()}${res.checkOut ? `, check-out ${res.checkOut.toISOString()}` : ""}`,
      });

      return res;
    },
  };
}
