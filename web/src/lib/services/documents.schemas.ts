import { z } from "zod";

export const documentMetadataSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.string().max(80).optional(),
  projectId: z.string().uuid().optional(),
});

export const listDocumentsQuerySchema = z.object({
  search: z.string().optional(),
  projectId: z.string().uuid().optional(),
  category: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
