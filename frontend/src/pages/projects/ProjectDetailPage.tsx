import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge, PriorityBadge } from "@/components/Badges";
import { projectsApi } from "@/services/api";
import { tasksApi } from "@/services/featureApis";
import { DataTable, type Column } from "@/components/DataTable";
import type { Task } from "@/types";
import { formatDate } from "@/lib/format";
import { useAuth } from "@/features/auth/AuthProvider";
import { Loader2 } from "lucide-react";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: project, isLoading } = useQuery({ queryKey: ["projects", id], queryFn: () => projectsApi.get(id!), enabled: !!id });
  const { data: tasks } = useQuery({ queryKey: ["tasks", { projectId: id }], queryFn: () => tasksApi.list({ projectId: id, pageSize: 100 }), enabled: !!id });

  const archive = useMutation({
    mutationFn: () => projectsApi.archive(id!),
    onSuccess: () => { toast.success("Archived"); qc.invalidateQueries({ queryKey: ["projects"] }); },
  });

  const cols: Column<Task>[] = [
    { key: "t", header: "Title", render: (t) => <Link className="font-medium text-brand-700 hover:underline" to={`/tasks/${t.id}`}>{t.title}</Link> },
    { key: "s", header: "Status", render: (t) => <StatusBadge kind="task" status={t.status} /> },
    { key: "p", header: "Priority", render: (t) => <PriorityBadge priority={t.priority} /> },
    { key: "a", header: "Assignee", render: (t) => t.assignee?.name ?? "—" },
    { key: "d", header: "Due", render: (t) => formatDate(t.dueDate) },
  ];

  if (isLoading || !project) return <div className="text-sm text-slate-500">Loading…</div>;
  const canEdit = user?.role === "admin" || user?.role === "manager";

  return (
    <>
      <PageHeader title={project.name}
        description={project.description ?? undefined}
        actions={canEdit ? (
          <>
            <button className="btn-secondary" onClick={() => nav(`/projects/${project.id}/edit`)}>Edit</button>
            <button className="btn-secondary" onClick={() => archive.mutate()} disabled={project.status === "archived" || archive.isPending}>
              {archive.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5 inline" />}
              Archive
            </button>
          </>
        ) : null}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card p-4"><div className="text-xs text-slate-500">Status</div><div className="mt-2"><StatusBadge kind="project" status={project.status} /></div></div>
        <div className="card p-4"><div className="text-xs text-slate-500">Start / End</div><div className="mt-2 text-sm">{formatDate(project.startDate)} → {formatDate(project.endDate)}</div></div>
        <div className="card p-4"><div className="text-xs text-slate-500">Members</div><div className="mt-2 text-sm">{project.members?.map(m => m.user.name).join(", ") || "—"}</div></div>
      </div>
      <h2 className="text-lg font-medium mb-2">Tasks</h2>
      <DataTable rows={tasks?.items} columns={cols} rowKey={(t) => t.id} empty="No tasks in this project yet" />
    </>
  );
}
