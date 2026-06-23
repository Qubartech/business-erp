"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { accountsApi, type AccountInput } from "@/services/accountsApi";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Modal } from "@/components/Modal";
import { TextField, SelectField } from "@/components/fields";
import { toast } from "@/lib/toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus, Pencil, Trash2, Landmark, DollarSign, PiggyBank,
  TrendingDown, TrendingUp, Calculator, ArrowRight
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Account, AccountType } from "@/types";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  code: z.string().min(1, "Code is required").max(30),
  type: z.enum(["asset", "liability", "equity", "revenue", "expense"]),
  description: z.string().max(500).optional().nullable(),
  initialBalance: z.coerce.number().default(0),
});

type FormValues = z.infer<typeof schema>;

export default function AccountsDashboard() {
  const qc = useQueryClient();
  const pathname = usePathname();
  const [openNew, setOpenNew] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);

  const { data: accounts, isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: accountsApi.listAccounts,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", code: "", type: "asset", description: "", initialBalance: 0 },
  });

  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit, formState: { errors: errorsEdit } } = useForm<{ name: string; description: string }>({
    defaultValues: { name: "", description: "" },
  });

  const createMutation = useMutation({
    mutationFn: accountsApi.createAccount,
    onSuccess: () => {
      toast.success("Account created successfully");
      qc.invalidateQueries({ queryKey: ["accounts"] });
      setOpenNew(false);
      reset();
    },
    onError: (e: any) => toast.error(e.message || "Failed to create account"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AccountInput> }) => accountsApi.updateAccount(id, data),
    onSuccess: () => {
      toast.success("Account updated successfully");
      qc.invalidateQueries({ queryKey: ["accounts"] });
      setEditingAccount(null);
    },
    onError: (e: any) => toast.error(e.message || "Failed to update account"),
  });

  const deleteMutation = useMutation({
    mutationFn: accountsApi.deleteAccount,
    onSuccess: () => {
      toast.success("Account deleted successfully");
      qc.invalidateQueries({ queryKey: ["accounts"] });
      setDeletingAccount(null);
    },
    onError: (e: any) => toast.error(e.message || "Failed to delete account"),
  });

  const formatCurrency = (val: number) => {
    const formatted = Math.abs(val).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return val < 0 ? `-৳${formatted}` : `৳${formatted}`;
  };

  const getAccountTypeColor = (type: AccountType) => {
    switch (type) {
      case "asset": return "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-450";
      case "liability": return "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/30 dark:text-amber-450";
      case "equity": return "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950/30 dark:text-blue-450";
      case "revenue": return "bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-950/30 dark:text-indigo-450";
      case "expense": return "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-950/30 dark:text-rose-450";
      default: return "bg-slate-50 text-slate-700 ring-slate-600/20";
    }
  };

  const tabs = [
    { name: "Accounts List", href: "/accounts", current: pathname === "/accounts" },
    { name: "Transactions Log", href: "/accounts/transactions", current: pathname === "/accounts/transactions" },
    { name: "Financial Reports", href: "/accounts/reports", current: pathname === "/accounts/reports" },
  ];

  // Calculate quick stats
  const totalAssets = accounts?.filter(a => a.type === "asset").reduce((sum, a) => sum + a.balance, 0) || 0;
  const totalLiabilities = accounts?.filter(a => a.type === "liability").reduce((sum, a) => sum + a.balance, 0) || 0;
  const totalEquity = accounts?.filter(a => a.type === "equity").reduce((sum, a) => sum + a.balance, 0) || 0;
  const netPosition = totalAssets - totalLiabilities;

  const cols: Column<Account>[] = [
    {
      key: "code",
      header: "Code",
      render: (a) => <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">{a.code}</span>
    },
    {
      key: "name",
      header: "Account Name",
      render: (a) => (
        <div>
          <div className="font-bold text-slate-800 dark:text-slate-100">{a.name}</div>
          {a.description && <div className="text-xs text-slate-400 dark:text-zinc-500 line-clamp-1">{a.description}</div>}
        </div>
      )
    },
    {
      key: "type",
      header: "Type",
      render: (a) => (
        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-bold uppercase tracking-wide ring-1 ring-inset ${getAccountTypeColor(a.type)}`}>
          {a.type}
        </span>
      )
    },
    {
      key: "balance",
      header: "Balance",
      render: (a) => {
        const isNegative = a.balance < 0;
        return (
          <span className={`font-mono font-extrabold ${isNegative ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-slate-100"}`}>
            {formatCurrency(a.balance)}
          </span>
        );
      }
    },
    {
      key: "actions",
      header: "",
      render: (a) => (
        <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => {
              setEditingAccount(a);
              resetEdit({ name: a.name, description: a.description || "" });
            }}
            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/20 rounded-lg transition-colors"
            title="Edit account details"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDeletingAccount(a)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors"
            title="Delete account"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
      className: "text-right"
    }
  ];

  return (
    <>
      <PageHeader
        title="Office Accounts"
        description="Manage cash, bank, equity, revenue, and expense accounts"
        actions={
          <button
            onClick={() => setOpenNew(true)}
            className="btn-primary flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> New Account
          </button>
        }
      />

      {/* Sub tabs */}
      <div className="border-b border-slate-200 dark:border-white/[0.08] mb-6">
        <nav className="flex space-x-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              href={tab.href}
              className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-all ${
                tab.current
                  ? "border-brand-600 text-brand-600 dark:border-brand-500 dark:text-brand-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {tab.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-5 flex items-center gap-4 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/[0.04]">
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 rounded-2xl shadow-sm shadow-emerald-500/5">
            <Landmark className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Total Assets</div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5">{formatCurrency(totalAssets)}</div>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/[0.04]">
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-450 rounded-2xl shadow-sm shadow-amber-500/5">
            <TrendingDown className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Total Liabilities</div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5">{formatCurrency(totalLiabilities)}</div>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/[0.04]">
          <div className="p-3.5 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-450 rounded-2xl shadow-sm shadow-blue-500/5">
            <PiggyBank className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Total Equity</div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5">{formatCurrency(totalEquity)}</div>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/[0.04] bg-gradient-to-br from-brand-50/10 to-indigo-50/10 dark:from-brand-950/10 dark:to-indigo-950/10">
          <div className="p-3.5 bg-brand-500 text-white rounded-2xl shadow-md shadow-brand-500/20">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">Net Position</div>
            <div className="text-xl font-black text-brand-700 dark:text-brand-300 font-mono mt-0.5">{formatCurrency(netPosition)}</div>
          </div>
        </div>
      </div>

      {/* Main List */}
      <div className="card p-0 overflow-hidden">
        <DataTable
          rows={accounts}
          loading={isLoading}
          columns={cols}
          rowKey={(a) => a.id}
          empty="No accounts found. Click 'New Account' to get started."
        />
      </div>

      {/* New Account Modal */}
      <Modal
        open={openNew}
        onClose={() => setOpenNew(false)}
        title={
          <div className="flex items-center gap-2 font-bold text-lg">
            <Landmark className="h-5 w-5 text-brand-600" />
            <span>Create New Office Account</span>
          </div>
        }
      >
        <form
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          onSubmit={handleSubmit(async (val) => {
            try {
              await createMutation.mutateAsync(val);
            } catch {}
          })}
        >
          <TextField
            label="Account Code"
            placeholder="e.g. 1010, EXP-300, etc."
            {...register("code")}
            error={errors.code?.message}
          />
          <TextField
            label="Account Name"
            placeholder="e.g. Main Petty Cash"
            {...register("name")}
            error={errors.name?.message}
          />
          <SelectField
            label="Account Type"
            options={[
              { value: "asset", label: "Asset (Cash, Bank, Receivables)" },
              { value: "liability", label: "Liability (Loans, Payables)" },
              { value: "equity", label: "Equity (Capital, Retained Earnings)" },
              { value: "revenue", label: "Revenue (Sales, Service Income)" },
              { value: "expense", label: "Expense (Rent, Salaries, Utilities)" },
            ]}
            {...register("type")}
            error={errors.type?.message}
          />
          <TextField
            label="Initial Balance (৳)"
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register("initialBalance")}
            error={errors.initialBalance?.message}
          />
          <div className="sm:col-span-2">
            <TextField
              label="Description (Optional)"
              placeholder="e.g. Daily office operational expense cache"
              {...register("description")}
              error={errors.description?.message}
            />
          </div>

          <div className="sm:col-span-2 flex justify-end gap-2 mt-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setOpenNew(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="btn-primary cursor-pointer"
            >
              {createMutation.isPending ? "Creating..." : "Create Account"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Account Modal */}
      <Modal
        open={!!editingAccount}
        onClose={() => setEditingAccount(null)}
        title={
          <div className="flex items-center gap-2 font-bold text-lg">
            <Pencil className="h-5 w-5 text-brand-600" />
            <span>Edit Account Details</span>
          </div>
        }
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmitEdit(async (val) => {
            if (!editingAccount) return;
            try {
              await updateMutation.mutateAsync({ id: editingAccount.id, data: val });
            } catch {}
          })}
        >
          <TextField
            label="Account Name"
            {...registerEdit("name")}
            error={errorsEdit.name?.message}
          />
          <TextField
            label="Description"
            {...registerEdit("description")}
            error={errorsEdit.description?.message}
          />

          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setEditingAccount(null)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="btn-primary cursor-pointer"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Account Modal */}
      <Modal
        open={!!deletingAccount}
        onClose={() => setDeletingAccount(null)}
        title={
          <div className="flex items-center gap-2 font-bold text-lg text-rose-600">
            <Trash2 className="h-5 w-5" />
            <span>Confirm Deletion</span>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-655 dark:text-zinc-400">
            Are you sure you want to delete the account <span className="font-bold text-slate-800 dark:text-white">"{deletingAccount?.name}"</span>?
          </p>
          <p className="text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/20 p-2.5 rounded-lg font-medium">
            Warning: Deleting this account will also delete all associated transactions. This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <button
              className="btn-secondary"
              onClick={() => setDeletingAccount(null)}
            >
              Cancel
            </button>
            <button
              className="btn-danger cursor-pointer"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deletingAccount) deleteMutation.mutate(deletingAccount.id);
              }}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Account"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
