import { apiHandler } from "@/lib/api-handler";
import { container } from "@/lib/container";
import { createTimeEntriesService } from "@/lib/services/time-entries.service";
import { startTimerSchema } from "@/lib/services/time-entries.schemas";

const service = createTimeEntriesService(container);

export const POST = apiHandler(
  async (req, { user, body }) => {
    return service.startTimer(user.sub, body.taskId);
  },
  {
    schema: startTimerSchema,
    status: 201,
  }
);
