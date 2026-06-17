import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTimeTracker } from "@/features/time/TimeTrackerContext";
import { 
  Loader2, Play, Square, Trash2, Edit2, 
  ClipboardList, Activity, AlertTriangle, CheckCircle, 
  Folder, SlidersHorizontal, AlertCircle, User, Calendar, List, Kanban 
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { StatusBadge, PriorityBadge } from "@/components/Badges";
import { tasksApi } from "@/services/featureApis";
import { projectsApi, usersApi } from "@/services/api";
import type { Task, TaskPriority, TaskStatus } from "@/types";
import { formatDate } from "@/lib/format";
import { useAuth } from "@/features/auth/AuthProvider";
import { LoadingPage } from "@/components/Loading";
import { TaskFormModal } from "./TaskFormPage";
import { Tooltip } from "@/components/Tooltip";

const getAvatarColor = (name: string) => {
  const colors = [
    "bg-indigo-500 text-white",
    "bg-emerald-500 text-white",
    "bg-sky-500 text-white",
    "bg-amber-500 text-white",
    "bg-rose-500 text-white",
    "bg-violet-500 text-white",
    "bg-pink-500 text-white",
    "bg-teal-500 text-white",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

export default function TasksListPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const canManage = user?.role === "admin" || user?.role === "manager";
  const [projectId, setProjectId] = useState("");
  const [status, setStatus] = useState<"" | TaskStatus>("");
  const [priority, setPriority] = useState<"" | TaskPriority>("");
  const [assignedTo, setAssignedTo] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban");
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

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
    {
      key: "t",
      header: "Title",
      render: (t) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {t.title}
          </span>
          {t.project && (
            <span className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 sm:hidden mt-0.5">
              {t.project.name}
            </span>
          )}
        </div>
      )
    },
    {
      key: "proj",
      header: "Project",
      render: (t) => (
        t.project ? (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-brand-50/50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-350 text-xs font-semibold">
            <Folder className="h-3.5 w-3.5" />
            {t.project.name}
          </span>
        ) : (
          <span className="text-slate-400 dark:text-slate-655">—</span>
        )
      )
    },
    { key: "s", header: "Status", render: (t) => <StatusBadge kind="task" status={t.status} /> },
    {
      key: "p",
      header: "Priority",
      render: (t) => {
        const priorityColors: Record<TaskPriority, { bg: string; dot: string }> = {
          low: { bg: "bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400", dot: "bg-slate-400" },
          medium: { bg: "bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400", dot: "bg-sky-500" },
          high: { bg: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400", dot: "bg-amber-500" },
          critical: { bg: "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400", dot: "bg-rose-500" }
        };
        const config = priorityColors[t.priority] || priorityColors.low;
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ring-slate-200 dark:ring-white/[0.08] ${config.bg}`}>
            <span className="relative flex h-2 w-2">
              {t.priority === "critical" && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-450 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot}`}></span>
            </span>
            <span>{t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}</span>
          </span>
        );
      }
    },
    {
      key: "a",
      header: "Assignee",
      render: (t) => {
        if (!t.assignee) return <span className="text-slate-450 dark:text-slate-600 italic text-xs">Unassigned</span>;
        const colorClass = getAvatarColor(t.assignee.name);
        const initials = getInitials(t.assignee.name);
        return (
          <div className="flex items-center gap-2">
            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs ${colorClass}`}>
              {initials}
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-350">{t.assignee.name}</span>
          </div>
        );
      }
    },
    {
      key: "d",
      header: "Due",
      render: (t) => {
        if (!t.dueDate) return <span className="text-slate-400 dark:text-slate-655">—</span>;
        const isOverdue = new Date(t.dueDate) < new Date() && t.status !== "done";
        return (
          <span className={`inline-flex items-center gap-1 text-xs font-medium ${isOverdue ? "text-rose-600 dark:text-rose-450 font-semibold" : "text-slate-600 dark:text-slate-400"}`}>
            <Calendar className="h-3.5 w-3.5 opacity-70" />
            <span>{formatDate(t.dueDate)}</span>
            {isOverdue && <span className="text-[9px] px-1 bg-rose-50 dark:bg-rose-950/20 text-rose-650 dark:text-rose-400 rounded-md border border-rose-200 dark:border-rose-900/30 ml-1">Overdue</span>}
          </span>
        );
      }
    },
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
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-mono font-bold cursor-pointer transition-all duration-300 shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 animate-pulse"
                title="Stop timer"
              >
                {isTimerActionPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                ) : (
                  <Square className="h-3 w-3 fill-white text-white" />
                )}
                <span className="ml-1">{formatSeconds(sprintRemaining)}</span>
              </button>
            ) : (
              <button
                onClick={() => startTimer(t.id)}
                disabled={isTimerActionPending}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20"
                title="Start timer"
              >
                {isThisTaskStarting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                ) : (
                  <Play className="h-3 w-3 fill-white text-white" />
                )}
                <span>Start</span>
              </button>
            )}

            {canManage && (
              <>
                <button
                  className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedTaskId(t.id);
                    setTaskModalOpen(true);
                  }}
                  title="Edit task"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded text-slate-500 dark:text-slate-450 hover:text-rose-600 dark:hover:text-rose-405 transition-colors disabled:opacity-50 cursor-pointer"
                  disabled={isDeleting}
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete this task?")) {
                      removeTask.mutate(t.id);
                    }
                  }}
                  title="Delete task"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
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
  const tasksList = data?.items ?? [];
  const totalTasks = tasksList.length;
  const inProgressTasks = tasksList.filter((t) => t.status === "in_progress").length;
  const highPriorityTasks = tasksList.filter((t) => t.priority === "high" || t.priority === "critical").length;
  const completedTasks = tasksList.filter((t) => t.status === "done").length;

  return (
    <>
      <PageHeader
        title="Tasks"
        actions={
          (user?.role === "admin" || user?.role === "manager") ? (
            <button
              className="btn-primary shadow-glow-brand hover:-translate-y-0.5 active:translate-y-0 transform transition-all duration-200 cursor-pointer"
              onClick={() => {
                setSelectedTaskId(null);
                setTaskModalOpen(true);
              }}
            >
              New task
            </button>
          ) : null
        }
      />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Total Tasks */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-white/[0.06] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)] transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-bl-full transition-all duration-300 group-hover:scale-110" />
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-50 dark:bg-brand-500/10 rounded-xl text-brand-600 dark:text-brand-400">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Tasks</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400 mt-1" />
                ) : (
                  totalTasks
                )}
              </h3>
            </div>
          </div>
        </div>

        {/* Card 2: In Progress */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-white/[0.06] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)] transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full transition-all duration-300 group-hover:scale-110" />
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
              <Activity className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">In Progress</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400 mt-1" />
                ) : (
                  inProgressTasks
                )}
              </h3>
            </div>
          </div>
        </div>

        {/* Card 3: High Priority */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-white/[0.06] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)] transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-bl-full transition-all duration-300 group-hover:scale-110" />
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-xl text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Urgent/High</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400 mt-1" />
                ) : (
                  highPriorityTasks
                )}
              </h3>
            </div>
          </div>
        </div>

        {/* Card 4: Completed */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-white/[0.06] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)] transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full transition-all duration-300 group-hover:scale-110" />
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Completed</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400 mt-1" />
                ) : (
                  completedTasks
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
            <span>Filter Tasks</span>
          </div>
          {(projectId || status || priority || assignedTo) && (
            <button
              onClick={() => {
                setProjectId("");
                setStatus("");
                setPriority("");
                setAssignedTo("");
              }}
              className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-350 font-semibold hover:underline cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Project Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <Folder className="h-4 w-4" />
            </div>
            <select
              className="input pl-9 w-full appearance-none cursor-pointer bg-no-repeat bg-[right_10px_center]"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              <option value="">All Projects</option>
              {projects?.items.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <CheckCircle className="h-4 w-4" />
            </div>
            <select
              className="input pl-9 w-full appearance-none cursor-pointer"
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus | "")}
            >
              <option value="">All Statuses</option>
              {(["todo", "in_progress", "review", "done"] as TaskStatus[]).map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <AlertCircle className="h-4 w-4" />
            </div>
            <select
              className="input pl-9 w-full appearance-none cursor-pointer"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority | "")}
            >
              <option value="">All Priorities</option>
              {(["low", "medium", "high", "critical"] as TaskPriority[]).map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Assignee Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <User className="h-4 w-4" />
            </div>
            <select
              className="input pl-9 w-full appearance-none cursor-pointer"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
            >
              <option value="">Any Assignee</option>
              {users?.items.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
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
            onClick={() => setViewMode("kanban")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              viewMode === "kanban"
                ? "bg-white dark:bg-zinc-700 text-slate-800 dark:text-slate-100 shadow-xs font-bold"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <Kanban className="h-3.5 w-3.5" />
            <span>Kanban Board</span>
          </button>
          <button
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
          Filtered <span className="text-brand-600 dark:text-brand-400 font-bold">{tasksList.length}</span> tasks
        </div>
      </div>

      {viewMode === "list" ? (
        <DataTable rows={data?.items} loading={isLoading} columns={cols} rowKey={(t) => t.id} onRowClick={(t) => nav(`/tasks/${t.id}`)} />
      ) : isLoading ? (
        <LoadingPage message="Loading Kanban Board..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
          {boardColumns.map((col) => {
            const colTasks = (data?.items ?? []).filter((t) => t.status === col.value);
            return (
              <div
                key={col.value}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, col.value)}
                className="flex flex-col rounded-2xl p-4 bg-slate-50/40 dark:bg-zinc-900/30 border border-slate-200/60 dark:border-white/[0.04] min-h-[600px] transition-colors"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/50 dark:border-white/[0.04]">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      col.value === "todo" ? "bg-slate-450 dark:bg-slate-500" :
                      col.value === "in_progress" ? "bg-blue-500" :
                      col.value === "review" ? "bg-amber-500" : "bg-emerald-500"
                    }`} />
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{col.label}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-zinc-850 px-2.5 py-0.5 rounded-full">
                    {colTasks.length}
                  </span>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto">
                  {colTasks.map((t) => {
                    const isCurrentTimer = currentTimer?.taskId === t.id;
                    const isDeleting = removeTask.isPending && removeTask.variables === t.id;
                    const isUpdatingStatus = updateTaskStatus.isPending && updateTaskStatus.variables?.id === t.id;
                    const isThisTaskStarting = isTimerActionPending && startTimerVariables === t.id;
                    
                    const priorityBarColor = {
                      low: "bg-slate-300 dark:bg-slate-700",
                      medium: "bg-sky-500",
                      high: "bg-amber-500",
                      critical: "bg-rose-500"
                    }[t.priority] || "bg-slate-300";

                    return (
                      <div
                        key={t.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, t.id)}
                        onClick={() => nav(`/tasks/${t.id}`)}
                        className={`relative group flex flex-col justify-between rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-white/[0.06] p-4 cursor-grab active:cursor-grabbing hover:-translate-y-0.5 transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.015)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] ${
                          isCurrentTimer ? "ring-2 ring-amber-500 dark:ring-amber-550 shadow-[0_0_15px_rgba(245,158,11,0.15)] bg-amber-50/10 dark:bg-amber-950/5" : ""
                        } ${
                          isUpdatingStatus || isDeleting ? "opacity-60 pointer-events-none" : ""
                        }`}
                      >
                        {/* Left Priority Strip */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${priorityBarColor}`} />

                        {/* Status overlays */}
                        {(isUpdatingStatus || isDeleting) && (
                          <div className="absolute inset-0 bg-white/50 dark:bg-zinc-900/50 flex items-center justify-center rounded-xl">
                            <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
                          </div>
                        )}
                        
                        <div className="pl-1">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[10px] text-brand-600 dark:text-brand-400 font-bold tracking-wider uppercase truncate">
                              {t.project?.name ?? "No Project"}
                            </span>
                            
                            {/* Critical priority ping */}
                            {t.priority === "critical" && (
                              <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-450 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                              </span>
                            )}
                          </div>
                          
                          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug mb-3 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors break-words">
                            {t.title}
                          </h4>
                          
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-650 dark:text-slate-350 bg-slate-100 dark:bg-zinc-850 px-2 py-0.5 rounded-full border border-slate-200/50 dark:border-white/[0.04]">
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                t.priority === "low" ? "bg-slate-455 dark:bg-slate-500" :
                                t.priority === "medium" ? "bg-sky-500" :
                                t.priority === "high" ? "bg-amber-500" : "bg-rose-500"
                              }`} />
                              {t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}
                            </span>

                            {t.dueDate && (() => {
                              const isOverdue = new Date(t.dueDate) < new Date() && t.status !== "done";
                              return (
                                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                  isOverdue 
                                    ? "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border-rose-205 dark:border-rose-900/30 font-bold" 
                                    : "text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-zinc-850 border-slate-200/50 dark:border-white/[0.04]"
                                }`}>
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatDate(t.dueDate)}</span>
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                        
                        {/* Footer details */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/[0.06] gap-2 pl-1">
                          {t.assignee ? (() => {
                            const colorClass = getAvatarColor(t.assignee.name);
                            const initials = getInitials(t.assignee.name);
                            return (
                              <Tooltip content={
                                <div className="flex flex-col text-left">
                                  <span className="font-semibold text-slate-100">{t.assignee.name}</span>
                                  {t.assignee.email && (
                                    <span className="text-slate-400 dark:text-slate-500 text-[9px] mt-0.5">{t.assignee.email}</span>
                                  )}
                                </div>
                              }>
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold shadow-xs ${colorClass}`}>
                                    {initials}
                                  </div>
                                  <span className="text-xs text-slate-600 dark:text-slate-455 font-medium truncate max-w-[85px]">
                                    {t.assignee.name}
                                  </span>
                                </div>
                              </Tooltip>
                            );
                          })() : (
                            <span className="text-[11px] text-slate-450 dark:text-slate-600 italic">Unassigned</span>
                          )}
                          
                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {isCurrentTimer ? (
                              <button
                                onClick={stopTimer}
                                disabled={isTimerActionPending}
                                className="flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-655 text-white rounded-md text-[10px] font-mono font-bold cursor-pointer transition-colors animate-pulse"
                                title="Stop timer"
                              >
                                {isTimerActionPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin text-white" />
                                ) : (
                                  <Square className="h-2.5 w-2.5 fill-white text-white" />
                                )}
                                <span>{formatSeconds(sprintRemaining)}</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => startTimer(t.id)}
                                disabled={isTimerActionPending}
                                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500 hover:bg-emerald-655 text-white rounded-md text-[10px] font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title="Start timer"
                              >
                                {isThisTaskStarting ? (
                                  <Loader2 className="h-3 w-3 animate-spin text-white" />
                                ) : (
                                  <Play className="h-2.5 w-2.5 fill-white text-white" />
                                )}
                                <span>Start</span>
                              </button>
                            )}
                            
                            {canManage && (
                              <div className="flex items-center gap-0.5 border-l border-slate-100 dark:border-white/[0.06] pl-1">
                                <button
                                  className="p-0.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 transition-colors cursor-pointer"
                                  onClick={() => {
                                    setSelectedTaskId(t.id);
                                    setTaskModalOpen(true);
                                  }}
                                  title="Edit task"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  className="p-0.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                                  onClick={() => {
                                    if (window.confirm("Are you sure you want to delete this task?")) {
                                      removeTask.mutate(t.id);
                                    }
                                  }}
                                  title="Delete task"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {colTasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-zinc-850 rounded-2xl p-6 text-slate-400 dark:text-slate-600 text-xs italic text-center h-28">
                      Drag tasks here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TaskFormModal 
        open={taskModalOpen} 
        onClose={() => {
          setTaskModalOpen(false);
          setSelectedTaskId(null);
        }} 
        taskId={selectedTaskId} 
      />
    </>
  );
}
