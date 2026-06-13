import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { StatusBadge, PriorityBadge } from "@/components/Badges";
import { tasksApi } from "@/services/featureApis";
import { projectsApi, usersApi } from "@/services/api";
import type { Task, TaskPriority, TaskStatus } from "@/types";
import { formatDate } from "@/lib/format";
import { useAuth } from "@/features/auth/AuthProvider";

export default function TasksListPage() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [projectId, setProjectId] = useState("");
  const [status, setStatus] = useState<"" | TaskStatus>("");
  const [priority, setPriority] = useState<"" | TaskPriority>("");
  const [assignedTo, setAssignedTo] = useState("");

  const { data: projects } = useQuery({ queryKey: ["projects","all"], queryFn: () => projectsApi.list({ pageSize: 100 }) });
  const { data: users } = useQuery({ queryKey: ["users","all"], queryFn: () => usersApi.list({ pageSize: 100 }) });
  const { data, isLoading } = useQuery({
    queryKey: ["tasks", { projectId, status, priority, assignedTo }],
    queryFn: () => tasksApi.list({
      projectId: projectId || undefined, status: status || undefined,
      priority: priority || undefined, assignedTo: assignedTo || undefined, pageSize: 100,
    }),
  });

  const cols: Column<Task>[] = [
    { key: "t", header: "Title", render: (t) => <span className="font-medium text-slate-900">{t.title}</span> },
    { key: "proj", header: "Project", render: (t) => t.project?.name ?? "—" },
    { key: "s", header: "Status", render: (t) => <StatusBadge kind="task" status={t.status} /> },
    { key: "p", header: "Priority", render: (t) => <PriorityBadge priority={t.priority} /> },
    { key: "a", header: "Assignee", render: (t) => t.assignee?.name ?? "—" },
    { key: "d", header: "Due", render: (t) => formatDate(t.dueDate) },
  ];

  return (
    <>
      <PageHeader title="Tasks"
        actions={(user?.role === "admin" || user?.role === "manager") ?
          <button className="btn-primary" onClick={() => nav("/tasks/new")}>New task</button> : null} />
      <div className="mb-3 flex flex-wrap gap-2">
        <select className="input max-w-[200px]" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          <option value="">All projects</option>
          {projects?.items.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className="input max-w-[160px]" value={status} onChange={(e) => setStatus(e.target.value as TaskStatus | "")}>
          <option value="">All statuses</option>
          {(["todo","in_progress","review","done"] as TaskStatus[]).map((s) => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
        </select>
        <select className="input max-w-[160px]" value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority | "")}>
          <option value="">All priorities</option>
          {(["low","medium","high","critical"] as TaskPriority[]).map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="input max-w-[200px]" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
          <option value="">Any assignee</option>
          {users?.items.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>
      <DataTable rows={data?.items} loading={isLoading} columns={cols} rowKey={(t) => t.id} onRowClick={(t) => nav(`/tasks/${t.id}`)} />
    </>
  );
}
