import { Router } from "express";
import multer from "multer";
import { container } from "../lib/container.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { created, ok } from "../lib/response.js";
import { documentMetadataSchema, listDocumentsQuerySchema } from "./documents.schemas.js";
import { createDocumentsService } from "./documents.service.js";

export const documentsRouter = Router();
const service = createDocumentsService(container);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

documentsRouter.use(requireAuth);

documentsRouter.get("/", validate(listDocumentsQuerySchema, "query"), async (req, res, next) => {
  try { ok(res, await service.list(req.query as never)); } catch (e) { next(e); }
});

documentsRouter.post("/", upload.single("file"), validate(documentMetadataSchema), async (req, res, next) => {
  try {
    const file = req.file
      ? { buffer: req.file.buffer, originalname: req.file.originalname, mimetype: req.file.mimetype, size: req.file.size }
      : undefined;
    const doc = await service.upload(req.user!.sub, file, req.body);
    created(res, doc, "Document uploaded");
  } catch (e) { next(e); }
});

documentsRouter.get("/:id/download", async (req, res, next) => {
  try { ok(res, await service.getDownloadUrl(req.params.id)); } catch (e) { next(e); }
});

documentsRouter.delete("/:id", async (req, res, next) => {
  try { ok(res, await service.remove(req.params.id), "Deleted"); } catch (e) { next(e); }
});
