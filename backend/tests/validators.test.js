import { describe, expect, it } from "vitest";
import { createUserSchema, listUsersQuerySchema } from "../src/users/users.schemas.js";
import { createTaskSchema } from "../src/tasks/tasks.schemas.js";
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
});
