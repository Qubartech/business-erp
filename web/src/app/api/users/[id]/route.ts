import { apiHandler } from "@/lib/api-handler";
import { container } from "@/lib/container";
import { createUsersService } from "@/lib/services/users.service";
import { updateUserSchema } from "@/lib/services/users.schemas";

const service = createUsersService(container);

export const GET = apiHandler(async (req, { params }) => {
  return service.get(params.id);
});

export const PATCH = apiHandler(
  async (req, { params, body }) => {
    return service.update(params.id, body);
  },
  {
    roles: ["admin"],
    schema: updateUserSchema,
  }
);
