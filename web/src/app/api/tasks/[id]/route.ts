import { apiHandler } from "@/lib/api-handler";
import { container } from "@/lib/container";
import { createTasksService } from "@/lib/services/tasks.service";
import { updateTaskSchema } from "@/lib/services/tasks.schemas";

const service = createTasksService(container);

export const GET = apiHandler(async (req, { params }) => {
  return service.get(params.id);
});

export const PATCH = apiHandler(
  async (req, { params, body, user }) => {
    return service.update(params.id, body, user.sub);
  },
  {
    schema: updateTaskSchema,
  }
);

export const DELETE = apiHandler(
  async (req, { params, user }) => {
    return service.remove(params.id, user.sub);
  },
  {
    roles: ["admin", "manager"],
  }
);
