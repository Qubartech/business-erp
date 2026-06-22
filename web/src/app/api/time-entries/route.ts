import { apiHandler } from "@/lib/api-handler";
import { container } from "@/lib/container";
import { createTimeEntriesService } from "@/lib/services/time-entries.service";
import { listEntriesQuerySchema } from "@/lib/services/time-entries.schemas";

const service = createTimeEntriesService(container);

export const GET = apiHandler(
  async (req, { user, query }) => {
    return service.list(user.sub, user.role, query as any);
  },
  {
    querySchema: listEntriesQuerySchema,
  }
);
