import { NextResponse } from "next/server";

export type ApiSuccess<T> = { success: true; message: string; data: T };
export type ApiError = { success: false; message: string; errors?: Record<string, string[]> };

export function ok<T>(data: T, message = "Operation successful", status = 200) {
  return NextResponse.json({ success: true, message, data } satisfies ApiSuccess<T>, { status });
}

export function created<T>(data: T, message = "Created") {
  return ok(data, message, 201);
}

export function fail(status: number, message: string, errors?: Record<string, string[]>) {
  const body: ApiError = { success: false, message };
  if (errors) body.errors = errors;
  return NextResponse.json(body, { status });
}
