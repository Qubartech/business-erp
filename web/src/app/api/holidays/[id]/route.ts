import { apiHandler } from "@/lib/api-handler";
import { container } from "@/lib/container";
import { createHolidaysService } from "@/lib/services/holidays.service";

const service = createHolidaysService(container);

export const DELETE = apiHandler(
  async (req, { params }) => {
    return service.remove(params.id);
  },
  {
    roles: ["admin", "manager"],
  }
);
