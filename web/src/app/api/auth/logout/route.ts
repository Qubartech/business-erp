import { apiHandler } from "@/lib/api-handler";
import { container } from "@/lib/container";
import { createAuthService } from "@/lib/services/auth.service";
import { refreshSchema } from "@/lib/services/auth.schemas";

const service = createAuthService(container);

export const POST = apiHandler(
  async (req, { body }) => {
    await service.logout(body.refreshToken);
    return null;
  },
  {
    requireAuth: false,
    schema: refreshSchema,
  }
);
