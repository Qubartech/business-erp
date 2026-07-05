import type { Container } from "../container";
import type { z } from "zod";
import type { listActivitiesQuerySchema } from "./activities.schemas";

type ListQuery = z.infer<typeof listActivitiesQuerySchema>;

export function createActivityService({ prisma }: Pick<Container, "prisma">) {
  return {
    async log(data: {
      type: string; // "attendance", "project", "task", "note", "document", "commit", "transaction"
      action: string; // "create", "update", "delete", "check_in", "check_out", "status_change", etc.
      userId?: string | null;
      projectId?: string | null;
      description: string; // e.g. "created task 'Implement Dark Mode'"
      metadata?: any;
    }) {
      try {
        const user = data.userId ? await prisma.user.findUnique({ where: { id: data.userId } }) : null;
        const fullDescription = user ? `${user.name} ${data.description}` : data.description;

        return await prisma.activity.create({
          data: {
            type: data.type,
            action: data.action,
            userId: data.userId || null,
            projectId: data.projectId || null,
            description: fullDescription,
            metadata: data.metadata || undefined,
          },
        });
      } catch (e) {
        console.error("Failed to log activity:", e);
      }
    },

    async list(q: ListQuery) {
      const where: any = {};
      if (q.type) {
        where.type = q.type;
      }
      if (q.userId) {
        where.userId = q.userId;
      }
      if (q.projectId) {
        where.projectId = q.projectId;
      }
      if (q.search) {
        where.description = {
          contains: q.search,
          mode: "insensitive",
        };
      }

      const [items, total] = await Promise.all([
        prisma.activity.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (q.page - 1) * q.pageSize,
          take: q.pageSize,
          include: {
            user: { select: { id: true, name: true, email: true } },
            project: { select: { id: true, name: true } },
          },
        }),
        prisma.activity.count({ where }),
      ]);

      return {
        items,
        total,
        page: q.page,
        pageSize: q.pageSize,
      };
    },

    async countUnread(lastRead: Date) {
      return prisma.activity.count({
        where: {
          createdAt: { gt: lastRead },
        },
      });
    }
  };
}
