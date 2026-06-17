import { describe, expect, it, vi } from "vitest";
import { createAttendanceService } from "../src/attendance/attendance.service.js";

describe("attendance service", () => {
  it("allows a second check-in on the same day after checkout", async () => {
    const attendance = {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({
        id: "att-2",
        userId: "user-1",
        checkIn: new Date(),
        checkOut: null,
      }),
    };

    const service = createAttendanceService({ prisma: { attendance } as any });

    const result = await service.checkIn("user-1");
    expect(result).toBeDefined();
    expect(attendance.create).toHaveBeenCalled();
  });

  it("rejects check-in if user is already checked in", async () => {
    const attendance = {
      findFirst: vi.fn().mockResolvedValue({
        id: "att-1",
        userId: "user-1",
        checkIn: new Date(),
        checkOut: null,
      }),
      create: vi.fn(),
    };

    const service = createAttendanceService({ prisma: { attendance } as any });

    await expect(service.checkIn("user-1")).rejects.toMatchObject({
      status: 409,
      message: "You are already checked in",
    });
    expect(attendance.create).not.toHaveBeenCalled();
  });
});
