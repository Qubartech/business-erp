import { apiHandler } from "@/lib/api-handler";
import { container } from "@/lib/container";
import { createAttendanceService } from "@/lib/services/attendance.service";
import { listAttendanceQuerySchema } from "@/lib/services/attendance.schemas";

const service = createAttendanceService(container);

export const GET = apiHandler(
  async (req, { user, query }) => {
    return service.list(user.sub, user.role, query as any);
  },
  {
    querySchema: listAttendanceQuerySchema,
  }
);
