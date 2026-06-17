import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  Folder, Activity, Briefcase, CheckCircle, Search, 
  SlidersHorizontal, Users, CheckSquare, Calendar, 
  LayoutGrid, List, Loader2 
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/Badges";
import { projectsApi } from "@/services/api";
import type { Project, ProjectStatus } from "@/types";
import { formatDate } from "@/lib/format";
import { LoadingPage } from "@/components/Loading";
import { useAuth } from "@/features/auth/AuthProvider";
import { ProjectFormModal } from "./ProjectFormPage";

type ViewMode = "board" | "list";

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const isClient = project.category === "client";
  const categoryColorClass = isClient ? "bg-blue-500" : "bg-purple-500";
  return (
    <div
      onClick={onClick}
      className="relative flex flex-col justify-between rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-white/[0.06] p-4 cursor-pointer hover:-translate-y-0.5 transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.015)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] group overflow-hidden"
    >
      {/* Category accent line on left */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${categoryColorClass}`} />

      <div className="pl-1.5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="font-bold text-slate-900 dark:text-slate-100 text-sm group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-2 leading-snug">
            {project.name}
          </span>
          <span
            className={`badge shrink-0 text-[10px] font-bold ${
              isClient
                ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30"
                : "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border border-purple-200/50 dark:border-purple-900/30"
            }`}
          >
            {isClient ? "Client" : "Internal"}
          </span>
        </div>
        
        {project.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
            {project.description}
          </p>
        )}
        
        <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
          <StatusBadge kind="project" status={project.status} />
          
          <div className="flex items-center gap-3 text-xs text-slate-450 dark:text-slate-500 font-semibold">
            <span className="flex items-center gap-1" title="Members">
              <Users className="h-3.5 w-3.5" />
              <span>{project.members?.length ?? 0}</span>
            </span>
            <span className="flex items-center gap-1" title="Tasks">
              <CheckSquare className="h-3.5 w-3.5" />
              <span>{project._count?.tasks ?? 0}</span>
            </span>
          </div>
        </div>

        {(project.startDate || project.endDate) && (
          <div className="mt-2.5 pt-2 border-t border-dashed border-slate-100 dark:border-white/[0.04] text-[10px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <Calendar className="h-3 w-3 shrink-0" />
            <span>{formatDate(project.startDate)}</span>
            {project.startDate && project.endDate && <span className="text-slate-350 dark:text-slate-700">→</span>}
            <span>{formatDate(project.endDate)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectRow({ project, onClick }: { project: Project; onClick: () => void }) {
  const isClient = project.category === "client";
  return (
    <tr
      onClick={onClick}
      className="hover:bg-slate-50 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors"
    >
      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100 text-sm">{project.name}</td>
      <td className="px-4 py-3">
        <span
          className={`badge text-[10px] font-bold ${
            isClient
              ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200/30"
              : "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border border-purple-200/30"
          }`}
        >
          {isClient ? "Client" : "Internal"}
        </span>
      </td>
      <td className="px-4 py-3">
        <StatusBadge kind="project" status={project.status} />
      </td>
      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 font-semibold">{project.members?.length ?? 0}</td>
      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 font-semibold">{project._count?.tasks ?? 0}</td>
      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-450">{formatDate(project.startDate)}</td>
      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-450">{formatDate(project.endDate)}</td>
    </tr>
  );
}

export default function ProjectsListPage() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | ProjectStatus>("");
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [formModalOpen, setFormModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["projects", search, status],
    queryFn: () =>
      projectsApi.list({
        search: search || undefined,
        status: status || undefined,
        pageSize: 100,
      }),
  });

  const allProjects = data?.items ?? [];
  const totalProjects = allProjects.length;
  const activeProjects = allProjects.filter((p) => p.status === "active").length;
  const clientProjectsCount = allProjects.filter((p) => p.category === "client").length;
  const completedProjects = allProjects.filter((p) => p.status === "completed").length;

  const clientProjects = useMemo(
    () => allProjects.filter((p) => p.category === "client"),
    [allProjects]
  );
  const internalProjects = useMemo(
    () => allProjects.filter((p) => p.category !== "client"),
    [allProjects]
  );

  return (
    <>
      <PageHeader
        title="Projects"
        actions={
          (user?.role === "admin" || user?.role === "manager") ? (
            <button
              className="btn-primary shadow-glow-brand hover:-translate-y-0.5 active:translate-y-0 transform transition-all duration-200 cursor-pointer"
              onClick={() => setFormModalOpen(true)}
            >
              New project
            </button>
          ) : null
        }
      />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Total Projects */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-white/[0.06] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)] transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-bl-full transition-all duration-300 group-hover:scale-110" />
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-50 dark:bg-brand-500/10 rounded-xl text-brand-600 dark:text-brand-400">
              <Folder className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Projects</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400 mt-1" />
                ) : (
                  totalProjects
                )}
              </h3>
            </div>
          </div>
        </div>

        {/* Card 2: Active Projects */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-white/[0.06] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)] transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full transition-all duration-300 group-hover:scale-110" />
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
              <Activity className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Projects</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400 mt-1" />
                ) : (
                  activeProjects
                )}
              </h3>
            </div>
          </div>
        </div>

        {/* Card 3: Client Projects */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-white/[0.06] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)] transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full transition-all duration-300 group-hover:scale-110" />
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
              <Briefcase className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Client Projects</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400 mt-1" />
                ) : (
                  clientProjectsCount
                )}
              </h3>
            </div>
          </div>
        </div>

        {/* Card 4: Completed */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-white/[0.06] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)] transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full transition-all duration-300 group-hover:scale-110" />
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-650 dark:text-indigo-400">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Completed</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400 mt-1" />
                ) : (
                  completedProjects
                )}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Glassmorphic Search & Filters Bar */}
      <div className="glass-panel rounded-2xl p-4 mb-6 border border-slate-200/60 dark:border-white/[0.06] shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-sm">
            <SlidersHorizontal className="h-4 w-4 text-brand-500" />
            <span>Filter Projects</span>
          </div>
          {(search || status) && (
            <button
              onClick={() => {
                setSearch("");
                setStatus("");
              }}
              className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-350 font-semibold hover:underline cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-550">
              <Search className="h-4 w-4" />
            </div>
            <input
              className="input pl-9 w-full"
              placeholder="Search projects by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-555">
              <Folder className="h-4 w-4" />
            </div>
            <select
              className="input pl-9 w-full appearance-none cursor-pointer"
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus | "")}
            >
              <option value="">All Statuses</option>
              {(["draft", "active", "on_hold", "completed", "archived"] as ProjectStatus[]).map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* View Toggle Bar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex bg-slate-100 dark:bg-zinc-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-white/[0.08] shadow-xs">
          <button
            id="view-board"
            onClick={() => setViewMode("board")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              viewMode === "board"
                ? "bg-white dark:bg-zinc-700 text-slate-800 dark:text-slate-100 shadow-xs font-bold"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Board View</span>
          </button>
          <button
            id="view-list"
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              viewMode === "list"
                ? "bg-white dark:bg-zinc-700 text-slate-800 dark:text-slate-100 shadow-xs font-bold"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <List className="h-3.5 w-3.5" />
            <span>List View</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-zinc-900 border border-slate-200/50 dark:border-white/[0.06] px-3 py-1 rounded-lg">
          Filtered <span className="text-brand-600 dark:text-brand-400 font-bold">{allProjects.length}</span> projects
        </div>
      </div>

      {isLoading ? (
        <LoadingPage message="Loading Projects..." />
      ) : viewMode === "board" ? (
        /* ── Board view: two columns side by side ── */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Client Projects column */}
          <div className="flex flex-col rounded-2xl p-4 bg-slate-50/40 dark:bg-zinc-900/30 border border-slate-200/60 dark:border-white/[0.04] min-h-[500px]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/50 dark:border-white/[0.04]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <h2 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  Client Projects
                </h2>
              </div>
              <span className="text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/30 px-2.5 py-0.5 rounded-full">
                {clientProjects.length}
              </span>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto">
              {clientProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-zinc-850 rounded-2xl p-6 text-slate-400 dark:text-slate-600 text-xs italic text-center h-28">
                  No client projects
                </div>
              ) : (
                clientProjects.map((p) => (
                  <ProjectCard key={p.id} project={p} onClick={() => nav(`/projects/${p.id}`)} />
                ))
              )}
            </div>
          </div>

          {/* Internal / Non-Client column */}
          <div className="flex flex-col rounded-2xl p-4 bg-slate-50/40 dark:bg-zinc-900/30 border border-slate-200/60 dark:border-white/[0.04] min-h-[500px]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/50 dark:border-white/[0.04]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <h2 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  Internal &amp; Personal
                </h2>
              </div>
              <span className="text-xs font-bold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/30 px-2.5 py-0.5 rounded-full">
                {internalProjects.length}
              </span>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto">
              {internalProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-zinc-850 rounded-2xl p-6 text-slate-400 dark:text-slate-600 text-xs italic text-center h-28">
                  No internal projects
                </div>
              ) : (
                internalProjects.map((p) => (
                  <ProjectCard key={p.id} project={p} onClick={() => nav(`/projects/${p.id}`)} />
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ── List view: unified table ── */
        <div className="card overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-white/[0.06] shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-zinc-855 text-slate-600 dark:text-slate-350 border-b border-slate-200/50 dark:border-white/[0.04]">
              <tr>
                {["Name", "Category", "Status", "Members", "Tasks", "Start Date", "End Date"].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-bold uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] bg-white dark:bg-zinc-900">
              {allProjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400 dark:text-slate-500 text-sm">
                    No projects found
                  </td>
                </tr>
              ) : (
                allProjects.map((p) => (
                  <ProjectRow key={p.id} project={p} onClick={() => nav(`/projects/${p.id}`)} />
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <ProjectFormModal 
        open={formModalOpen} 
        onClose={() => setFormModalOpen(false)} 
      />
    </>
  );
}
