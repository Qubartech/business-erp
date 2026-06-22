import { apiHandler } from "@/lib/api-handler";
import { container } from "@/lib/container";
import { createAttendanceService } from "@/lib/services/attendance.service";

const service = createAttendanceService(container);

export const GET = apiHandler(async (req, { user }) => {
  return service.getTodayStatus(user.sub);
});
