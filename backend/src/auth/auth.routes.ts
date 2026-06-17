import { Router, type Request, type Response, type NextFunction } from "express";
import { container } from "../lib/container.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { created, ok } from "../lib/response.js";
import { loginSchema, refreshSchema } from "./auth.schemas.js";
import { createAuthService } from "./auth.service.js";

export const authRouter = Router();
const service = createAuthService(container);

authRouter.post("/login", validate(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.login(req.body);
    return created(res, result, "Logged in");
  } catch (e) { next(e); }
});

authRouter.post("/refresh", validate(refreshSchema), async (req, res, next) => {
  try {
    const tokens = await service.refresh(req.body.refreshToken);
    return ok(res, tokens, "Refreshed");
  } catch (e) { next(e); }
});

authRouter.post("/logout", validate(refreshSchema), async (req, res, next) => {
  try {
    await service.logout(req.body.refreshToken);
    return ok(res, null, "Logged out");
  } catch (e) { next(e); }
});

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await service.me(req.user!.sub);
    return ok(res, user);
  } catch (e) { next(e); }
});

authRouter.get("/me/api-key", requireAuth, async (req, res, next) => {
  try {
    const result = await service.getApiKey(req.user!.sub);
    return ok(res, result);
  } catch (e) { next(e); }
});

authRouter.post("/me/api-key", requireAuth, async (req, res, next) => {
  try {
    const result = await service.generateApiKey(req.user!.sub);
    return ok(res, result, "API key generated");
  } catch (e) { next(e); }
});

authRouter.delete("/me/api-key", requireAuth, async (req, res, next) => {
  try {
    await service.deleteApiKey(req.user!.sub);
    return ok(res, null, "API key revoked");
  } catch (e) { next(e); }
});

