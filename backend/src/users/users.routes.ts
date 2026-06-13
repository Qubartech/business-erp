import { Router } from "express";
import { z } from "zod";
import { container } from "../lib/container.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { created, ok } from "../lib/response.js";
import { createUserSchema, listUsersQuerySchema, updateUserSchema } from "./users.schemas.js";
import { createUsersService } from "./users.service.js";

export const usersRouter = Router();
const service = createUsersService(container);

usersRouter.use(requireAuth, requireRole("admin"));

usersRouter.get("/", validate(listUsersQuerySchema, "query"), async (req, res, next) => {
  try { ok(res, await service.list(req.query as never)); } catch (e) { next(e); }
});

usersRouter.get("/:id", async (req, res, next) => {
  try { ok(res, await service.get(req.params.id)); } catch (e) { next(e); }
});

usersRouter.post("/", validate(createUserSchema), async (req, res, next) => {
  try { created(res, await service.create(req.body), "User created"); } catch (e) { next(e); }
});

usersRouter.patch("/:id", validate(updateUserSchema), async (req, res, next) => {
  try { ok(res, await service.update(req.params.id, req.body), "User updated"); } catch (e) { next(e); }
});

const setActiveSchema = z.object({ isActive: z.boolean() });
usersRouter.post("/:id/active", validate(setActiveSchema), async (req, res, next) => {
  try { ok(res, await service.setActive(req.params.id, req.body.isActive), "Updated"); } catch (e) { next(e); }
});
