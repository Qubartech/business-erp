import { z } from "zod";

export const upsertSettingSchema = z.object({
  key: z.string().min(1).max(120).regex(/^[a-z0-9_.-]+$/i, "Invalid key"),
  value: z.string().max(20000),
});
