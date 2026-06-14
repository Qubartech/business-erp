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
import { Loader2, Play, Square, Trash2, Edit2 } from "lucide-react";
import { useTimeTracker } from "@/features/time/TimeTrackerContext";

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

  const { currentTimer, startTimer, stopTimer, isTimerActionPending, sprintRemaining, startTimerVariables } = useTimeTracker();

  const removeTask = useMutation({
    mutationFn: (taskId: string) => tasksApi.remove(taskId),
    onSuccess: () => {
      toast.success("Task deleted");
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const formatSeconds = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const cols: Column<Task>[] = [
    { key: "t", header: "Title", render: (t) => <Link className="font-medium text-brand-700 hover:underline" to={`/tasks/${t.id}`}>{t.title}</Link> },
    { key: "s", header: "Status", render: (t) => <StatusBadge kind="task" status={t.status} /> },
    { key: "p", header: "Priority", render: (t) => <PriorityBadge priority={t.priority} /> },
    { key: "a", header: "Assignee", render: (t) => t.assignee?.name ?? "—" },
    { key: "d", header: "Due", render: (t) => formatDate(t.dueDate) },
    {
      key: "actions",
      header: "Actions",
      render: (t) => {
        const isCurrentTimer = currentTimer?.taskId === t.id;
        const isDeleting = removeTask.isPending && removeTask.variables === t.id;
        const isThisTaskStarting = isTimerActionPending && startTimerVariables === t.id;
        return (
          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            {isCurrentTimer ? (
              <button
                onClick={stopTimer}
                disabled={isTimerActionPending}
                className="flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 hover:bg-amber-200 active:bg-amber-300 rounded text-xs font-mono font-bold cursor-pointer transition-colors"
                title="Stop timer"
              >
                {isTimerActionPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-800" />
                ) : (
                  <Square className="h-3 w-3 fill-amber-800 text-amber-800" />
                )}
                <span className="ml-1">{formatSeconds(sprintRemaining)}</span>
              </button>
            ) : (
              <button
                onClick={() => startTimer(t.id)}
                disabled={isTimerActionPending}
                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 active:bg-emerald-200 rounded text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Start timer"
              >
                {isThisTaskStarting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-700" />
                ) : (
                  <Play className="h-3 w-3 fill-emerald-700 text-emerald-700" />
                )}
                <span>Start</span>
              </button>
            )}

            {canEdit && (
              <>
                <button
                  className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  onClick={() => nav(`/tasks/${t.id}/edit`)}
                  title="Edit task"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  className="p-1 hover:bg-red-50 rounded text-red-500 hover:text-red-700 transition-colors disabled:opacity-50 cursor-pointer"
                  disabled={isDeleting}
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete this task?")) {
                      removeTask.mutate(t.id);
                    }
                  }}
                  title="Delete task"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </>
            )}
          </div>
        );
      },
      className: "text-right"
    }
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
      <div className="flex items-center justify-between mb-2 mt-6">
        <h2 className="text-lg font-medium">Tasks</h2>
        {canEdit && (
          <button className="btn-primary" onClick={() => nav(`/tasks/new?projectId=${project.id}`)}>
            New task
          </button>
        )}
      </div>
      <DataTable rows={tasks?.items} columns={cols} rowKey={(t) => t.id} empty="No tasks in this project yet" />
    </>
  );
}
