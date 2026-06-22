import { apiHandler } from "@/lib/api-handler";
import { container } from "@/lib/container";
import { createUsersService } from "@/lib/services/users.service";
import { createUserSchema, listUsersQuerySchema } from "@/lib/services/users.schemas";

const service = createUsersService(container);

export const GET = apiHandler(
  async (req, { query }) => {
    return service.list(query as any);
  },
  {
    querySchema: listUsersQuerySchema,
  }
);

export const POST = apiHandler(
  async (req, { body }) => {
    return service.create(body as any);
  },
  {
    roles: ["admin"],
    schema: createUserSchema,
    status: 201,
  }
);
