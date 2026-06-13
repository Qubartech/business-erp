import { Router } from "express";
import { container } from "../lib/container.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { created, ok } from "../lib/response.js";
import { listEntriesQuerySchema, manualEntrySchema, startTimerSchema, stopTimerSchema } from "./time-entries.schemas.js";
import { createTimeEntriesService } from "./time-entries.service.js";

export const timeEntriesRouter = Router();
const service = createTimeEntriesService(container);
timeEntriesRouter.use(requireAuth);

timeEntriesRouter.get("/", validate(listEntriesQuerySchema, "query"), async (req, res, next) => {
  try { ok(res, await service.list(req.user!.sub, req.user!.role, req.query as never)); } catch (e) { next(e); }
});

timeEntriesRouter.get("/current", async (req, res, next) => {
  try { ok(res, await service.currentTimer(req.user!.sub)); } catch (e) { next(e); }
});

timeEntriesRouter.post("/start", validate(startTimerSchema), async (req, res, next) => {
  try { created(res, await service.startTimer(req.user!.sub, req.body.taskId), "Timer started"); } catch (e) { next(e); }
});

timeEntriesRouter.post("/stop", validate(stopTimerSchema), async (req, res, next) => {
  try { ok(res, await service.stopTimer(req.user!.sub, req.body.entryId), "Timer stopped"); } catch (e) { next(e); }
});

timeEntriesRouter.post("/manual", validate(manualEntrySchema), async (req, res, next) => {
  try { created(res, await service.addManual(req.user!.sub, req.body), "Entry added"); } catch (e) { next(e); }
});

timeEntriesRouter.delete("/:id", async (req, res, next) => {
  try { ok(res, await service.remove(req.user!.sub, req.user!.role, req.params.id), "Deleted"); } catch (e) { next(e); }
});
