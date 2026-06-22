import { apiHandler } from "@/lib/api-handler";
import { container } from "@/lib/container";
import { createProjectsService } from "@/lib/services/projects.service";
import { membersSchema } from "@/lib/services/projects.schemas";

const service = createProjectsService(container);

export const POST = apiHandler(
  async (req, { params, body }) => {
    return service.addMembers(params.id, body.userIds);
  },
  {
    roles: ["admin", "manager"],
    schema: membersSchema,
  }
);
