import { z } from "zod";

export const listAttendanceQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  date: z.string().optional(), // YYYY-MM-DD
  month: z.string().optional(), // YYYY-MM
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(2000).default(20),
});

export const updateAttendanceSchema = z.object({
  checkIn: z.string(),
  checkOut: z.string().nullable().optional(),
});

