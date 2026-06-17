import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
  return (
    <div
      onClick={onClick}
      className="card p-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="font-semibold text-slate-900 text-sm group-hover:text-brand-600 transition-colors line-clamp-2 leading-snug">
          {project.name}
        </span>
        <span
          className={`badge shrink-0 text-xs ${
            isClient
              ? "bg-blue-50 text-blue-700 ring-blue-100"
              : "bg-purple-50 text-purple-700 ring-purple-100"
          }`}
        >
          {isClient ? "Client" : "Internal"}
        </span>
      </div>
      {project.description && (
        <p className="text-xs text-slate-500 line-clamp-2 mb-3">{project.description}</p>
      )}
      <div className="flex items-center justify-between">
        <StatusBadge kind="project" status={project.status} />
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span title="Members">👥 {project.members?.length ?? 0}</span>
          <span title="Tasks">✅ {project._count?.tasks ?? 0}</span>
        </div>
      </div>
      {(project.startDate || project.endDate) && (
        <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-400 flex gap-1">
          <span>{formatDate(project.startDate)}</span>
          {project.startDate && project.endDate && <span>→</span>}
          <span>{formatDate(project.endDate)}</span>
        </div>
      )}
    </div>
  );
}

function ProjectRow({ project, onClick }: { project: Project; onClick: () => void }) {
  const isClient = project.category === "client";
  return (
    <tr
      onClick={onClick}
      className="hover:bg-slate-50 cursor-pointer transition-colors"
    >
      <td className="px-4 py-3 font-medium text-slate-900 text-sm">{project.name}</td>
      <td className="px-4 py-3">
        <span
          className={`badge text-xs ${
            isClient
              ? "bg-blue-50 text-blue-700 ring-blue-100"
              : "bg-purple-50 text-purple-700 ring-purple-100"
          }`}
        >
          {isClient ? "Client" : "Internal"}
        </span>
      </td>
      <td className="px-4 py-3">
        <StatusBadge kind="project" status={project.status} />
      </td>
      <td className="px-4 py-3 text-sm text-slate-500">{project.members?.length ?? 0}</td>
      <td className="px-4 py-3 text-sm text-slate-500">{project._count?.tasks ?? 0}</td>
      <td className="px-4 py-3 text-sm text-slate-400">{formatDate(project.startDate)}</td>
      <td className="px-4 py-3 text-sm text-slate-400">{formatDate(project.endDate)}</td>
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

  // In board mode — fetch all projects (no category filter), then split client-side
  // In list mode — also fetch all, unified table
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
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              <button
                id="view-board"
                onClick={() => setViewMode("board")}
                title="Board View"
                className={`px-3 py-1.5 text-sm font-medium flex items-center gap-1.5 transition-colors ${
                  viewMode === "board"
                    ? "bg-brand-600 text-white"
                    : "bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="7" height="18" rx="1" strokeWidth="2" />
                  <rect x="14" y="3" width="7" height="18" rx="1" strokeWidth="2" />
                </svg>
                Board
              </button>
              <button
                id="view-list"
                onClick={() => setViewMode("list")}
                title="List View"
                className={`px-3 py-1.5 text-sm font-medium flex items-center gap-1.5 transition-colors border-l border-slate-200 ${
                  viewMode === "list"
                    ? "bg-brand-600 text-white"
                    : "bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                List
              </button>
            </div>

            {(user?.role === "admin" || user?.role === "manager") && (
              <button className="btn-primary" onClick={() => setFormModalOpen(true)}>
                New project
              </button>
            )}
          </div>
        }
      />

      <div className="mb-4 flex gap-2 flex-wrap w-full">
        <input
          className="input w-full md:max-w-sm"
          placeholder="Search projects"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input w-full md:max-w-[180px]"
          value={status}
          onChange={(e) => setStatus(e.target.value as ProjectStatus | "")}
        >
          <option value="">All statuses</option>
          {(["draft", "active", "on_hold", "completed", "archived"] as ProjectStatus[]).map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <LoadingPage message="Loading Projects..." />
      ) : viewMode === "board" ? (
        /* ── Board view: two columns side by side ── */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Client Projects column */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <h2 className="font-semibold text-slate-700 text-sm">
                Client Projects
              </h2>
              <span className="ml-auto badge bg-blue-50 text-blue-700 ring-blue-100">
                {clientProjects.length}
              </span>
            </div>
            <div className="space-y-3">
              {clientProjects.length === 0 ? (
                <div className="card p-6 text-center text-slate-400 text-sm">No client projects</div>
              ) : (
                clientProjects.map((p) => (
                  <ProjectCard key={p.id} project={p} onClick={() => nav(`/projects/${p.id}`)} />
                ))
              )}
            </div>
          </div>

          {/* Internal / Non-Client column */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-3 h-3 rounded-full bg-purple-500" />
              <h2 className="font-semibold text-slate-700 text-sm">
                Internal / Company &amp; Personal
              </h2>
              <span className="ml-auto badge bg-purple-50 text-purple-700 ring-purple-100">
                {internalProjects.length}
              </span>
            </div>
            <div className="space-y-3">
              {internalProjects.length === 0 ? (
                <div className="card p-6 text-center text-slate-400 text-sm">No internal projects</div>
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
        <div className="card overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                {["Name", "Category", "Status", "Members", "Tasks", "Start", "End"].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {allProjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400 text-sm">
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
