import { Router } from "express";
import { container } from "../lib/container.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { created, ok } from "../lib/response.js";
import { createProjectSchema, listProjectsQuerySchema, membersSchema, updateProjectSchema } from "./projects.schemas.js";
import { createProjectsService } from "./projects.service.js";

export const projectsRouter = Router();
const service = createProjectsService(container);

projectsRouter.use(requireAuth);

projectsRouter.get("/", validate(listProjectsQuerySchema, "query"), async (req, res, next) => {
  try { ok(res, await service.list(req.query as never)); } catch (e) { next(e); }
});

projectsRouter.get("/:id", async (req, res, next) => {
  try { ok(res, await service.get(req.params.id)); } catch (e) { next(e); }
});

projectsRouter.post("/", requireRole("admin", "manager"), validate(createProjectSchema), async (req, res, next) => {
  try { created(res, await service.create(req.body, req.user!.sub), "Project created"); } catch (e) { next(e); }
});

projectsRouter.patch("/:id", requireRole("admin", "manager"), validate(updateProjectSchema), async (req, res, next) => {
  try { ok(res, await service.update(req.params.id, req.body), "Project updated"); } catch (e) { next(e); }
});

projectsRouter.post("/:id/archive", requireRole("admin", "manager"), async (req, res, next) => {
  try { ok(res, await service.archive(req.params.id), "Project archived"); } catch (e) { next(e); }
});

projectsRouter.post("/:id/members", requireRole("admin", "manager"), validate(membersSchema), async (req, res, next) => {
  try { ok(res, await service.addMembers(req.params.id, req.body.userIds), "Members added"); } catch (e) { next(e); }
});

projectsRouter.delete("/:id/members/:userId", requireRole("admin", "manager"), async (req, res, next) => {
  try { ok(res, await service.removeMember(req.params.id, req.params.userId), "Member removed"); } catch (e) { next(e); }
});
