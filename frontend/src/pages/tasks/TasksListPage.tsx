import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTimeTracker } from "@/features/time/TimeTrackerContext";
import { Loader2, Play, Square, Trash2, Edit2 } from "lucide-react";
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
  const qc = useQueryClient();
  const { user } = useAuth();
  const canManage = user?.role === "admin" || user?.role === "manager";
  const [projectId, setProjectId] = useState("");
  const [status, setStatus] = useState<"" | TaskStatus>("");
  const [priority, setPriority] = useState<"" | TaskPriority>("");
  const [assignedTo, setAssignedTo] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");

  const { data: projects } = useQuery({ queryKey: ["projects","all"], queryFn: () => projectsApi.list({ pageSize: 100 }) });
  const { data: users } = useQuery({ queryKey: ["users","all"], queryFn: () => usersApi.list({ pageSize: 100 }) });
  const { data, isLoading } = useQuery({
    queryKey: ["tasks", { projectId, status, priority, assignedTo }],
    queryFn: () => tasksApi.list({
      projectId: projectId || undefined, status: status || undefined,
      priority: priority || undefined, assignedTo: assignedTo || undefined, pageSize: 100,
    }),
  });

  const updateTaskStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => tasksApi.update(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
  };

  const handleDrop = (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) {
      updateTaskStatus.mutate({ id: taskId, status: newStatus });
    }
  };

  const boardColumns: { value: TaskStatus; label: string; border: string; bg: string }[] = [
    { value: "todo", label: "Todo", border: "border-t-slate-400", bg: "bg-slate-50/50" },
    { value: "in_progress", label: "In Progress", border: "border-t-blue-500", bg: "bg-blue-50/10" },
    { value: "review", label: "Review", border: "border-t-amber-500", bg: "bg-amber-50/10" },
    { value: "done", label: "Done", border: "border-t-emerald-500", bg: "bg-emerald-50/10" },
  ];

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
    { key: "t", header: "Title", render: (t) => <span className="font-medium text-slate-900">{t.title}</span> },
    { key: "proj", header: "Project", render: (t) => t.project?.name ?? "—" },
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

            {canManage && (
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

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {/* Toggle between list and kanban */}
        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              viewMode === "list"
                ? "bg-white text-slate-800 shadow-xs font-bold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setViewMode("kanban")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              viewMode === "kanban"
                ? "bg-white text-slate-800 shadow-xs font-bold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Kanban Board
          </button>
        </div>
      </div>

      {viewMode === "list" ? (
        <DataTable rows={data?.items} loading={isLoading} columns={cols} rowKey={(t) => t.id} onRowClick={(t) => nav(`/tasks/${t.id}`)} />
      ) : isLoading ? (
        <div className="text-sm text-slate-500">Loading Kanban Board...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {boardColumns.map((col) => {
            const colTasks = (data?.items ?? []).filter((t) => t.status === col.value);
            return (
              <div
                key={col.value}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, col.value)}
                className={`flex flex-col rounded-xl p-3 border border-slate-200 border-t-4 ${col.border} ${col.bg} min-h-[500px]`}
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="font-semibold text-sm text-slate-700">{col.label}</span>
                  <span className="text-xs font-bold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                    {colTasks.length}
                  </span>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto">
                  {colTasks.map((t) => {
                    const isCurrentTimer = currentTimer?.taskId === t.id;
                    const isDeleting = removeTask.isPending && removeTask.variables === t.id;
                    const isUpdatingStatus = updateTaskStatus.isPending && updateTaskStatus.variables?.id === t.id;
                    const isThisTaskStarting = isTimerActionPending && startTimerVariables === t.id;
                    
                    return (
                      <div
                        key={t.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, t.id)}
                        onClick={() => nav(`/tasks/${t.id}`)}
                        className={`card p-4 bg-white hover:border-slate-300 hover:shadow-md cursor-grab active:cursor-grabbing transition-all relative group overflow-hidden ${
                          isUpdatingStatus || isDeleting ? "opacity-60 pointer-events-none" : ""
                        }`}
                      >
                        {(isUpdatingStatus || isDeleting) && (
                          <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
                          </div>
                        )}
                        
                        <div className="text-xs text-brand-600 font-semibold mb-1 truncate">
                          {t.project?.name ?? "No Project"}
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm leading-snug mb-2 group-hover:text-brand-700 transition-colors break-words">
                          {t.title}
                        </h4>
                        
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          <PriorityBadge priority={t.priority} />
                          {t.dueDate && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                              Due: {formatDate(t.dueDate)}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
                          <span className="text-xs text-slate-500 font-medium truncate max-w-[80px]">
                            {t.assignee?.name ?? "Unassigned"}
                          </span>
                          
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            {isCurrentTimer ? (
                              <button
                                onClick={stopTimer}
                                disabled={isTimerActionPending}
                                className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 hover:bg-amber-200 rounded text-[10px] font-mono font-bold cursor-pointer transition-colors"
                                title="Stop timer"
                              >
                                {isTimerActionPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin text-amber-800" />
                                ) : (
                                  <Square className="h-2.5 w-2.5 fill-amber-800 text-amber-800" />
                                )}
                                <span>{formatSeconds(sprintRemaining)}</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => startTimer(t.id)}
                                disabled={isTimerActionPending}
                                className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 active:bg-emerald-200 rounded text-[10px] font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title="Start timer"
                              >
                                {isThisTaskStarting ? (
                                  <Loader2 className="h-3 w-3 animate-spin text-emerald-700" />
                                ) : (
                                  <Play className="h-2.5 w-2.5 fill-emerald-700 text-emerald-700" />
                                )}
                                <span>Start</span>
                              </button>
                            )}
                            
                            {canManage && (
                              <>
                                <button
                                  className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                                  onClick={() => nav(`/tasks/${t.id}/edit`)}
                                  title="Edit task"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  className="p-0.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                                  onClick={() => {
                                    if (window.confirm("Are you sure you want to delete this task?")) {
                                      removeTask.mutate(t.id);
                                    }
                                  }}
                                  title="Delete task"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {colTasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-6 text-slate-400 text-xs italic text-center h-28">
                      Drag tasks here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
