import { apiHandler } from "@/lib/api-handler";
import { container } from "@/lib/container";
import { createLeavesService } from "@/lib/services/leaves.service";
import { createLeaveSchema } from "@/lib/services/leaves.schemas";

const service = createLeavesService(container);

export const GET = apiHandler(async (req, { user }) => {
  const { searchParams } = new URL(req.url);
  const query = Object.fromEntries(searchParams.entries());
  return service.list(user.sub, user.role, query);
});

export const POST = apiHandler(
  async (req, { user, body }) => {
    return service.create(user.sub, body);
  },
  {
    schema: createLeaveSchema,
    status: 201,
  }
);
