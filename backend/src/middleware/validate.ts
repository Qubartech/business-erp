import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

type Source = "body" | "query" | "params";

export const validate =
  (schema: ZodSchema, source: Source = "body") =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) return next(result.error);
    // overwrite with parsed (coerced) data
    (req as unknown as Record<Source, unknown>)[source] = result.data;
    next();
  };
