import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { ok } from "../lib/response.js";
import { upsertSettingSchema } from "./settings.schemas.js";

export const settingsRouter = Router();
settingsRouter.use(requireAuth);

settingsRouter.get("/", async (_req, res, next) => {
  try {
    const items = await prisma.setting.findMany({ orderBy: { key: "asc" } });
    ok(res, { items });
  } catch (e) { next(e); }
});

settingsRouter.put("/", requireRole("admin"), validate(upsertSettingSchema), async (req, res, next) => {
  try {
    const { key, value } = req.body;
    const saved = await prisma.setting.upsert({
      where: { key }, update: { value }, create: { key, value },
    });
    ok(res, saved, "Saved");
  } catch (e) { next(e); }
});

settingsRouter.delete("/:key", requireRole("admin"), async (req, res, next) => {
  try {
    await prisma.setting.deleteMany({ where: { key: req.params.key } });
    ok(res, { key: req.params.key }, "Deleted");
  } catch (e) { next(e); }
});
