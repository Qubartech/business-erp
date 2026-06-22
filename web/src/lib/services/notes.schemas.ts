import { z } from "zod";

export const createNoteSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().default(""),
  color: z.string().optional(),
  category: z.string().optional(),
  pinned: z.boolean().optional(),
});

export const updateNoteSchema = createNoteSchema.partial();

export const listNotesQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
