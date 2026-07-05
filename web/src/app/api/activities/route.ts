import { apiHandler } from "@/lib/api-handler";
import { container } from "@/lib/container";
import { createActivityService } from "@/lib/services/activity.service";
import { listActivitiesQuerySchema } from "@/lib/services/activities.schemas";

const service = createActivityService(container);

export const GET = apiHandler(
  async (req, { query }) => {
    return service.list(query);
  },
  {
    querySchema: listActivitiesQuerySchema,
  }
);

