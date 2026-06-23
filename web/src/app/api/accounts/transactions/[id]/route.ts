import { apiHandler } from "@/lib/api-handler";
import { container } from "@/lib/container";
import { createAccountsService } from "@/lib/services/accounts.service";
import { createTransactionSchema } from "@/lib/services/accounts.schemas";

const service = createAccountsService(container);

export const DELETE = apiHandler(
  async (req, { params }) => {
    return service.deleteTransaction(params.id);
  },
  {
    roles: ["admin", "account"],
  }
);

export const PUT = apiHandler(
  async (req, { params, user, body }) => {
    return service.updateTransaction(params.id, body, user.sub);
  },
  {
    roles: ["admin", "account"],
    schema: createTransactionSchema,
  }
);
