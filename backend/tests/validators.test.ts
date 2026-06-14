import { describe, expect, it } from "vitest";
import { createUserSchema, listUsersQuerySchema } from "../src/users/users.schemas.js";
import { createTaskSchema } from "../src/tasks/tasks.schemas.js";
import { updateEntrySchema } from "../src/time-entries/time-entries.schemas.js";

describe("validators", () => {
  it("rejects short passwords", () => {
    const r = createUserSchema.safeParse({ name: "A", email: "a@b.co", password: "short" });
    expect(r.success).toBe(false);
  });
  it("accepts valid user", () => {
    const r = createUserSchema.safeParse({ name: "Ada", email: "a@b.co", password: "longenough" });
    expect(r.success).toBe(true);
  });
  it("coerces pagination", () => {
    const r = listUsersQuerySchema.parse({ page: "2", pageSize: "5" });
    expect(r.page).toBe(2);
    expect(r.pageSize).toBe(5);
  });
  it("task requires projectId uuid", () => {
    const r = createTaskSchema.safeParse({ projectId: "not-uuid", title: "x" });
    expect(r.success).toBe(false);
  });
  it("rejects update if endTime is before or equal to startTime", () => {
    const r = updateEntrySchema.safeParse({
      startTime: "2026-06-14T10:00:00Z",
      endTime: "2026-06-14T09:00:00Z",
    });
    expect(r.success).toBe(false);
  });
  it("accepts valid updateEntry payload and coerces dates", () => {
    const r = updateEntrySchema.safeParse({
      startTime: "2026-06-14T09:00:00Z",
      endTime: "2026-06-14T10:00:00Z",
      taskId: "12345678-1234-1234-1234-123456789012",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.startTime instanceof Date).toBe(true);
      expect(r.data.endTime instanceof Date).toBe(true);
    }
  });
});
