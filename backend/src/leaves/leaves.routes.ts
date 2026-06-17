import { Router } from "express";
import { container } from "../lib/container.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { created, ok } from "../lib/response.js";
import { createLeaveSchema, updateLeaveSchema } from "./leaves.schemas.js";
import { createLeavesService } from "./leaves.service.js";

export const leavesRouter = Router();
const service = createLeavesService(container);

leavesRouter.use(requireAuth);

leavesRouter.get("/", async (req, res, next) => {
  try {
    const list = await service.list(req.user!.sub, req.user!.role, req.query);
    ok(res, list);
  } catch (e) {
    next(e);
  }
});

leavesRouter.post("/", validate(createLeaveSchema), async (req, res, next) => {
  try {
    const item = await service.create(req.user!.sub, req.body);
    created(res, item, "Leave request created successfully");
  } catch (e) {
    next(e);
  }
});

leavesRouter.patch("/:id", validate(updateLeaveSchema), async (req, res, next) => {
  try {
    const item = await service.update(req.user!.sub, req.user!.role, req.params.id, req.body);
    ok(res, item, "Leave request updated successfully");
  } catch (e) {
    next(e);
  }
});

leavesRouter.delete("/:id", async (req, res, next) => {
  try {
    const item = await service.remove(req.user!.sub, req.user!.role, req.params.id);
    ok(res, item, "Leave request canceled successfully");
  } catch (e) {
    next(e);
  }
});
