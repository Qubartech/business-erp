import { apiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";

export const GET = apiHandler(async () => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const [
    teamMembers,
    projectStatusCounts,
    taskStatusCounts,
    totalTimeResult,
    latestCommits,
    activeAttendance,
    leavesToday,
    activeProjectsList,
    inProgressTasksCount
  ] = await Promise.all([
    prisma.user.count({ where: { isActive: true } }),
    prisma.project.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.task.groupBy({
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
      where: {
        OR: [
          { checkOut: null },
          {
            checkIn: {
              gte: startOfToday,
              lte: endOfToday,
            },
          },
          {
            checkOut: {
              gte: startOfToday,
              lte: endOfToday,
            },
          },
        ],
      },
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
    prisma.project.findMany({
      where: { status: "active" },
      select: {
        id: true,
        name: true,
        startDate: true,
        createdAt: true,
        commits: {
          orderBy: { committedAt: "desc" },
          take: 1,
          select: {
            committedAt: true,
          },
        },
        tasks: {
          select: {
            status: true,
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.task.count({
      where: { status: "in_progress" }
    })
  ]);

  // Aggregate project metrics from status counts
  const projectsByStatus = projectStatusCounts.reduce((acc: Record<string, number>, curr: any) => {
    acc[curr.status] = curr._count.id;
    return acc;
  }, {} as Record<string, number>);

  const totalProjects = projectStatusCounts.reduce((sum: number, curr: any) => sum + curr._count.id, 0);
  const activeProjects = projectsByStatus["active"] ?? 0;

  // Aggregate task metrics from status counts
  const tasksByStatus = taskStatusCounts.reduce((acc: Record<string, number>, curr: any) => {
    acc[curr.status] = curr._count.id;
    return acc;
  }, {} as Record<string, number>);

  const totalTasks = taskStatusCounts.reduce((sum: number, curr: any) => sum + curr._count.id, 0);
  const completedTasks = tasksByStatus["done"] ?? 0;

  return {
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
    activeProjectsList,
    inProgressTasks: inProgressTasksCount,
  };
});
