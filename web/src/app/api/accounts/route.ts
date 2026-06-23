import { apiHandler } from "@/lib/api-handler";
import { container } from "@/lib/container";
import { createAccountsService } from "@/lib/services/accounts.service";
import { createAccountSchema } from "@/lib/services/accounts.schemas";

const service = createAccountsService(container);

export const GET = apiHandler(
  async () => {
    return service.listAccounts();
  },
  {
    roles: ["admin", "account"],
  }
);

export const POST = apiHandler(
  async (req, { user, body }) => {
    return service.createAccount(body, user.sub);
  },
  {
    roles: ["admin", "account"],
    schema: createAccountSchema,
    status: 201,
  }
);
