import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { ok } from "../lib/response.js";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

dashboardRouter.get("/summary", async (_req, res, next) => {
  try {
    const [totalProjects, activeProjects, totalTasks, completedTasks, teamMembers] = await Promise.all([
      prisma.project.count(),
      prisma.project.count({ where: { status: "active" } }),
      prisma.task.count(),
      prisma.task.count({ where: { status: "done" } }),
      prisma.user.count({ where: { isActive: true } }),
    ]);
    ok(res, { totalProjects, activeProjects, totalTasks, completedTasks, teamMembers });
  } catch (e) { next(e); }
});
