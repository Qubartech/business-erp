import { BadRequest, NotFound } from "../errors";
import { env } from "../env";
import type { Container } from "../container";
import type { z } from "zod";
import type { documentMetadataSchema, listDocumentsQuerySchema } from "./documents.schemas.js";
import crypto from "node:crypto";

type ListQuery = z.infer<typeof listDocumentsQuerySchema>;
type Metadata = z.infer<typeof documentMetadataSchema>;

const include = {
  project: { select: { id: true, name: true } },
  uploader: { select: { id: true, name: true, email: true } },
} as const;

export function createDocumentsService({ prisma, supabase }: Container) {
  return {
    async list(q: ListQuery) {
      const where = {
        ...(q.projectId ? { projectId: q.projectId } : {}),
        ...(q.category ? { category: q.category } : {}),
        ...(q.search ? { title: { contains: q.search, mode: "insensitive" as const } } : {}),
      };
      const [items, total] = await Promise.all([
        prisma.document.findMany({ where, include, orderBy: { createdAt: "desc" }, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
        prisma.document.count({ where }),
      ]);
      return { items, total, page: q.page, pageSize: q.pageSize };
    },

    async upload(
      uploadedBy: string,
      file: { buffer: Buffer; originalname: string; mimetype: string; size: number } | undefined,
      meta: Metadata,
    ) {
      if (!file) throw BadRequest("Missing file");
      const ext = file.originalname.includes(".") ? file.originalname.slice(file.originalname.lastIndexOf(".")) : "";
      const path = `${new Date().getFullYear()}/${crypto.randomUUID()}${ext}`;
      const client = supabase();
      const { error } = await client.storage.from(env.supabaseBucket).upload(path, file.buffer, {
        contentType: file.mimetype, upsert: false,
      });
      if (error) throw BadRequest(`Upload failed: ${error.message}`);
      return prisma.document.create({
        data: {
          title: meta.title,
          category: meta.category ?? null,
          projectId: meta.projectId ?? null,
          uploadedBy,
          filePath: path,
          mimeType: file.mimetype,
          sizeBytes: file.size,
        },
        include,
      });
    },

    async getDownloadUrl(id: string) {
      const doc = await prisma.document.findUnique({ where: { id } });
      if (!doc) throw NotFound("Document not found");
      const client = supabase();
      const { data, error } = await client.storage.from(env.supabaseBucket).createSignedUrl(doc.filePath, 60 * 10);
      if (error || !data) throw BadRequest("Could not create download URL");
      return { url: data.signedUrl, document: doc };
    },

    async remove(id: string) {
      const doc = await prisma.document.findUnique({ where: { id } });
      if (!doc) throw NotFound("Document not found");
      try { await supabase().storage.from(env.supabaseBucket).remove([doc.filePath]); } catch { /* ignore */ }
      await prisma.document.delete({ where: { id } });
      return { id };
    },
  };
}
