import { apiHandler } from "@/lib/api-handler";
import { container } from "@/lib/container";
import { createAuthService } from "@/lib/services/auth.service";
import { loginSchema } from "@/lib/services/auth.schemas";

const service = createAuthService(container);

export const POST = apiHandler(
  async (req, { body }) => {
    return service.login(body);
  },
  {
    requireAuth: false,
    schema: loginSchema,
  }
);
