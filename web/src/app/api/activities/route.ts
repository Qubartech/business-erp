import { apiHandler } from "@/lib/api-handler";
import { container } from "@/lib/container";
import { createActivityService } from "@/lib/services/activity.service";

const service = createActivityService(container);

export const GET = apiHandler(async () => {
  return service.list(20);
});
