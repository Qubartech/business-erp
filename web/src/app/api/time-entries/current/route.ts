import { apiHandler } from "@/lib/api-handler";
import { container } from "@/lib/container";
import { createTimeEntriesService } from "@/lib/services/time-entries.service";

const service = createTimeEntriesService(container);

export const GET = apiHandler(async (req, { user }) => {
  return service.currentTimer(user.sub);
});
