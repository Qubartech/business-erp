import { Router } from "express";
import { container } from "../lib/container.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { created, ok } from "../lib/response.js";
import { listAttendanceQuerySchema } from "./attendance.schemas.js";
import { createAttendanceService } from "./attendance.service.js";

export const attendanceRouter = Router();
const service = createAttendanceService(container);
attendanceRouter.use(requireAuth);

attendanceRouter.post("/check-in", async (req, res, next) => {
  try {
    created(res, await service.checkIn(req.user!.sub), "Checked in successfully");
  } catch (e) {
    next(e);
  }
});

attendanceRouter.post("/check-out", async (req, res, next) => {
  try {
    ok(res, await service.checkOut(req.user!.sub), "Checked out successfully");
  } catch (e) {
    next(e);
  }
});

attendanceRouter.get("/today", async (req, res, next) => {
  try {
    ok(res, await service.getTodayStatus(req.user!.sub));
  } catch (e) {
    next(e);
  }
});

attendanceRouter.get("/", validate(listAttendanceQuerySchema, "query"), async (req, res, next) => {
  try {
    ok(res, await service.list(req.user!.sub, req.user!.role, req.query as never));
  } catch (e) {
    next(e);
  }
});
