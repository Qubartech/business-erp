import { apiHandler } from "@/lib/api-handler";
import { container } from "@/lib/container";
import { createLeavesService } from "@/lib/services/leaves.service";
import { updateLeaveSchema } from "@/lib/services/leaves.schemas";

const service = createLeavesService(container);

export const PATCH = apiHandler(
  async (req, { user, params, body }) => {
    return service.update(user.sub, user.role, params.id, body);
  },
  {
    schema: updateLeaveSchema,
  }
);

export const DELETE = apiHandler(async (req, { user, params }) => {
  return service.remove(user.sub, user.role, params.id);
});
