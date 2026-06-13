import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../lib/errors.js";
import { fail } from "../lib/response.js";
import { ZodError } from "zod";

export function notFoundHandler(_req: Request, res: Response) {
  return fail(res, 404, "Route not found");
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const key = issue.path.join(".") || "_";
      (errors[key] ??= []).push(issue.message);
    }
    return fail(res, 400, "Validation failed", errors);
  }
  if (err instanceof HttpError) {
    return fail(res, err.status, err.message, err.errors);
  }
  // eslint-disable-next-line no-console
  console.error(err);
  return fail(res, 500, "Internal server error");
}
