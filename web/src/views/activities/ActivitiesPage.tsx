"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { activitiesApi } from "@/services/featureApis";
import { projectsApi, usersApi } from "@/services/api";
import { formatDateTime } from "@/lib/format";
import { 
  Bell, ChevronLeft, ChevronRight, Search, Clock, Calendar, 
  FolderKanban, ListChecks, StickyNote, FileText, CircleDollarSign, X,
  User, SlidersHorizontal, ArrowRightLeft
} from "lucide-react";
import { clsx } from "clsx";

const ACTIVITY_TYPES = [
  { value: "", label: "All Types" },
  { value: "attendance", label: "Attendance" },
  { value: "project", label: "Projects" },
  { value: "task", label: "Tasks" },
  { value: "note", label: "Notes" },
  { value: "document", label: "Documents" },
  { value: "commit", label: "Commits" },
  { value: "transaction", label: "Transactions" },
];

function formatRelativeTime(dateStr: string) {
  const d = new Date(dateStr);
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ActivitiesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [userId, setUserId] = useState("");
  const [projectId, setProjectId] = useState("");

  const pageSize = 15;

  // Fetch lookups
  const { data: usersData } = useQuery({
    queryKey: ["users", "all"],
    queryFn: () => usersApi.list({ pageSize: 100 }),
  });

  const { data: projectsData } = useQuery({
    queryKey: ["projects", "all"],
    queryFn: () => projectsApi.list({ pageSize: 100 }),
  });

  // Fetch activities
  const { data, isLoading, isError } = useQuery({
    queryKey: ["activities", { page, type, userId, projectId, search }],
    queryFn: () =>
      activitiesApi.list({
        page,
        pageSize,
        type: type || undefined,
        userId: userId || undefined,
        projectId: projectId || undefined,
        search: search || undefined,
      }),
  });

  const users = usersData?.items || [];
  const projects = projectsData?.items || [];
  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1;

  const handleClearFilters = () => {
    setSearch("");
    setType("");
    setUserId("");
    setProjectId("");
    setPage(1);
  };

  const getActivityIconAndColor = (actType: string) => {
    switch (actType) {
      case "attendance":
        return {
          icon: Calendar,
          color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/30 dark:border-emerald-500/10",
        };
      case "project":
        return {
          icon: FolderKanban,
          color: "text-brand-500 bg-brand-50 dark:bg-brand-950/20 border-brand-200/30 dark:border-brand-500/10",
        };
      case "task":
        return {
          icon: ListChecks,
          color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20 border-blue-200/30 dark:border-blue-500/10",
        };
      case "note":
        return {
          icon: StickyNote,
          color: "text-violet-500 bg-violet-50 dark:bg-violet-950/20 border-violet-200/30 dark:border-violet-500/10",
        };
      case "document":
        return {
          icon: FileText,
          color: "text-sky-500 bg-sky-50 dark:bg-sky-950/20 border-sky-200/30 dark:border-sky-500/10",
        };
      case "commit":
        return {
          icon: Clock,
          color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200/30 dark:border-indigo-500/10",
        };
      case "transaction":
        return {
          icon: CircleDollarSign,
          color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-200/30 dark:border-amber-500/10",
        };
      default:
        return {
          icon: Bell,
          color: "text-slate-500 bg-slate-50 dark:bg-zinc-800/60 border-slate-200/30 dark:border-white/[0.04]",
        };
    }
  };

  const hasActiveFilters = search || type || userId || projectId;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications & Activity Log"
        description="A real-time workspace log of all member actions, project updates, and system activities."
      />

      {/* Filter Bar */}
      <div className="card p-4 space-y-4 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-white/[0.04] rounded-2xl shadow-sm">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search activity description..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-3 top-2.5 hover:text-slate-700 dark:hover:text-slate-200 text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div className="w-full lg:w-48">
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 appearance-none cursor-pointer"
            >
              {ACTIVITY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* User Filter */}
          <div className="w-full lg:w-56">
            <select
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 appearance-none cursor-pointer"
            >
              <option value="">All Members</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Project Filter */}
          <div className="w-full lg:w-56">
            <select
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 appearance-none cursor-pointer"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer text-slate-600 dark:text-slate-350"
            >
              <X className="h-3.5 w-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Activity Timeline Feed */}
      <div className="space-y-4">
        {isLoading ? (
          // Skeleton Loader
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-white/[0.04] rounded-2xl animate-pulse"
              >
                <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-zinc-800 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-slate-100 dark:bg-zinc-800 rounded-md w-3/4" />
                  <div className="h-2.5 bg-slate-100 dark:bg-zinc-800 rounded-md w-1/4" />
                </div>
                <div className="h-3 bg-slate-100 dark:bg-zinc-800 rounded-md w-16" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="card py-12 text-center text-rose-500 bg-rose-500/[0.02] dark:bg-rose-550/[0.01] border-rose-200/50 dark:border-rose-500/20 rounded-2xl">
            <p className="text-sm font-semibold">Failed to load activities. Please try again.</p>
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="card py-16 text-center text-slate-400 dark:text-slate-500 border-slate-200/60 dark:border-white/[0.04] rounded-2xl">
            <Bell className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-750 mb-3" />
            <p className="text-sm font-medium">No activity matching your search criteria was found.</p>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="mt-3 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {data.items.map((activity) => {
              const { icon: IconComponent, color: iconStyle } = getActivityIconAndColor(activity.type);
              return (
                <div
                  key={activity.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-white/[0.04] rounded-2xl hover:border-slate-300 dark:hover:border-white/[0.1] hover:shadow-xs transition-all duration-200 group text-left"
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div
                      className={clsx(
                        "h-10 w-10 rounded-xl flex items-center justify-center border shrink-0 shadow-xs",
                        iconStyle
                      )}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-snug break-words">
                        {activity.description}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-semibold text-slate-400 dark:text-slate-550">
                        {activity.user && (
                          <span className="inline-flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {activity.user.name}
                          </span>
                        )}
                        {activity.user && activity.project && (
                          <span className="text-slate-300 dark:text-slate-700 select-none">•</span>
                        )}
                        {activity.project && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-brand-50/50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-350 border border-brand-100/30 dark:border-brand-500/10">
                            {activity.project.name}
                          </span>
                        )}
                        {activity.metadata && (
                          <>
                            <span className="text-slate-300 dark:text-slate-700 select-none">•</span>
                            <span className="font-mono text-[9px] text-slate-500 dark:text-slate-450 bg-slate-50 dark:bg-zinc-950 px-1 py-0.2 rounded-md border border-slate-100 dark:border-white/[0.04]">
                              {JSON.stringify(activity.metadata)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Date section */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between border-t border-slate-50 dark:border-white/[0.02] sm:border-0 pt-2 sm:pt-0 shrink-0">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 sm:text-right">
                      {formatRelativeTime(activity.createdAt)}
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-550 font-medium sm:text-right">
                      {formatDateTime(activity.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {data && data.total > data.pageSize && (
        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-white/[0.04] rounded-2xl shadow-sm">
          <div className="text-xs text-slate-500 dark:text-slate-450">
            Showing <span className="font-semibold">{((page - 1) * data.pageSize) + 1}</span> to{" "}
            <span className="font-semibold">{Math.min(page * data.pageSize, data.total)}</span> of{" "}
            <span className="font-semibold">{data.total}</span> activities
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => {
                setPage((p) => Math.max(p - 1, 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              disabled={page === 1}
              className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-850 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setPage((p) => Math.min(p + 1, totalPages));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              disabled={page === totalPages}
              className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-850 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
