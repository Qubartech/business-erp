import { apiHandler } from "@/lib/api-handler";
import { container } from "@/lib/container";
import { createAuthService } from "@/lib/services/auth.service";

const service = createAuthService(container);

export const GET = apiHandler(async (req, { user }) => {
  return service.getApiKey(user.sub);
});

export const POST = apiHandler(async (req, { user }) => {
  return service.generateApiKey(user.sub);
});

export const DELETE = apiHandler(async (req, { user }) => {
  await service.deleteApiKey(user.sub);
  return null;
});
