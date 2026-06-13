import { Router } from "express";
import { container } from "../lib/container.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { created, ok } from "../lib/response.js";
import { createTaskSchema, listTasksQuerySchema, updateTaskSchema } from "./tasks.schemas.js";
import { createTasksService } from "./tasks.service.js";

export const tasksRouter = Router();
const service = createTasksService(container);

tasksRouter.use(requireAuth);

tasksRouter.get("/", validate(listTasksQuerySchema, "query"), async (req, res, next) => {
  try { ok(res, await service.list(req.query as never)); } catch (e) { next(e); }
});

tasksRouter.get("/:id", async (req, res, next) => {
  try { ok(res, await service.get(req.params.id)); } catch (e) { next(e); }
});

tasksRouter.post("/", requireRole("admin", "manager"), validate(createTaskSchema), async (req, res, next) => {
  try { created(res, await service.create(req.body, req.user!.sub), "Task created"); } catch (e) { next(e); }
});

tasksRouter.patch("/:id", validate(updateTaskSchema), async (req, res, next) => {
  try { ok(res, await service.update(req.params.id, req.body), "Task updated"); } catch (e) { next(e); }
});

tasksRouter.delete("/:id", requireRole("admin", "manager"), async (req, res, next) => {
  try { ok(res, await service.remove(req.params.id), "Task deleted"); } catch (e) { next(e); }
});
