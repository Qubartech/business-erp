import { z } from "zod";

export const accountTypeEnum = z.enum(["asset", "liability", "equity", "revenue", "expense"]);
export const transactionTypeEnum = z.enum(["deposit", "withdrawal", "transfer"]);

export const createAccountSchema = z.object({
  name: z.string().min(1).max(120),
  code: z.string().min(1).max(30),
  type: accountTypeEnum,
  description: z.string().max(500).optional().nullable(),
  initialBalance: z.coerce.number().default(0),
});

export const updateAccountSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional().nullable(),
});

export const createTransactionSchema = z.object({
  accountId: z.string().uuid(),
  toAccountId: z.string().uuid().optional().nullable(),
  type: transactionTypeEnum,
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  date: z.string().transform(val => new Date(val)),
  description: z.string().max(500).optional().nullable(),
  reference: z.string().max(100).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  spentById: z.string().uuid().optional().nullable(),
  projectId: z.string().uuid().optional().nullable(),
});

export const listTransactionsQuerySchema = z.object({
  accountId: z.string().uuid().optional(),
  type: transactionTypeEnum.optional(),
  search: z.string().optional(),
  projectId: z.string().uuid().optional().nullable(),
  spentById: z.string().uuid().optional().nullable(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
