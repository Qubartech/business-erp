import { apiHandler } from "@/lib/api-handler";
import { container } from "@/lib/container";
import { createAccountsService } from "@/lib/services/accounts.service";
import { createTransactionSchema, listTransactionsQuerySchema } from "@/lib/services/accounts.schemas";

const service = createAccountsService(container);

export const GET = apiHandler(
  async (req, { query }) => {
    return service.listTransactions(query as any);
  },
  {
    roles: ["admin", "account"],
    querySchema: listTransactionsQuerySchema,
  }
);

export const POST = apiHandler(
  async (req, { user, body }) => {
    return service.createTransaction(body, user.sub);
  },
  {
    roles: ["admin", "account"],
    schema: createTransactionSchema,
    status: 201,
  }
);
