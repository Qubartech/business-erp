import { apiHandler } from "@/lib/api-handler";
import { container } from "@/lib/container";
import { createAccountsService } from "@/lib/services/accounts.service";
import { updateAccountSchema } from "@/lib/services/accounts.schemas";

const service = createAccountsService(container);

export const GET = apiHandler(
  async (req, { params }) => {
    return service.getAccount(params.id);
  },
  {
    roles: ["admin", "account"],
  }
);

export const PATCH = apiHandler(
  async (req, { params, body }) => {
    return service.updateAccount(params.id, body);
  },
  {
    roles: ["admin", "account"],
    schema: updateAccountSchema,
  }
);

export const DELETE = apiHandler(
  async (req, { params }) => {
    return service.deleteAccount(params.id);
  },
  {
    roles: ["admin", "account"],
  }
);
