import { apiHandler } from "@/lib/api-handler";
import { container } from "@/lib/container";
import { createTasksService } from "@/lib/services/tasks.service";
import { updateTaskSchema } from "@/lib/services/tasks.schemas";

const service = createTasksService(container);

export const GET = apiHandler(async (req, { params }) => {
  return service.get(params.id);
});

export const PATCH = apiHandler(
  async (req, { params, body }) => {
    return service.update(params.id, body);
  },
  {
    schema: updateTaskSchema,
  }
);

export const DELETE = apiHandler(
  async (req, { params }) => {
    return service.remove(params.id);
  },
  {
    roles: ["admin", "manager"],
  }
);
