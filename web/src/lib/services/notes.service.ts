import { Forbidden, NotFound } from "../errors";
import type { Container } from "../container";
import type { z } from "zod";
import type { createNoteSchema, listNotesQuerySchema, updateNoteSchema } from "./notes.schemas.js";
import { createActivityService } from "./activity.service";

type ListQuery = z.infer<typeof listNotesQuerySchema>;
type CreateInput = z.infer<typeof createNoteSchema>;
type UpdateInput = z.infer<typeof updateNoteSchema>;

export function createNotesService({ prisma }: Pick<Container, "prisma">) {
  const activityService = createActivityService({ prisma });

  async function assertOwner(id: string, userId: string) {
    const n = await prisma.note.findUnique({ where: { id } });
    if (!n) throw NotFound("Note not found");
    if (n.userId !== userId) throw Forbidden("Not your note");
    return n;
  }

  return {
    async list(userId: string, q: ListQuery) {
      const where = {
        userId,
        ...(q.search ? { OR: [{ title: { contains: q.search, mode: "insensitive" as const } }, { content: { contains: q.search, mode: "insensitive" as const } }] } : {}),
      };
      const [items, total] = await Promise.all([
        prisma.note.findMany({ where, orderBy: { updatedAt: "desc" }, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
        prisma.note.count({ where }),
      ]);
      return { items, total, page: q.page, pageSize: q.pageSize };
    },
    async get(userId: string, id: string) { return assertOwner(id, userId); },
    async create(userId: string, input: CreateInput) {
      const res = await prisma.note.create({
        data: {
          userId,
          title: input.title,
          content: input.content,
          color: input.color,
          category: input.category,
          pinned: input.pinned,
        }
      });

      await activityService.log({
        type: "note",
        action: "create",
        userId,
        description: `created note '${res.title}'`,
      });

      return res;
    },
    async update(userId: string, id: string, input: UpdateInput) {
      await assertOwner(id, userId);
      return prisma.note.update({ where: { id }, data: input });
    },
    async remove(userId: string, id: string) {
      await assertOwner(id, userId);
      await prisma.note.delete({ where: { id } });
      return { id };
    },
  };
}
