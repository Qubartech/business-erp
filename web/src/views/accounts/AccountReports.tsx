"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { accountsApi } from "@/services/accountsApi";
import { PageHeader } from "@/components/PageHeader";
import {
  Printer, Landmark, Calculator, TrendingUp, Scale,
  CheckCircle2, AlertCircle, FolderKanban
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatDateTime } from "@/lib/format";

export default function AccountReports() {
  const pathname = usePathname();
  const [activeReportTab, setActiveReportTab] = useState<"balance-sheet" | "income-statement" | "project-profitability">("balance-sheet");

  const { data: reportData, isLoading } = useQuery({
    queryKey: ["financial-reports"],
    queryFn: accountsApi.getReports,
  });

  const formatCurrency = (val: number) => {
    const formatted = Math.abs(val).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return val < 0 ? `-৳${formatted}` : `৳${formatted}`;
  };

  const tabs = [
    { name: "Accounts List", href: "/accounts", current: pathname === "/accounts" },
    { name: "Transactions Log", href: "/accounts/transactions", current: pathname === "/accounts/transactions" },
    { name: "Financial Reports", href: "/accounts/reports", current: pathname === "/accounts/reports" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Financial Reports" description="Generate and view financial statements" />
        <div className="card p-8 flex flex-col items-center justify-center min-h-[300px]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600 mb-2" />
          <p className="text-sm text-slate-500">Loading financial data...</p>
        </div>
      </div>
    );
  }

  const bs = reportData?.balanceSheet;
  const is = reportData?.incomeStatement;

  const totalAssets = bs?.assets.total || 0;
  const totalLiabilities = bs?.liabilities.total || 0;
  const totalEquity = bs?.equity.total || 0;
  const liabilitiesAndEquity = totalLiabilities + totalEquity;
  const balancesEquation = Math.abs(totalAssets - liabilitiesAndEquity) < 0.01;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="print:hidden">
        <PageHeader
          title="Financial Reports"
          description="Generate and view balance sheets, income statements, and project profitability statements"
          actions={
            <button
              onClick={handlePrint}
              className="btn-secondary flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="h-4 w-4" /> Print Report
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

        {/* Report tab toggler */}
        <div className="flex gap-2 mb-6 p-1 bg-slate-100 dark:bg-zinc-900 rounded-xl max-w-xl border border-slate-200/50 dark:border-white/[0.04]">
          <button
            onClick={() => setActiveReportTab("balance-sheet")}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeReportTab === "balance-sheet"
                ? "bg-white dark:bg-zinc-800 text-slate-800 dark:text-slate-100 shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            Balance Sheet
          </button>
          <button
            onClick={() => setActiveReportTab("income-statement")}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeReportTab === "income-statement"
                ? "bg-white dark:bg-zinc-800 text-slate-800 dark:text-slate-100 shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            Income Statement (P&L)
          </button>
          <button
            onClick={() => setActiveReportTab("project-profitability")}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeReportTab === "project-profitability"
                ? "bg-white dark:bg-zinc-800 text-slate-800 dark:text-slate-100 shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            Project Revenue & Margins
          </button>
        </div>
      </div>

      {/* PRINT-ONLY HEADER */}
      <div className="hidden print:block mb-8 text-center space-y-2">
        <h1 className="text-2xl font-black text-slate-900">QUBARTECH ERP SYSTEMS</h1>
        <h2 className="text-lg font-bold text-slate-700 uppercase tracking-wide">
          {activeReportTab === "balance-sheet"
            ? "Balance Sheet Statement"
            : activeReportTab === "income-statement"
              ? "Income Statement (Profit & Loss)"
              : "Project Revenue & Margins Statement"}
        </h2>
        <p className="text-xs text-slate-550">
          Generated on: {formatDateTime(new Date())}
        </p>
        <div className="border-b-2 border-slate-900 my-4" />
      </div>

      {/* BALANCE SHEET REPORT */}
      {activeReportTab === "balance-sheet" && bs && (
        <div className="space-y-6">
          {/* Equation balance indicator */}
          <div className="print:hidden">
            {balancesEquation ? (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-355 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-xs font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-555 shrink-0" />
                <span>Accounting Equation is balanced: Assets ({formatCurrency(totalAssets)}) = Liabilities & Equity ({formatCurrency(liabilitiesAndEquity)})</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-355 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs font-semibold">
                <AlertCircle className="h-4 w-4 text-rose-555 shrink-0" />
                <span>Accounting Equation is out of balance! Assets ({formatCurrency(totalAssets)}) ≠ Liabilities & Equity ({formatCurrency(liabilitiesAndEquity)}). Please audit transaction logs.</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Assets Column */}
            <div className="card p-0 overflow-hidden bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/[0.04]">
              <div className="px-5 py-4 border-b border-slate-150 dark:border-white/[0.04] bg-slate-50/50 dark:bg-zinc-850/50 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-emerald-600" /> Assets
                </h3>
                <span className="font-mono text-sm font-black text-slate-900 dark:text-slate-100">
                  {formatCurrency(totalAssets)}
                </span>
              </div>
              <div className="p-0">
                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/50 text-xs">
                  <thead>
                    <tr className="bg-slate-50/30 dark:bg-zinc-900 text-slate-400 font-bold uppercase tracking-wider text-left">
                      <th className="px-5 py-2.5">Code</th>
                      <th className="px-5 py-2.5">Account Name</th>
                      <th className="px-5 py-2.5 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30">
                    {bs.assets.items.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-5 py-4 text-center text-slate-400">No Asset accounts found</td>
                      </tr>
                    ) : (
                      bs.assets.items.map((acc) => (
                        <tr key={acc.id} className="hover:bg-slate-50/30 dark:hover:bg-zinc-800/10">
                          <td className="px-5 py-3 font-mono text-slate-400 font-semibold">{acc.code}</td>
                          <td className="px-5 py-3 font-bold text-slate-700 dark:text-zinc-200">{acc.name}</td>
                          <td className="px-5 py-3 text-right font-mono font-bold text-slate-800 dark:text-zinc-100">{formatCurrency(acc.balance)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Liabilities & Equity Column */}
            <div className="space-y-6">
              {/* Liabilities */}
              <div className="card p-0 overflow-hidden bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/[0.04]">
                <div className="px-5 py-4 border-b border-slate-155 dark:border-white/[0.04] bg-slate-50/50 dark:bg-zinc-850/50 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-amber-600" /> Liabilities
                  </h3>
                  <span className="font-mono text-sm font-black text-slate-900 dark:text-slate-100">
                    {formatCurrency(totalLiabilities)}
                  </span>
                </div>
                <div className="p-0">
                  <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/50 text-xs">
                    <thead>
                      <tr className="bg-slate-50/30 dark:bg-zinc-900 text-slate-400 font-bold uppercase tracking-wider text-left">
                        <th className="px-5 py-2.5">Code</th>
                        <th className="px-5 py-2.5">Account Name</th>
                        <th className="px-5 py-2.5 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30">
                      {bs.liabilities.items.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-5 py-4 text-center text-slate-400">No Liability accounts found</td>
                        </tr>
                      ) : (
                        bs.liabilities.items.map((acc) => (
                          <tr key={acc.id} className="hover:bg-slate-50/30 dark:hover:bg-zinc-800/10">
                            <td className="px-5 py-3 font-mono text-slate-400 font-semibold">{acc.code}</td>
                            <td className="px-5 py-3 font-bold text-slate-700 dark:text-zinc-200">{acc.name}</td>
                            <td className="px-5 py-3 text-right font-mono font-bold text-slate-800 dark:text-zinc-100">{formatCurrency(acc.balance)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Equity */}
              <div className="card p-0 overflow-hidden bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/[0.04]">
                <div className="px-5 py-4 border-b border-slate-155 dark:border-white/[0.04] bg-slate-50/50 dark:bg-zinc-850/50 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Scale className="h-4 w-4 text-blue-600" /> Equity
                  </h3>
                  <span className="font-mono text-sm font-black text-slate-900 dark:text-slate-100">
                    {formatCurrency(totalEquity)}
                  </span>
                </div>
                <div className="p-0">
                  <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/50 text-xs">
                    <thead>
                      <tr className="bg-slate-50/30 dark:bg-zinc-900 text-slate-400 font-bold uppercase tracking-wider text-left">
                        <th className="px-5 py-2.5">Code</th>
                        <th className="px-5 py-2.5">Account Name</th>
                        <th className="px-5 py-2.5 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30">
                      {bs.equity.items.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-5 py-4 text-center text-slate-400">No Equity accounts found</td>
                        </tr>
                      ) : (
                        bs.equity.items.map((acc) => (
                          <tr key={acc.id} className="hover:bg-slate-50/30 dark:hover:bg-zinc-800/10">
                            <td className="px-5 py-3 font-mono text-slate-400 font-semibold">{acc.code}</td>
                            <td className="px-5 py-3 font-bold text-slate-700 dark:text-zinc-200">{acc.name}</td>
                            <td className="px-5 py-3 text-right font-mono font-bold text-slate-800 dark:text-zinc-100">{formatCurrency(acc.balance)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Balance Sheet Total Footer */}
          <div className="card p-5 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-zinc-900 dark:to-zinc-850 border border-slate-200/50 dark:border-white/[0.04] flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <div className="text-xs text-slate-400 dark:text-zinc-550 uppercase tracking-wider font-bold">Total Assets</div>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5">{formatCurrency(totalAssets)}</div>
            </div>
            <div className="sm:text-right">
              <div className="text-xs text-slate-400 dark:text-zinc-555 uppercase tracking-wider font-bold">Total Liabilities & Equity</div>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5">{formatCurrency(liabilitiesAndEquity)}</div>
            </div>
          </div>
        </div>
      )}

      {/* INCOME STATEMENT REPORT */}
      {activeReportTab === "income-statement" && is && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Revenues */}
          <div className="card p-0 overflow-hidden bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/[0.04]">
            <div className="px-5 py-4 border-b border-slate-155 dark:border-white/[0.04] bg-slate-50/50 dark:bg-zinc-850/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" /> Operating Revenue / Income
              </h3>
              <span className="font-mono text-sm font-black text-emerald-650 dark:text-emerald-400">
                {formatCurrency(is.revenue.total)}
              </span>
            </div>
            <div className="p-0">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/50 text-xs">
                <thead>
                  <tr className="bg-slate-50/30 dark:bg-zinc-900 text-slate-400 font-bold uppercase tracking-wider text-left">
                    <th className="px-5 py-2.5">Code</th>
                    <th className="px-5 py-2.5">Account Name</th>
                    <th className="px-5 py-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30">
                  {is.revenue.items.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-5 py-4 text-center text-slate-400">No Revenue accounts found</td>
                    </tr>
                  ) : (
                    is.revenue.items.map((acc) => (
                      <tr key={acc.id} className="hover:bg-slate-50/30 dark:hover:bg-zinc-800/10">
                        <td className="px-5 py-3 font-mono text-slate-400 font-semibold">{acc.code}</td>
                        <td className="px-5 py-3 font-bold text-slate-700 dark:text-zinc-200">{acc.name}</td>
                        <td className="px-5 py-3 text-right font-mono font-bold text-slate-800 dark:text-zinc-100">{formatCurrency(acc.balance)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Expenses */}
          <div className="card p-0 overflow-hidden bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/[0.04]">
            <div className="px-5 py-4 border-b border-slate-155 dark:border-white/[0.04] bg-slate-50/50 dark:bg-zinc-850/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Calculator className="h-4 w-4 text-rose-600" /> Operating Expenses
              </h3>
              <span className="font-mono text-sm font-black text-rose-650 dark:text-rose-400">
                {formatCurrency(is.expense.total)}
              </span>
            </div>
            <div className="p-0">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/50 text-xs">
                <thead>
                  <tr className="bg-slate-50/30 dark:bg-zinc-900 text-slate-400 font-bold uppercase tracking-wider text-left">
                    <th className="px-5 py-2.5">Code</th>
                    <th className="px-5 py-2.5">Account Name</th>
                    <th className="px-5 py-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30">
                  {is.expense.items.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-5 py-4 text-center text-slate-400">No Expense accounts found</td>
                    </tr>
                  ) : (
                    is.expense.items.map((acc) => (
                      <tr key={acc.id} className="hover:bg-slate-50/30 dark:hover:bg-zinc-800/10">
                        <td className="px-5 py-3 font-mono text-slate-400 font-semibold">{acc.code}</td>
                        <td className="px-5 py-3 font-bold text-slate-700 dark:text-zinc-200">{acc.name}</td>
                        <td className="px-5 py-3 text-right font-mono font-bold text-slate-800 dark:text-zinc-100">{formatCurrency(acc.balance)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Income Statement Summary Card */}
          <div className={`card p-6 flex flex-col sm:flex-row justify-between items-center gap-4 ${
            is.netIncome >= 0
              ? "bg-gradient-to-tr from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-900/60"
              : "bg-gradient-to-tr from-rose-50 to-red-50 dark:from-rose-950/20 dark:to-red-950/20 border border-rose-200 dark:border-rose-900/60"
          }`}>
            <div>
              <div className={`text-xs uppercase tracking-wider font-extrabold ${
                is.netIncome >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-455"
              }`}>
                {is.netIncome >= 0 ? "Net Profit" : "Net Loss"}
              </div>
              <div className={`text-3xl font-black font-mono mt-0.5 ${
                is.netIncome >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"
              }`}>
                {formatCurrency(is.netIncome)}
              </div>
            </div>
            <div className="flex gap-4 text-xs font-bold text-slate-500 dark:text-zinc-400">
              <div className="flex flex-col">
                <span>Revenue:</span>
                <span className="font-mono text-slate-750 dark:text-white font-extrabold">{formatCurrency(is.revenue.total)}</span>
              </div>
              <div className="flex flex-col">
                <span>Expenses:</span>
                <span className="font-mono text-slate-750 dark:text-white font-extrabold">{formatCurrency(is.expense.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROJECT PROFITABILITY STATEMENT */}
      {activeReportTab === "project-profitability" && reportData?.projectRevenue && (
        <div className="space-y-6 max-w-5xl mx-auto">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/[0.04] flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-wider">Total Project Inflow</span>
              <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-2">
                {formatCurrency(reportData.projectRevenue.reduce((sum, p) => sum + p.inflow, 0))}
              </span>
            </div>
            <div className="card p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/[0.04] flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 dark:text-zinc-555 uppercase tracking-wider">Total Project Outflow</span>
              <span className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400 mt-2">
                {formatCurrency(reportData.projectRevenue.reduce((sum, p) => sum + p.outflow, 0))}
              </span>
            </div>
            <div className="card p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/[0.04] flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 dark:text-zinc-555 uppercase tracking-wider">Net Project Profit</span>
              <span className="text-2xl font-black font-mono text-brand-600 dark:text-brand-400 mt-2">
                {formatCurrency(reportData.projectRevenue.reduce((sum, p) => sum + p.net, 0))}
              </span>
            </div>
          </div>

          {/* Project List Table */}
          <div className="card p-0 overflow-hidden bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/[0.04]">
            <div className="px-5 py-4 border-b border-slate-155 dark:border-white/[0.04] bg-slate-50/50 dark:bg-zinc-850/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-brand-600" /> Project Financial Details
              </h3>
            </div>
            <div className="p-0">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/50 text-xs">
                <thead>
                  <tr className="bg-slate-50/30 dark:bg-zinc-900 text-slate-400 font-bold uppercase tracking-wider text-left">
                    <th className="px-5 py-3">Project Name</th>
                    <th className="px-5 py-3 text-right">Inflow (Earnings)</th>
                    <th className="px-5 py-3 text-right">Outflow (Expenses)</th>
                    <th className="px-5 py-3 text-right">Net Profit / Margin</th>
                    <th className="px-5 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30">
                  {reportData.projectRevenue.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-slate-400 font-medium">No project-linked transactions found</td>
                    </tr>
                  ) : (
                    reportData.projectRevenue.map((p) => {
                      const netProfit = p.net;
                      const statusClass = netProfit > 0
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/10 dark:bg-emerald-950/20 dark:text-emerald-400"
                        : netProfit < 0
                          ? "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/10 dark:bg-rose-950/20 dark:text-rose-400"
                          : "bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-600/10 dark:bg-zinc-800 dark:text-zinc-300";

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/30 dark:hover:bg-zinc-800/10">
                          <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-white">{p.name}</td>
                          <td className="px-5 py-3.5 text-right font-mono text-emerald-650 dark:text-emerald-400 font-bold">{formatCurrency(p.inflow)}</td>
                          <td className="px-5 py-3.5 text-right font-mono text-rose-650 dark:text-rose-400 font-bold">{formatCurrency(p.outflow)}</td>
                          <td className={`px-5 py-3.5 text-right font-mono font-black ${netProfit >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}>{formatCurrency(netProfit)}</td>
                          <td className="px-5 py-3.5 text-center">
                            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ${statusClass}`}>
                              {netProfit > 0 ? "Profitable" : netProfit < 0 ? "Deficit" : "Break-even"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
