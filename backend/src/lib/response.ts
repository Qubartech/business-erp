import type { Response } from "express";

export type ApiSuccess<T> = { success: true; message: string; data: T };
export type ApiError = { success: false; message: string; errors?: Record<string, string[]> };

export function ok<T>(res: Response, data: T, message = "Operation successful", status = 200) {
  return res.status(status).json({ success: true, message, data } satisfies ApiSuccess<T>);
}

export function created<T>(res: Response, data: T, message = "Created") {
  return ok(res, data, message, 201);
}

export function fail(res: Response, status: number, message: string, errors?: Record<string, string[]>) {
  const body: ApiError = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(status).json(body);
}
