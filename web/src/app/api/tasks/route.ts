import { apiHandler } from "@/lib/api-handler";
import { container } from "@/lib/container";
import { createTasksService } from "@/lib/services/tasks.service";
import { createTaskSchema, listTasksQuerySchema } from "@/lib/services/tasks.schemas";

const service = createTasksService(container);

export const GET = apiHandler(
  async (req, { query }) => {
    return service.list(query);
  },
  {
    querySchema: listTasksQuerySchema,
  }
);

export const POST = apiHandler(
  async (req, { user, body }) => {
    return service.create(body, user.sub);
  },
  {
    roles: ["admin", "manager"],
    schema: createTaskSchema,
    status: 201,
  }
);
