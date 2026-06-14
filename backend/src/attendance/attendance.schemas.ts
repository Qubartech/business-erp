import { z } from "zod";

export const listAttendanceQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  date: z.string().optional(), // YYYY-MM-DD
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
