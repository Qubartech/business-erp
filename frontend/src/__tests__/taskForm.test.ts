import { describe, expect, it } from "vitest";
import { z } from "zod";

const taskFormSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1),
  status: z.enum(["todo","in_progress","review","done"]),
  priority: z.enum(["low","medium","high","critical"]),
});

describe("task form validation", () => {
  it("requires uuid projectId and non-empty title", () => {
    expect(taskFormSchema.safeParse({ projectId: "x", title: "", status: "todo", priority: "low" }).success).toBe(false);
  });
  it("accepts valid data", () => {
    expect(taskFormSchema.safeParse({
      projectId: "11111111-1111-1111-1111-111111111111", title: "ok", status: "todo", priority: "low",
    }).success).toBe(true);
  });
});
