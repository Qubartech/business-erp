import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/Badges";
import { projectsApi } from "@/services/api";
import type { Project, ProjectStatus } from "@/types";
import { formatDate } from "@/lib/format";
import { useAuth } from "@/features/auth/AuthProvider";

export default function ProjectsListPage() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | ProjectStatus>("");
  const { data, isLoading } = useQuery({
    queryKey: ["projects", search, status],
    queryFn: () => projectsApi.list({ search: search || undefined, status: status || undefined, pageSize: 50 }),
  });

  const cols: Column<Project>[] = [
    { key: "name", header: "Name", render: (p) => <span className="font-medium text-slate-900">{p.name}</span> },
    { key: "status", header: "Status", render: (p) => <StatusBadge kind="project" status={p.status} /> },
    { key: "members", header: "Members", render: (p) => p.members?.length ?? 0 },
    { key: "tasks", header: "Tasks", render: (p) => p._count?.tasks ?? 0 },
    { key: "start", header: "Start", render: (p) => formatDate(p.startDate) },
    { key: "end", header: "End", render: (p) => formatDate(p.endDate) },
  ];

  return (
    <>
      <PageHeader title="Projects"
        actions={
          (user?.role === "admin" || user?.role === "manager") ?
          <button className="btn-primary" onClick={() => nav("/projects/new")}>New project</button> : null
        }
      />
      <div className="mb-3 flex gap-2 flex-wrap">
        <input className="input max-w-sm" placeholder="Search projects" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input max-w-[180px]" value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus | "")}>
          <option value="">All statuses</option>
          {(["draft","active","on_hold","completed","archived"] as ProjectStatus[]).map((s) =>
            <option key={s} value={s}>{s.replace("_"," ")}</option>)}
        </select>
      </div>
      <DataTable rows={data?.items} loading={isLoading} columns={cols} rowKey={(p) => p.id} onRowClick={(p) => nav(`/projects/${p.id}`)} />
    </>
  );
}
