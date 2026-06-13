import { Router } from "express";
import { container } from "../lib/container.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { created, ok } from "../lib/response.js";
import { createNoteSchema, listNotesQuerySchema, updateNoteSchema } from "./notes.schemas.js";
import { createNotesService } from "./notes.service.js";

export const notesRouter = Router();
const service = createNotesService(container);
notesRouter.use(requireAuth);

notesRouter.get("/", validate(listNotesQuerySchema, "query"), async (req, res, next) => {
  try { ok(res, await service.list(req.user!.sub, req.query as never)); } catch (e) { next(e); }
});

notesRouter.get("/:id", async (req, res, next) => {
  try { ok(res, await service.get(req.user!.sub, req.params.id)); } catch (e) { next(e); }
});

notesRouter.post("/", validate(createNoteSchema), async (req, res, next) => {
  try { created(res, await service.create(req.user!.sub, req.body), "Note created"); } catch (e) { next(e); }
});

notesRouter.patch("/:id", validate(updateNoteSchema), async (req, res, next) => {
  try { ok(res, await service.update(req.user!.sub, req.params.id, req.body), "Note updated"); } catch (e) { next(e); }
});

notesRouter.delete("/:id", async (req, res, next) => {
  try { ok(res, await service.remove(req.user!.sub, req.params.id), "Note deleted"); } catch (e) { next(e); }
});
