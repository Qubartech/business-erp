import { apiHandler } from "@/lib/api-handler";
import { container } from "@/lib/container";
import { createTimeEntriesService } from "@/lib/services/time-entries.service";
import { stopTimerSchema } from "@/lib/services/time-entries.schemas";

const service = createTimeEntriesService(container);

export const POST = apiHandler(
  async (req, { user, body }) => {
    return service.stopTimer(user.sub, body.entryId, body.endTime);
  },
  {
    schema: stopTimerSchema,
  }
);
