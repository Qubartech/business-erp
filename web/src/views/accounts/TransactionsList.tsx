"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { accountsApi, type TransactionInput } from "@/services/accountsApi";
import { projectsApi, usersApi } from "@/services/api";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Modal } from "@/components/Modal";
import { TextField, SelectField } from "@/components/fields";
import { toast } from "@/lib/toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus, Calendar, Landmark, ArrowUpRight, ArrowDownLeft,
  ArrowLeftRight, ArrowRight, Search, ChevronLeft, ChevronRight, Ban, Pencil
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatDate } from "@/lib/format";
import type { Transaction, TransactionType } from "@/types";

const INFLOW_CATEGORIES = [
  { value: "Client Project Earnings", label: "Client Project Earnings" },
  { value: "Interest Income", label: "Interest Income" },
  { value: "Other Inflow", label: "Other Inflow" },
];

const OUTFLOW_CATEGORIES = [
  { value: "Salary", label: "Salary" },
  { value: "Office Rent", label: "Office Rent" },
  { value: "Utility Bill", label: "Utility Bill" },
  { value: "Software Subscription", label: "Software Subscription" },
  { value: "Office Supply / Stationery", label: "Office Supply / Stationery" },
  { value: "Hardware Purchase", label: "Hardware Purchase" },
  { value: "Other Expense", label: "Other Expense" },
];

const schema = z.object({
  accountId: z.string().uuid("Primary account is required"),
  toAccountId: z.preprocess((val) => val === "" ? null : val, z.string().uuid().optional().nullable()),
  type: z.enum(["deposit", "withdrawal", "transfer"]),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  date: z.string().min(1, "Date is required"),
  description: z.preprocess((val) => val === "" ? null : val, z.string().max(500).optional().nullable()),
  reference: z.preprocess((val) => val === "" ? null : val, z.string().max(100).optional().nullable()),
  category: z.preprocess((val) => val === "" ? null : val, z.string().max(100).optional().nullable()),
  spentById: z.preprocess((val) => val === "" ? null : val, z.string().uuid().optional().nullable()),
  projectId: z.preprocess((val) => val === "" ? null : val, z.string().uuid().optional().nullable()),
});

type FormValues = z.infer<typeof schema>;

