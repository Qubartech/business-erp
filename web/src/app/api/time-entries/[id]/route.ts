import { apiHandler } from "@/lib/api-handler";
import { container } from "@/lib/container";
import { createTimeEntriesService } from "@/lib/services/time-entries.service";
import { updateEntrySchema } from "@/lib/services/time-entries.schemas";

const service = createTimeEntriesService(container);

export const PATCH = apiHandler(
  async (req, { user, params, body }) => {
    return service.update(user.sub, user.role, params.id, body);
  },
  {
    schema: updateEntrySchema,
  }
);

export const DELETE = apiHandler(async (req, { user, params }) => {
  return service.remove(user.sub, user.role, params.id);
});
