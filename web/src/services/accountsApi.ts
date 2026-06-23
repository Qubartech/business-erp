import { api, unwrap, type ApiEnvelope } from "@/lib/api";
import type { Paged, Account, Transaction, AccountType, TransactionType } from "@/types";

export type AccountInput = {
  name: string;
  code: string;
  type: AccountType;
  description?: string | null;
  initialBalance: number;
};

export type TransactionInput = {
  accountId: string;
  toAccountId?: string | null;
  type: TransactionType;
  amount: number;
  date: string;
  description?: string | null;
  reference?: string | null;
  category?: string | null;
  spentById?: string | null;
  projectId?: string | null;
};

export type ProjectRevenueReport = {
  id: string;
  name: string;
  inflow: number;
  outflow: number;
  net: number;
};

export type ReportData = {
  balanceSheet: {
    assets: { items: Account[]; total: number };
    liabilities: { items: Account[]; total: number };
    equity: { items: Account[]; total: number };
  };
  incomeStatement: {
    revenue: { items: Account[]; total: number };
    expense: { items: Account[]; total: number };
    netIncome: number;
  };
  projectRevenue: ProjectRevenueReport[];
};

export const accountsApi = {
  // Accounts
  listAccounts: () => unwrap<Account[]>(api.get<ApiEnvelope<Account[]>>("/accounts")),
  getAccount: (id: string) => unwrap<Account>(api.get<ApiEnvelope<Account>>(`/accounts/${id}`)),
  createAccount: (data: AccountInput) => unwrap<Account>(api.post<ApiEnvelope<Account>>("/accounts", data)),
  updateAccount: (id: string, data: Partial<AccountInput>) =>
    unwrap<Account>(api.patch<ApiEnvelope<Account>>(`/accounts/${id}`, data)),
  deleteAccount: (id: string) => unwrap<Account>(api.delete<ApiEnvelope<Account>>(`/accounts/${id}`)),

  // Transactions
  listTransactions: (q: { accountId?: string; type?: string; search?: string; projectId?: string; spentById?: string; page?: number; pageSize?: number }) =>
    unwrap<Paged<Transaction>>(api.get<ApiEnvelope<Paged<Transaction>>>("/accounts/transactions", { params: q })),
  createTransaction: (data: TransactionInput) =>
    unwrap<Transaction>(api.post<ApiEnvelope<Transaction>>("/accounts/transactions", data)),
  deleteTransaction: (id: string) =>
    unwrap<Transaction>(api.delete<ApiEnvelope<Transaction>>(`/accounts/transactions/${id}`)),

  // Reports
  getReports: () => unwrap<ReportData>(api.get<ApiEnvelope<ReportData>>("/accounts/reports")),
};