export default function TransactionsList() {
  const qc = useQueryClient();
  const pathname = usePathname();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [accountFilter, setAccountFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [spentByFilter, setSpentByFilter] = useState("");

  const [openNew, setOpenNew] = useState(false);
  const [voidingTx, setVoidingTx] = useState<Transaction | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Fetch accounts for form dropdowns
  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: accountsApi.listAccounts,
  });

  // Fetch projects for filters and forms
  const { data: projects } = useQuery({
    queryKey: ["projects-lookup"],
    queryFn: () => projectsApi.list({ pageSize: 100 }),
  });

  // Fetch users for filters and forms
  const { data: users } = useQuery({
    queryKey: ["users-lookup"],
    queryFn: () => usersApi.list({ pageSize: 100 }),
  });

  // Fetch transactions with page and filters
  const { data: txData, isLoading } = useQuery({
    queryKey: ["transactions", page, accountFilter, typeFilter, projectFilter, spentByFilter, search],
    queryFn: () =>
      accountsApi.listTransactions({
        page,
        pageSize: 15,
        accountId: accountFilter || undefined,
        type: typeFilter || undefined,
        projectId: projectFilter || undefined,
        spentById: spentByFilter || undefined,
        search: search || undefined,
      }),
  });

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      accountId: "",
      toAccountId: "",
      type: "withdrawal",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      description: "",
      reference: "",
      category: "",
      spentById: "",
      projectId: "",
    },
  });

  const txType = watch("type");

  const handleClose = () => {
    setOpenNew(false);
    setEditingTx(null);
    reset({
      accountId: "",
      toAccountId: "",
      type: "withdrawal",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      description: "",
      reference: "",
      category: "",
      spentById: "",
      projectId: "",
    });
  };

  const handleEditClick = (t: Transaction) => {
    setEditingTx(t);
    reset({
      accountId: t.accountId,
      toAccountId: t.toAccountId || "",
      type: t.type,
      amount: t.amount,
      date: new Date(t.date).toISOString().split("T")[0],
      description: t.description || "",
      reference: t.reference || "",
      category: t.category || "",
      spentById: t.spentById || "",
      projectId: t.projectId || "",
    });
    setOpenNew(true);
  };

  const handleNewClick = () => {
    setEditingTx(null);
    reset({
      accountId: "",
      toAccountId: "",
      type: "withdrawal",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      description: "",
      reference: "",
      category: "",
      spentById: "",
      projectId: "",
    });
    setOpenNew(true);
  };

  const createMutation = useMutation({
    mutationFn: accountsApi.createTransaction,
    onSuccess: () => {
      toast.success("Transaction recorded successfully");
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      handleClose();
    },
    onError: (e: any) => toast.error(e.message || "Failed to record transaction"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TransactionInput }) =>
      accountsApi.updateTransaction(id, data),
    onSuccess: () => {
      toast.success("Transaction updated successfully");
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      handleClose();
    },
    onError: (e: any) => toast.error(e.message || "Failed to update transaction"),
  });

  const voidMutation = useMutation({
    mutationFn: accountsApi.deleteTransaction,
    onSuccess: () => {
      toast.success("Transaction voided successfully");
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      setVoidingTx(null);
    },
    onError: (e: any) => toast.error(e.message || "Failed to void transaction"),
  });

  const formatCurrency = (val: number) => {
    const formatted = Math.abs(val).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return val < 0 ? `-৳${formatted}` : `৳${formatted}`;
  };

  const getTxBadge = (type: TransactionType) => {
    switch (type) {
      case "deposit":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/10 dark:bg-emerald-950/20 dark:text-emerald-400">
            <ArrowDownLeft className="h-3 w-3" /> Deposit
          </span>
        );
      case "withdrawal":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700 ring-1 ring-inset ring-rose-600/10 dark:bg-rose-950/20 dark:text-rose-400">
            <ArrowUpRight className="h-3 w-3" /> Withdrawal
          </span>
        );
      case "transfer":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-xs font-bold text-slate-700 ring-1 ring-inset ring-slate-600/10 dark:bg-zinc-800 dark:text-zinc-300">
            <ArrowLeftRight className="h-3 w-3" /> Transfer
          </span>
        );
    }
  };

  const tabs = [
    { name: "Accounts List", href: "/accounts", current: pathname === "/accounts" },
    { name: "Transactions Log", href: "/accounts/transactions", current: pathname === "/accounts/transactions" },
    { name: "Financial Reports", href: "/accounts/reports", current: pathname === "/accounts/reports" },
  ];

  const cols: Column<Transaction>[] = [
    {
      key: "date",
      header: "Date",
      render: (t) => (
        <span className="font-semibold text-slate-600 dark:text-slate-400 text-xs">
          {formatDate(t.date)}
        </span>
      )
    },
    {
      key: "account",
      header: "Account",
      render: (t) => {
        if (t.type === "transfer") {
          return (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-slate-800 dark:text-white">{t.account?.name}</span>
              <ArrowRight className="h-3 w-3 text-slate-400" />
              <span className="font-bold text-slate-800 dark:text-white">{t.toAccount?.name}</span>
            </div>
          );
        }
        return (
          <div className="flex flex-col">
            <span className="font-bold text-slate-800 dark:text-white">{t.account?.name}</span>
            {t.project && (
              <span className="text-[10px] text-brand-600 dark:text-brand-400 font-semibold mt-0.5">
                📁 Project: {t.project.name}
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: "type",
      header: "Type",
      render: (t) => getTxBadge(t.type)
    },
    {
      key: "category",
      header: "Category & Spent By",
      render: (t) => {
        if (t.type === "transfer") return <span className="text-slate-400">—</span>;
        return (
          <div className="flex flex-col gap-0.5">
            {t.category && (
              <span className="inline-flex items-center w-fit rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-950/20 dark:text-blue-400">
                {t.category}
              </span>
            )}
            {t.spentBy && (
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">
                By: <span className="font-semibold text-slate-700 dark:text-slate-350">{t.spentBy.name}</span>
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: "description",
      header: "Details",
      render: (t) => (
        <div className="flex flex-col">
          {t.reference && (
            <span className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-455">
              Ref: {t.reference}
            </span>
          )}
          <span className="text-xs text-slate-600 dark:text-zinc-400 line-clamp-1 max-w-[200px]">
            {t.description || "—"}
          </span>
        </div>
      )
    },
    {
      key: "amount",
      header: "Amount",
      render: (t) => {
        let prefix = "";
        let colorClass = "text-slate-900 dark:text-slate-100 font-extrabold";
        if (t.type === "deposit") {
          prefix = "+";
          colorClass = "text-emerald-600 dark:text-emerald-450 font-black";
        } else if (t.type === "withdrawal") {
          prefix = "-";
          colorClass = "text-rose-600 dark:text-rose-450 font-black";
        }
        return (
          <span className={`font-mono text-sm ${colorClass}`}>
            {prefix}{formatCurrency(t.amount)}
          </span>
        );
      }
    },
    {
      key: "actions",
      header: "",
      render: (t) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleEditClick(t)}
            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/20 rounded-lg transition-colors"
            title="Edit transaction"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => setVoidingTx(t)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors"
            title="Void transaction"
          >
            <Ban className="h-4 w-4" />
          </button>
        </div>
      ),
      className: "text-right"
    }
  ];

  const totalPages = txData ? Math.ceil(txData.total / txData.pageSize) : 1;

  return (
    <>
      <PageHeader
        title="Transactions Log"
        description="View and log deposits, withdrawals, and internal transfers"
        actions={
          <button
            onClick={handleNewClick}
            className="btn-primary flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Record Transaction
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

      {/* Filters card */}
      <div className="card p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/[0.04]">
        {/* Search */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </span>
          <input
            className="input w-full pl-9 text-sm"
            placeholder="Search description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* Account Filter */}
        <select
          className="input text-sm"
          value={accountFilter}
          onChange={(e) => {
            setAccountFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Accounts</option>
          {accounts?.map((a) => (
            <option key={a.id} value={a.id}>
              {a.code} — {a.name}
            </option>
          ))}
        </select>

        {/* Type Filter */}
        <select
          className="input text-sm"
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Types</option>
          <option value="deposit">Deposit</option>
          <option value="withdrawal">Withdrawal</option>
          <option value="transfer">Transfer</option>
        </select>

        {/* Project Filter */}
        <select
          className="input text-sm"
          value={projectFilter}
          onChange={(e) => {
            setProjectFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Projects</option>
          {projects?.items?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {/* Spent By Filter */}
        <select
          className="input text-sm"
          value={spentByFilter}
          onChange={(e) => {
            setSpentByFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Spenders</option>
          {users?.items?.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>

        {/* Quick Reset */}
        <button
          onClick={() => {
            setSearch("");
            setAccountFilter("");
            setTypeFilter("");
            setProjectFilter("");
            setSpentByFilter("");
            setPage(1);
          }}
          className="btn-secondary text-sm"
        >
          Reset Filters
        </button>
      </div>

      {/* Main List */}
      <div className="card p-0 overflow-hidden mb-4">
        <DataTable
          rows={txData?.items}
          loading={isLoading}
          columns={cols}
          rowKey={(t) => t.id}
          empty="No transactions found for the active filters."
        />
      </div>

      {/* Pagination */}
      {txData && txData.total > txData.pageSize && (
        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-white/[0.04] rounded-2xl">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Showing <span className="font-semibold">{((page - 1) * txData.pageSize) + 1}</span> to{" "}
            <span className="font-semibold">{Math.min(page * txData.pageSize, txData.total)}</span> of{" "}
            <span className="font-semibold">{txData.total}</span> transactions
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Record/Edit Transaction Modal */}
      <Modal
        open={openNew}
        onClose={handleClose}
        title={
          <div className="flex items-center gap-2 font-bold text-lg">
            <Landmark className="h-5 w-5 text-brand-600" />
            <span>{editingTx ? "Edit Office Transaction" : "Record Office Transaction"}</span>
          </div>
        }
      >
        <form
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          onSubmit={handleSubmit(
            async (val) => {
              try {
                // Convert date string back into ISO string for service
                const inputData: any = {
                  ...val,
                  date: new Date(val.date).toISOString(),
                  category: val.type !== "transfer" && val.category ? val.category : null,
                  spentById: val.type === "withdrawal" && val.spentById ? val.spentById : null,
                  projectId: val.type !== "transfer" && val.projectId ? val.projectId : null,
                };
                if (val.type !== "transfer") {
                  inputData.toAccountId = null;
                }
                if (editingTx) {
                  await updateMutation.mutateAsync({ id: editingTx.id, data: inputData });
                } else {
                  await createMutation.mutateAsync(inputData);
                }
              } catch {}
            },
            (err) => {
              console.error("Form validation errors:", err);
              const errorMessages = Object.entries(err)
                .map(([field, error]) => `${field}: ${error?.message || "Invalid value"}`)
                .join(", ");
              toast.error(errorMessages ? `Form validation failed: ${errorMessages}` : "Please check your inputs.");
            }
          )}
        >
          <SelectField
            label="Transaction Type"
            options={[
              { value: "withdrawal", label: "Withdrawal (Cash Out / Expense)" },
              { value: "deposit", label: "Deposit (Cash In / Revenue)" },
              { value: "transfer", label: "Transfer (Internal Account Move)" },
            ]}
            {...register("type")}
            error={errors.type?.message}
          />
          <TextField
            label="Amount (৳)"
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register("amount")}
            error={errors.amount?.message}
          />

          <SelectField
            label={txType === "transfer" ? "Source Account" : "Account"}
            options={[
              { value: "", label: "Select Account..." },
              ...(accounts?.map((a) => ({ value: a.id, label: `${a.code} — ${a.name} (${formatCurrency(a.balance)})` })) || [])
            ]}
            {...register("accountId")}
            error={errors.accountId?.message}
          />

          {txType === "transfer" ? (
            <SelectField
              label="Destination Account"
              options={[
                { value: "", label: "Select Account..." },
                ...(accounts?.map((a) => ({ value: a.id, label: `${a.code} — ${a.name} (${formatCurrency(a.balance)})` })) || [])
              ]}
              {...register("toAccountId")}
              error={errors.toAccountId?.message}
            />
          ) : (
            <TextField
              label="Transaction Date"
              type="date"
              {...register("date")}
              error={errors.date?.message}
            />
          )}

          {txType === "transfer" && (
            <div className="sm:col-span-2">
              <TextField
                label="Transaction Date"
                type="date"
                {...register("date")}
                error={errors.date?.message}
              />
            </div>
          )}

          {/* New conditional fields */}
          {txType !== "transfer" && (
            <SelectField
              label="Category"
              options={[
                { value: "", label: "Select Category..." },
                ...(txType === "deposit" ? INFLOW_CATEGORIES : OUTFLOW_CATEGORIES)
              ]}
              {...register("category")}
              error={errors.category?.message}
            />
          )}

          {txType !== "transfer" && (
            <SelectField
              label="Link Project"
              options={[
                { value: "", label: "No Project Link (General)" },
                ...(projects?.items?.map((p) => ({ value: p.id, label: p.name })) || [])
              ]}
              {...register("projectId")}
              error={errors.projectId?.message}
            />
          )}

          {txType === "withdrawal" && (
            <div className="sm:col-span-2">
              <SelectField
                label="Spent By / Beneficiary"
                options={[
                  { value: "", label: "Select Person..." },
                  ...(users?.items?.map((u) => ({ value: u.id, label: `${u.name} (${u.role})` })) || [])
                ]}
                {...register("spentById")}
                error={errors.spentById?.message}
              />
            </div>
          )}

          <TextField
            label="Reference (e.g. Invoice #, Check #)"
            placeholder="Optional"
            {...register("reference")}
            error={errors.reference?.message}
          />
          <TextField
            label="Description / Particulars"
            placeholder="Optional"
            {...register("description")}
            error={errors.description?.message}
          />

          <div className="sm:col-span-2 flex justify-end gap-2 mt-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="btn-primary cursor-pointer"
            >
              {editingTx
                ? (updateMutation.isPending ? "Saving..." : "Save Changes")
                : (createMutation.isPending ? "Recording..." : "Record Transaction")
              }
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Void Transaction Modal */}
      <Modal
        open={!!voidingTx}
        onClose={() => setVoidingTx(null)}
        title={
          <div className="flex items-center gap-2 font-bold text-lg text-rose-650">
            <Ban className="h-5 w-5" />
            <span>Void Transaction</span>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-655 dark:text-zinc-400">
            Are you sure you want to void this transaction?
          </p>
          <div className="p-3 bg-slate-50 dark:bg-zinc-800 rounded-xl space-y-1.5 font-mono text-xs border border-slate-200/50 dark:border-white/[0.04]">
            <div><span className="text-slate-400">Date:</span> {voidingTx && formatDate(voidingTx.date)}</div>
            <div><span className="text-slate-400">Type:</span> {voidingTx?.type.toUpperCase()}</div>
            <div>
              <span className="text-slate-400">Account:</span> {voidingTx?.account?.name}
              {voidingTx?.type === "transfer" && ` -> ${voidingTx?.toAccount?.name}`}
            </div>
            <div><span className="text-slate-400">Amount:</span> {voidingTx && formatCurrency(voidingTx.amount)}</div>
            {voidingTx?.reference && <div><span className="text-slate-400">Ref:</span> {voidingTx.reference}</div>}
          </div>
          <p className="text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/20 p-2.5 rounded-lg font-medium">
            Warning: Voiding this transaction will reverse its balance effects on all accounts involved.
          </p>
          <div className="flex justify-end gap-2">
            <button
              className="btn-secondary"
              onClick={() => setVoidingTx(null)}
            >
              Cancel
            </button>
            <button
              className="btn-danger cursor-pointer"
              disabled={voidMutation.isPending}
              onClick={() => {
                if (voidingTx) voidMutation.mutate(voidingTx.id);
              }}
            >
              {voidMutation.isPending ? "Voiding..." : "Void Transaction"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
