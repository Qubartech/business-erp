import { apiHandler } from "@/lib/api-handler";
import { container } from "@/lib/container";
import { createProjectsService } from "@/lib/services/projects.service";
import { createProjectSchema, listProjectsQuerySchema } from "@/lib/services/projects.schemas";

const service = createProjectsService(container);

export const GET = apiHandler(
  async (req, { query }) => {
    return service.list(query);
  },
  {
    querySchema: listProjectsQuerySchema,
  }
);

export const POST = apiHandler(
  async (req, { user, body }) => {
    return service.create(body, user.sub);
  },
  {
    roles: ["admin", "manager"],
    schema: createProjectSchema,
    status: 201,
  }
);
