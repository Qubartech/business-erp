import { Router } from "express";
import { container } from "../lib/container.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { created, ok } from "../lib/response.js";
import { createHolidaySchema } from "./holidays.schemas.js";
import { createHolidaysService } from "./holidays.service.js";

export const holidaysRouter = Router();
const service = createHolidaysService(container);

holidaysRouter.use(requireAuth);

holidaysRouter.get("/", async (req, res, next) => {
  try {
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const list = await service.list(year);
    ok(res, list);
  } catch (e) {
    next(e);
  }
});

// Admin and manager only can modify holidays
holidaysRouter.post("/", requireRole("admin", "manager"), validate(createHolidaySchema), async (req, res, next) => {
  try {
    const item = await service.create(req.body);
    created(res, item, "Holiday created successfully");
  } catch (e) {
    next(e);
  }
});

holidaysRouter.delete("/:id", requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const item = await service.remove(req.params.id);
    ok(res, item, "Holiday deleted successfully");
  } catch (e) {
    next(e);
  }
});
