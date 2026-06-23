import { Conflict, NotFound } from "../errors";
import type { Container } from "../container";
import type { z } from "zod";
import type {
  createAccountSchema,
  updateAccountSchema,
  createTransactionSchema,
  listTransactionsQuerySchema,
} from "./accounts.schemas";

type CreateAccountInput = z.infer<typeof createAccountSchema>;
type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;

export function createAccountsService({ prisma }: Pick<Container, "prisma">) {
  return {
    // ACCOUNT SERVICES
    async listAccounts() {
      return prisma.account.findMany({
        orderBy: { code: "asc" },
      });
    },

    async getAccount(id: string) {
      const account = await prisma.account.findUnique({
        where: { id },
      });
      if (!account) throw NotFound("Account not found");
      return account;
    },

    async createAccount(input: CreateAccountInput, userId: string) {
      const existing = await prisma.account.findUnique({
        where: { code: input.code },
      });
      if (existing) throw Conflict("Account code already in use");

      return prisma.$transaction(async (tx) => {
        const account = await tx.account.create({
          data: {
            name: input.name,
            code: input.code,
            type: input.type,
            description: input.description,
            balance: input.initialBalance,
          },
        });

        // Record a transaction for the initial balance if it is non-zero
        if (input.initialBalance !== 0) {
          await tx.transaction.create({
            data: {
              accountId: account.id,
              type: input.initialBalance > 0 ? "deposit" : "withdrawal",
              amount: Math.abs(input.initialBalance),
              date: new Date(),
              description: "Opening Balance",
              createdById: userId,
            },
          });
        }

        return account;
      });
    },

    async updateAccount(id: string, input: UpdateAccountInput) {
      const exists = await prisma.account.findUnique({ where: { id } });
      if (!exists) throw NotFound("Account not found");

      return prisma.account.update({
        where: { id },
        data: {
          name: input.name,
          description: input.description,
        },
      });
    },

    async deleteAccount(id: string) {
      const exists = await prisma.account.findUnique({ where: { id } });
      if (!exists) throw NotFound("Account not found");

      // Running balance will cascade delete transactions because of DB setup,
      // but let's just delete the account directly.
      return prisma.account.delete({
        where: { id },
      });
    },

    // TRANSACTION SERVICES
    async listTransactions(q: ListTransactionsQuery) {
      const where: any = {};

      if (q.accountId) {
        where.OR = [
          { accountId: q.accountId },
          { toAccountId: q.accountId },
        ];
      }

      if (q.type) {
        where.type = q.type;
      }

      if (q.projectId) {
        where.projectId = q.projectId;
      }

      if (q.spentById) {
        where.spentById = q.spentById;
      }

      if (q.search) {
        where.OR = [
          ...(where.OR || []),
          { description: { contains: q.search, mode: "insensitive" } },
          { reference: { contains: q.search, mode: "insensitive" } },
          { category: { contains: q.search, mode: "insensitive" } },
          { account: { name: { contains: q.search, mode: "insensitive" } } },
          { toAccount: { name: { contains: q.search, mode: "insensitive" } } },
        ];
      }

      const [items, total] = await Promise.all([
        prisma.transaction.findMany({
          where,
          include: {
            account: {
              select: { id: true, name: true, code: true, type: true },
            },
            toAccount: {
              select: { id: true, name: true, code: true, type: true },
            },
            createdBy: {
              select: { id: true, name: true, email: true },
            },
            spentBy: {
              select: { id: true, name: true, email: true },
            },
            project: {
              select: { id: true, name: true },
            },
          },
          orderBy: { date: "desc" },
          skip: (q.page - 1) * q.pageSize,
          take: q.pageSize,
        }),
        prisma.transaction.count({ where }),
      ]);

      return { items, total, page: q.page, pageSize: q.pageSize };
    },

    async createTransaction(input: CreateTransactionInput, userId: string) {
      const account = await prisma.account.findUnique({ where: { id: input.accountId } });
      if (!account) throw NotFound("Primary account not found");

      if (input.type === "transfer") {
        if (!input.toAccountId) {
          throw Conflict("Destination account is required for transfers");
        }
        if (input.accountId === input.toAccountId) {
          throw Conflict("Source and destination accounts must be different");
        }
        const toAccount = await prisma.account.findUnique({ where: { id: input.toAccountId } });
        if (!toAccount) throw NotFound("Destination account not found");
      }

      return prisma.$transaction(async (tx) => {
        // Create the transaction
        const transaction = await tx.transaction.create({
          data: {
            accountId: input.accountId,
            toAccountId: input.toAccountId || null,
            type: input.type,
            amount: input.amount,
            date: input.date,
            description: input.description,
            reference: input.reference,
            category: input.category || null,
            spentById: input.spentById || null,
            projectId: input.projectId || null,
            createdById: userId,
          },
          include: {
            account: true,
            toAccount: true,
          },
        });

        // Update running balances
        if (input.type === "deposit") {
          await tx.account.update({
            where: { id: input.accountId },
            data: { balance: { increment: input.amount } },
          });
        } else if (input.type === "withdrawal") {
          await tx.account.update({
            where: { id: input.accountId },
            data: { balance: { decrement: input.amount } },
          });
        } else if (input.type === "transfer") {
          // Withdraw from source
          await tx.account.update({
            where: { id: input.accountId },
            data: { balance: { decrement: input.amount } },
          });
          // Deposit to destination
          await tx.account.update({
            where: { id: input.toAccountId! },
            data: { balance: { increment: input.amount } },
          });
        }

        return transaction;
      });
    },

    async updateTransaction(id: string, input: CreateTransactionInput, userId: string) {
      const existingTx = await prisma.transaction.findUnique({ where: { id } });
      if (!existingTx) throw NotFound("Transaction not found");

      const account = await prisma.account.findUnique({ where: { id: input.accountId } });
      if (!account) throw NotFound("Primary account not found");

      if (input.type === "transfer") {
        if (!input.toAccountId) {
          throw Conflict("Destination account is required for transfers");
        }
        if (input.accountId === input.toAccountId) {
          throw Conflict("Source and destination accounts must be different");
        }
        const toAccount = await prisma.account.findUnique({ where: { id: input.toAccountId } });
        if (!toAccount) throw NotFound("Destination account not found");
      }

      return prisma.$transaction(async (tx) => {
        // 1. REVERSE old balance updates
        if (existingTx.type === "deposit") {
          await tx.account.update({
            where: { id: existingTx.accountId },
            data: { balance: { decrement: existingTx.amount } },
          });
        } else if (existingTx.type === "withdrawal") {
          await tx.account.update({
            where: { id: existingTx.accountId },
            data: { balance: { increment: existingTx.amount } },
          });
        } else if (existingTx.type === "transfer") {
          await tx.account.update({
            where: { id: existingTx.accountId },
            data: { balance: { increment: existingTx.amount } },
          });
          if (existingTx.toAccountId) {
            await tx.account.update({
              where: { id: existingTx.toAccountId },
              data: { balance: { decrement: existingTx.amount } },
            });
          }
        }

        // 2. UPDATE the transaction
        const updatedTx = await tx.transaction.update({
          where: { id },
          data: {
            accountId: input.accountId,
            toAccountId: input.toAccountId || null,
            type: input.type,
            amount: input.amount,
            date: input.date,
            description: input.description,
            reference: input.reference,
            category: input.category || null,
            spentById: input.spentById || null,
            projectId: input.projectId || null,
          },
          include: {
            account: true,
            toAccount: true,
          },
        });

        // 3. APPLY new balance updates
        if (input.type === "deposit") {
          await tx.account.update({
            where: { id: input.accountId },
            data: { balance: { increment: input.amount } },
          });
        } else if (input.type === "withdrawal") {
          await tx.account.update({
            where: { id: input.accountId },
            data: { balance: { decrement: input.amount } },
          });
        } else if (input.type === "transfer") {
          // Withdraw from source
          await tx.account.update({
            where: { id: input.accountId },
            data: { balance: { decrement: input.amount } },
          });
          // Deposit to destination
          await tx.account.update({
            where: { id: input.toAccountId! },
            data: { balance: { increment: input.amount } },
          });
        }

        return updatedTx;
      });
    },

    async deleteTransaction(id: string) {
      const transaction = await prisma.transaction.findUnique({
        where: { id },
      });
      if (!transaction) throw NotFound("Transaction not found");

      return prisma.$transaction(async (tx) => {
        // Reverse balance updates
        if (transaction.type === "deposit") {
          await tx.account.update({
            where: { id: transaction.accountId },
            data: { balance: { decrement: transaction.amount } },
          });
        } else if (transaction.type === "withdrawal") {
          await tx.account.update({
            where: { id: transaction.accountId },
            data: { balance: { increment: transaction.amount } },
          });
        } else if (transaction.type === "transfer") {
          // Re-deposit to source
          await tx.account.update({
            where: { id: transaction.accountId },
            data: { balance: { increment: transaction.amount } },
          });
          // Re-withdraw from destination
          if (transaction.toAccountId) {
            await tx.account.update({
              where: { id: transaction.toAccountId },
              data: { balance: { decrement: transaction.amount } },
            });
          }
        }

        // Delete the transaction
        return tx.transaction.delete({
          where: { id },
        });
      });
    },

    // REPORT SERVICES
    async getFinancialReport() {
      const accounts = await prisma.account.findMany({
        orderBy: { code: "asc" },
      });

      const assets = accounts.filter((a: any) => a.type === "asset");
      const liabilities = accounts.filter((a: any) => a.type === "liability");
      const equity = accounts.filter((a: any) => a.type === "equity");

      const totalAssets = assets.reduce((sum: number, a: any) => sum + a.balance, 0);
      const totalLiabilities = liabilities.reduce((sum: number, a: any) => sum + a.balance, 0);
      const totalEquity = equity.reduce((sum: number, a: any) => sum + a.balance, 0);

      // Fetch all transactions to calculate dynamic revenues/expenses
      const allTransactions = await prisma.transaction.findMany({
        select: { type: true, amount: true, category: true, projectId: true },
      });

      // Group deposits as revenue
      const depositTxs = allTransactions.filter((t: any) => t.type === "deposit");
      const revenueGroups: { [key: string]: number } = {};
      depositTxs.forEach((t: any) => {
        const cat = t.category || "General Revenue";
        revenueGroups[cat] = (revenueGroups[cat] || 0) + t.amount;
      });

      const revenueItems = Object.keys(revenueGroups).map((name, index) => ({
        id: `rev-${index}`,
        code: `REV-${String(index + 1).padStart(3, "0")}`,
        name,
        balance: revenueGroups[name],
      }));

      // Group withdrawals as expense
      const withdrawalTxs = allTransactions.filter((t: any) => t.type === "withdrawal");
      const expenseGroups: { [key: string]: number } = {};
      withdrawalTxs.forEach((t: any) => {
        const cat = t.category || "General Expense";
        expenseGroups[cat] = (expenseGroups[cat] || 0) + t.amount;
      });

      const expenseItems = Object.keys(expenseGroups).map((name, index) => ({
        id: `exp-${index}`,
        code: `EXP-${String(index + 1).padStart(3, "0")}`,
        name,
        balance: expenseGroups[name],
      }));

      // Merge any explicit revenue/expense accounts with our transaction-based ones
      const explicitRevenues = accounts.filter((a: any) => a.type === "revenue");
      const explicitExpenses = accounts.filter((a: any) => a.type === "expense");

      const finalRevenueItems = [
        ...explicitRevenues.map((a: any) => ({ id: a.id, code: a.code, name: a.name, balance: a.balance })),
        ...revenueItems,
      ];

      const finalExpenseItems = [
        ...explicitExpenses.map((a: any) => ({ id: a.id, code: a.code, name: a.name, balance: a.balance })),
        ...expenseItems,
      ];

      const totalRevenue = finalRevenueItems.reduce((sum, item) => sum + item.balance, 0);
      const totalExpense = finalExpenseItems.reduce((sum, item) => sum + item.balance, 0);
      const netIncome = totalRevenue - totalExpense;

      // Project revenue calculation (including general non-project operations)
      const projects = await prisma.project.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      });

      const projectBalances: any[] = projects.map((p: any) => {
        const txs = allTransactions.filter((t: any) => t.projectId === p.id);
        const inflow = txs.filter((t: any) => t.type === "deposit").reduce((sum: number, t: any) => sum + t.amount, 0);
        const outflow = txs.filter((t: any) => t.type === "withdrawal").reduce((sum: number, t: any) => sum + t.amount, 0);
        return {
          id: p.id,
          name: p.name,
          inflow,
          outflow,
          net: inflow - outflow,
        };
      }).filter((p: any) => p.inflow > 0 || p.outflow > 0);

      // Add general operations (transactions with no linked project)
      const nonProjectTxs = allTransactions.filter((t: any) => !t.projectId);
      const generalInflow = nonProjectTxs.filter((t: any) => t.type === "deposit").reduce((sum: number, t: any) => sum + t.amount, 0);
      const generalOutflow = nonProjectTxs.filter((t: any) => t.type === "withdrawal").reduce((sum: number, t: any) => sum + t.amount, 0);

      if (generalInflow > 0 || generalOutflow > 0) {
        projectBalances.push({
          id: "general",
          name: "General Operations (No Project)",
          inflow: generalInflow,
          outflow: generalOutflow,
          net: generalInflow - generalOutflow,
        });
      }

      return {
        balanceSheet: {
          assets: { items: assets, total: totalAssets },
          liabilities: { items: liabilities, total: totalLiabilities },
          equity: { items: equity, total: totalEquity },
        },
        incomeStatement: {
          revenue: { items: finalRevenueItems, total: totalRevenue },
          expense: { items: finalExpenseItems, total: totalExpense },
          netIncome,
        },
        projectRevenue: projectBalances,
      };
    },
  };
}
