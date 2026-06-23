import { apiHandler } from "@/lib/api-handler";
import { container } from "@/lib/container";
import { createAccountsService } from "@/lib/services/accounts.service";

const service = createAccountsService(container);

export const DELETE = apiHandler(
  async (req, { params }) => {
    return service.deleteTransaction(params.id);
  },
  {
    roles: ["admin", "account"],
  }
);
