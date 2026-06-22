import { NotFound } from "../errors";
import type { Container } from "../container";
import type { z } from "zod";
import type { createHolidaySchema } from "./holidays.schemas.js";

type CreateInput = z.infer<typeof createHolidaySchema>;

export function createHolidaysService({ prisma }: Pick<Container, "prisma">) {
  return {
    async list(year?: number) {
      const where: any = {};
      if (year) {
        where.date = {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`),
        };
      }
      const items = await prisma.holiday.findMany({
        where,
        orderBy: { date: "asc" },
      });
      return { items };
    },

    async create(input: CreateInput) {
      return prisma.holiday.create({
        data: {
          date: input.date,
          name: input.name,
          description: input.description,
        },
      });
    },

    async remove(id: string) {
      const holiday = await prisma.holiday.findUnique({ where: { id } });
      if (!holiday) throw NotFound("Holiday not found");
      await prisma.holiday.delete({ where: { id } });
      return { id };
    }
  };
}
export type HolidaysService = ReturnType<typeof createHolidaysService>;
