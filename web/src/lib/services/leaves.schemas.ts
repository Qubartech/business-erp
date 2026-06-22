import { z } from "zod";

export const leaveTypeSchema = z.enum(["sick", "casual", "annual", "unpaid"]);
export const leaveStatusSchema = z.enum(["pending", "approved", "rejected"]);

export const createLeaveSchema = z.object({
  type: leaveTypeSchema,
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().transform((val) => new Date(val)),
  reason: z.string().optional().nullable(),
}).refine((data) => data.startDate <= data.endDate, {
  message: "Start date must be before or equal to end date",
  path: ["endDate"],
});

export const updateLeaveSchema = z.object({
  type: leaveTypeSchema.optional(),
  startDate: z.string().transform((val) => new Date(val)).optional(),
  endDate: z.string().transform((val) => new Date(val)).optional(),
  reason: z.string().optional().nullable(),
  status: leaveStatusSchema.optional(),
});
