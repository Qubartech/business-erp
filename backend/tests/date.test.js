import { describe, expect, it } from "vitest";
import { addDays, diffMinutes } from "../src/lib/date.js";
describe("date utils", () => {
    it("addDays adds days correctly", () => {
        const d = new Date("2024-01-01T00:00:00Z");
        expect(addDays(d, 7).toISOString()).toBe("2024-01-08T00:00:00.000Z");
    });
    it("diffMinutes returns positive minutes", () => {
        const a = new Date("2024-01-01T10:00:00Z");
        const b = new Date("2024-01-01T10:45:00Z");
        expect(diffMinutes(a, b)).toBe(45);
    });
});
