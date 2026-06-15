import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { ok } from "../lib/response.js";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

dashboardRouter.get("/summary", async (_req, res, next) => {
  try {
        const [
      totalProjects,
      activeProjects,
      totalTasks,
      completedTasks,
      teamMembers,
      statusCounts,
      totalTimeResult,
      latestCommits,
      activeAttendance,
      leavesToday
    ] = await Promise.all([
      prisma.project.count(),
      prisma.project.count({ where: { status: "active" } }),
      prisma.task.count(),
      prisma.task.count({ where: { status: "done" } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.project.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      prisma.timeEntry.aggregate({
        _sum: { durationMinutes: true },
      }),
      prisma.commit.findMany({
        orderBy: { committedAt: "desc" },
        take: 5,
        include: { project: { select: { id: true, name: true } } },
      }),
      prisma.attendance.findMany({
        where: { checkOut: null },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              timeEntries: {
                where: { endTime: null },
                include: {
                  task: {
                    select: {
                      id: true,
                      title: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { checkIn: "asc" },
      }),
      prisma.leave.findMany({
        where: {
          status: "approved",
          startDate: { lte: new Date(new Date().setHours(23, 59, 59, 999)) },
          endDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    const projectsByStatus = statusCounts.reduce((acc, curr) => {
      acc[curr.status] = curr._count.id;
      return acc;
    }, {} as Record<string, number>);

    ok(res, {
      totalProjects,
      activeProjects,
      totalTasks,
      completedTasks,
      teamMembers,
      projectsByStatus,
      totalMinutes: totalTimeResult._sum.durationMinutes ?? 0,
      latestCommits,
      activeAttendance,
      leavesToday,
    });
  } catch (e) { next(e); }
});

