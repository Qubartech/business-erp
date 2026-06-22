import { z } from "zod";

export const startTimerSchema = z.object({ taskId: z.string().uuid() });
export const stopTimerSchema = z.object({
  entryId: z.string().uuid(),
  endTime: z.coerce.date().optional(),
});

export const updateEntrySchema = z.object({
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  taskId: z.string().uuid().optional(),
}).refine((v) => v.endTime > v.startTime, { message: "endTime must be after startTime", path: ["endTime"] });

export const manualEntrySchema = z.object({
  taskId: z.string().uuid(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
}).refine((v) => v.endTime > v.startTime, { message: "endTime must be after startTime", path: ["endTime"] });

export const listEntriesQuerySchema = z.object({
  taskId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
