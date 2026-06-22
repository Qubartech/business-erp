import { z } from "zod";

export const createHolidaySchema = z.object({
  date: z.string().transform((val) => new Date(val)),
  name: z.string().min(1).max(100),
  description: z.string().optional().nullable(),
});
