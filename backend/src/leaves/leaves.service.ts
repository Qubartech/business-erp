import { Forbidden, NotFound, BadRequest } from "../lib/errors.js";
import type { Container } from "../lib/container.js";
import type { z } from "zod";
import type { createLeaveSchema, updateLeaveSchema } from "./leaves.schemas.js";

type CreateInput = z.infer<typeof createLeaveSchema>;
type UpdateInput = z.infer<typeof updateLeaveSchema>;

export function createLeavesService({ prisma }: Pick<Container, "prisma">) {
  return {
    async list(userId: string, role: string, q: { userId?: string; status?: string }) {
      const where: any = {};
      
      // Members can only see their own leaves
      if (role === "member") {
        where.userId = userId;
      } else {
        if (q.userId) where.userId = q.userId;
        if (q.status) where.status = q.status;
      }

      const items = await prisma.leave.findMany({
        where,
        orderBy: { startDate: "desc" },
        include: { user: { select: { id: true, name: true, email: true } } }
      });
      return { items };
    },

    async create(userId: string, input: CreateInput) {
      const overlap = await prisma.leave.findFirst({
        where: {
          userId,
          status: { in: ["approved", "pending"] },
          startDate: { lte: input.endDate },
          endDate: { gte: input.startDate },
        },
      });
      if (overlap) {
        throw BadRequest("You already have an approved or pending leave request that overlaps with this date range.");
      }

      return prisma.leave.create({
        data: {
          userId,
          type: input.type,
          startDate: input.startDate,
          endDate: input.endDate,
          reason: input.reason,
          status: "pending",
        },
      });
    },

    async update(userId: string, role: string, id: string, input: UpdateInput) {
      const leave = await prisma.leave.findUnique({ where: { id } });
      if (!leave) throw NotFound("Leave request not found");

      if (input.startDate || input.endDate) {
        const targetStartDate = input.startDate ?? leave.startDate;
        const targetEndDate = input.endDate ?? leave.endDate;

        const overlap = await prisma.leave.findFirst({
          where: {
            userId: leave.userId,
            id: { not: id },
            status: { in: ["approved", "pending"] },
            startDate: { lte: targetEndDate },
            endDate: { gte: targetStartDate },
          },
        });
        if (overlap) {
          throw BadRequest("The updated date range overlaps with an existing approved or pending leave request.");
        }
      }

      if (role === "member") {
        if (leave.userId !== userId) throw Forbidden("Not your leave request");
        if (leave.status !== "pending") throw BadRequest("Cannot modify a decided leave request");
        
        // Members cannot update status directly
        const { status, ...rest } = input;
        return prisma.leave.update({
          where: { id },
          data: rest as any,
        });
      } else {
        // Admins/managers can update everything, including status
        return prisma.leave.update({
          where: { id },
          data: input as any,
          include: { user: { select: { id: true, name: true, email: true } } }
        });
      }
    },

    async remove(userId: string, role: string, id: string) {
      const leave = await prisma.leave.findUnique({ where: { id } });
      if (!leave) throw NotFound("Leave request not found");

      if (role === "member") {
        if (leave.userId !== userId) throw Forbidden("Not your leave request");
        if (leave.status !== "pending") throw BadRequest("Cannot cancel a decided leave request");
      }

      await prisma.leave.delete({ where: { id } });
      return { id };
    }
  };
}
export type LeavesService = ReturnType<typeof createLeavesService>;
