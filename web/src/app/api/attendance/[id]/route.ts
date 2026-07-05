import { apiHandler } from "@/lib/api-handler";
import { container } from "@/lib/container";
import { createAttendanceService } from "@/lib/services/attendance.service";
import { updateAttendanceSchema } from "@/lib/services/attendance.schemas";

const service = createAttendanceService(container);

export const PATCH = apiHandler(
  async (req, { params, body }) => {
    return service.update(params.id, body);
  },
  {
    requireAuth: true,
    roles: ["admin"],
    schema: updateAttendanceSchema,
  }
);
