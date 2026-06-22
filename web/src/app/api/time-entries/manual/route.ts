import { apiHandler } from "@/lib/api-handler";
import { container } from "@/lib/container";
import { createTimeEntriesService } from "@/lib/services/time-entries.service";
import { manualEntrySchema } from "@/lib/services/time-entries.schemas";

const service = createTimeEntriesService(container);

export const POST = apiHandler(
  async (req, { user, body }) => {
    return service.addManual(user.sub, body);
  },
  {
    schema: manualEntrySchema,
    status: 201,
  }
);
