import { apiHandler } from "@/lib/api-handler";
import { container } from "@/lib/container";
import { createUsersService } from "@/lib/services/users.service";
import { z } from "zod";

const service = createUsersService(container);

const setActiveSchema = z.object({ isActive: z.boolean() });

export const POST = apiHandler(
  async (req, { params, body }) => {
    return service.setActive(params.id, body.isActive);
  },
  {
    roles: ["admin"],
    schema: setActiveSchema,
  }
);
