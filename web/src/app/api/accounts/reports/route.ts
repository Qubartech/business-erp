import { apiHandler } from "@/lib/api-handler";
import { container } from "@/lib/container";
import { createAccountsService } from "@/lib/services/accounts.service";

const service = createAccountsService(container);

export const GET = apiHandler(
  async () => {
    return service.getFinancialReport();
  },
  {
    roles: ["admin", "account"],
  }
);
