import { apiHandler } from "@/lib/api-handler";
import { container } from "@/lib/container";
import { createProjectsService } from "@/lib/services/projects.service";

const service = createProjectsService(container);

export const DELETE = apiHandler(
  async (req, { params }) => {
    return service.removeMember(params.id, params.userId);
  },
  {
    roles: ["admin", "manager"],
  }
);
