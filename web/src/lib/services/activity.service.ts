import type { Container } from "../container";

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

    async list(limit = 20) {
      return prisma.activity.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
          project: { select: { id: true, name: true } },
        },
      });
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
