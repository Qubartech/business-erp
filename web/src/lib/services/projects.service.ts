import { NotFound } from "../errors";
import type { Container } from "../container";
import type { z } from "zod";
import type { createProjectSchema, listProjectsQuerySchema, updateProjectSchema } from "./projects.schemas.js";
import { createActivityService } from "./activity.service";

type CreateInput = z.infer<typeof createProjectSchema>;
type UpdateInput = z.infer<typeof updateProjectSchema>;
type ListQuery = z.infer<typeof listProjectsQuerySchema>;

export function createProjectsService({ prisma }: Pick<Container, "prisma">) {
  const activityService = createActivityService({ prisma });
  const include = {
    members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
    creator: { select: { id: true, name: true, email: true } },
    _count: { select: { tasks: true } },
  } as const;

  return {
    async list(q: ListQuery) {
      const where = {
        ...(q.status ? { status: q.status } : {}),
        ...(q.category ? { category: q.category } : {}),
        ...(q.search ? { name: { contains: q.search, mode: "insensitive" as const } } : {}),
      };
      const listInclude = {
        members: { select: { id: true, userId: true } },
        creator: { select: { id: true, name: true, email: true } },
        commits: {
          orderBy: { committedAt: "desc" as const },
          take: 1,
          select: { committedAt: true, sha: true, message: true, authorName: true },
        },
        tasks: {
          select: { status: true },
        },
        _count: { select: { tasks: true } },
      };
      const [items, total] = await Promise.all([
        prisma.project.findMany({
          where, include: listInclude, orderBy: { createdAt: "desc" },
          skip: (q.page - 1) * q.pageSize, take: q.pageSize,
        }),
        prisma.project.count({ where }),
      ]);
      return { items, total, page: q.page, pageSize: q.pageSize };
    },

    async get(id: string) {
      const project = await prisma.project.findUnique({ where: { id }, include });
      if (!project) throw NotFound("Project not found");
      return project;
    },

    async create(input: CreateInput, createdBy: string) {
      const res = await prisma.$transaction(async (tx) => {
        const project = await tx.project.create({
          data: {
            name: input.name, description: input.description ?? null,
            status: input.status, startDate: input.startDate ?? null, endDate: input.endDate ?? null,
            githubRepo: input.githubRepo ?? null,
            category: input.category,
            createdBy,
          },
        });
        if (input.memberIds.length) {
          await tx.projectMember.createMany({
            data: input.memberIds.map((userId) => ({ projectId: project.id, userId })),
            skipDuplicates: true,
          });
        }
        return tx.project.findUniqueOrThrow({ where: { id: project.id }, include });
      });

      await activityService.log({
        type: "project",
        action: "create",
        userId: createdBy,
        projectId: res.id,
        description: `created project '${res.name}'`,
      });

      return res;
    },

    async update(id: string, input: UpdateInput, userId?: string) {
      const exists = await prisma.project.findUnique({ where: { id } });
      if (!exists) throw NotFound("Project not found");
      const res = await prisma.$transaction(async (tx) => {
        await tx.project.update({
          where: { id },
          data: {
            name: input.name, description: input.description,
            status: input.status, startDate: input.startDate, endDate: input.endDate,
            githubRepo: input.githubRepo,
            category: input.category,
          },
        });
        if (input.memberIds) {
          await tx.projectMember.deleteMany({ where: { projectId: id } });
          if (input.memberIds.length) {
            await tx.projectMember.createMany({
              data: input.memberIds.map((userId) => ({ projectId: id, userId })),
              skipDuplicates: true,
            });
          }
        }
        return tx.project.findUniqueOrThrow({ where: { id }, include });
      });

      if (userId) {
        if (input.status && input.status !== exists.status) {
          await activityService.log({
            type: "project",
            action: "status_change",
            userId,
            projectId: id,
            description: `changed status of project '${res.name}' to '${input.status}'`,
          });
        } else {
          await activityService.log({
            type: "project",
            action: "update",
            userId,
            projectId: id,
            description: `updated project '${res.name}'`,
          });
        }
      }

      return res;
    },

    async archive(id: string, userId?: string) {
      const exists = await prisma.project.findUnique({ where: { id } });
      if (!exists) throw NotFound("Project not found");
      const res = await prisma.project.update({ where: { id }, data: { status: "archived" }, include });

      if (userId) {
        await activityService.log({
          type: "project",
          action: "status_change",
          userId,
          projectId: id,
          description: `archived project '${res.name}'`,
        });
      }

      return res;
    },

    async addMembers(id: string, userIds: string[]) {
      const exists = await prisma.project.findUnique({ where: { id } });
      if (!exists) throw NotFound("Project not found");
      await prisma.projectMember.createMany({
        data: userIds.map((userId) => ({ projectId: id, userId })),
        skipDuplicates: true,
      });
      return prisma.project.findUniqueOrThrow({ where: { id }, include });
    },

    async removeMember(id: string, userId: string) {
      await prisma.projectMember.deleteMany({ where: { projectId: id, userId } });
      return prisma.project.findUniqueOrThrow({ where: { id }, include });
    },
  };
}
