import { apiHandler } from "@/lib/api-handler";
import { container } from "@/lib/container";
import { createProjectsService } from "@/lib/services/projects.service";

const service = createProjectsService(container);

export const POST = apiHandler(
  async (req, { params }) => {
    return service.archive(params.id);
  },
  {
    roles: ["admin", "manager"],
  }
);
