import { apiHandler } from "@/lib/api-handler";
import { container } from "@/lib/container";
import { createAuthService } from "@/lib/services/auth.service";
import { updateProfileSchema } from "@/lib/services/auth.schemas";

const service = createAuthService(container);

export const GET = apiHandler(async (req, { user }) => {
  return service.me(user.sub);
});

export const PATCH = apiHandler(
  async (req, { user, body }) => {
    return service.updateProfile(user.sub, body);
  },
  {
    schema: updateProfileSchema,
  }
);
