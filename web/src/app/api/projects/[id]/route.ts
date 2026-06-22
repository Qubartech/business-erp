import { apiHandler } from "@/lib/api-handler";
import { container } from "@/lib/container";
import { createProjectsService } from "@/lib/services/projects.service";
import { updateProjectSchema } from "@/lib/services/projects.schemas";

const service = createProjectsService(container);

export const GET = apiHandler(async (req, { params }) => {
  return service.get(params.id);
});

export const PATCH = apiHandler(
  async (req, { params, body }) => {
    return service.update(params.id, body);
  },
  {
    roles: ["admin", "manager"],
    schema: updateProjectSchema,
  }
);
