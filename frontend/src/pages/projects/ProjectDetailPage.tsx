import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Folder, Activity, Briefcase, CheckCircle, Search,
  SlidersHorizontal, Users, CheckSquare, Calendar,
  LayoutGrid, List, Loader2, Play, Square, Trash2, Edit2, Kanban
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge, PriorityBadge } from "@/components/Badges";
import { projectsApi } from "@/services/api";
import { tasksApi } from "@/services/featureApis";
import { DataTable, type Column } from "@/components/DataTable";
import type { Task, TaskPriority, TaskStatus } from "@/types";
import { formatDate } from "@/lib/format";
import { useAuth } from "@/features/auth/AuthProvider";
import { useTimeTracker } from "@/features/time/TimeTrackerContext";
import { LoadingPage } from "@/components/Loading";
import { ProjectFormModal } from "./ProjectFormPage";
import { TaskFormModal } from "../tasks/TaskFormPage";
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

export default function ProjectDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
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

  const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban");

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

  const formatSeconds = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const canEdit = user?.role === "admin" || user?.role === "manager";

  const cols: Column<Task>[] = [
    {
      key: "t",
      header: "Title",
      render: (t) => (
        <div className="flex flex-col">
          <Link
            className="font-semibold text-slate-900 dark:text-slate-100 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            to={`/tasks/${t.id}`}
          >
            {t.title}
          </Link>
        </div>
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
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-455 opacity-75"></span>
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
          <Tooltip content={
            <div className="flex flex-col text-left">
              <span className="font-semibold text-slate-100">{t.assignee.name}</span>
              <span className="text-slate-400 dark:text-slate-500 text-[9px] mt-0.5">{t.assignee.email}</span>
            </div>
          }>
            <div className="flex items-center gap-2">
              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs ${colorClass}`}>
                {initials}
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-350">{t.assignee.name}</span>
            </div>
          </Tooltip>
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

            {canEdit && (
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
                  className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded text-slate-505 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-405 transition-colors disabled:opacity-50 cursor-pointer"
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

  if (isLoading || !project) return <LoadingPage message="Loading Project..." />;

  return (
    <>
      <PageHeader title={project.name}
        description={project.description ?? undefined}
        actions={canEdit ? (
          <>
            <button className="btn-secondary" onClick={() => setProjectModalOpen(true)}>Edit</button>
            <button className="btn-secondary" onClick={() => nav(`/documents/generate?projectId=${project.id}`)}>Generate Doc</button>
            <button className="btn-secondary" onClick={() => nav(`/projects/${project.id}/edit`)}>Edit</button>
            <button className="btn-secondary" onClick={() => archive.mutate()} disabled={project.status === "archived" || archive.isPending}>
              <div className="flex items-center gap-2">
                <button className="btn-secondary hover:-translate-y-0.5 transform transition-all duration-205 cursor-pointer" onClick={() => setProjectModalOpen(true)}>Edit</button>
                <button className="btn-secondary hover:-translate-y-0.5 transform transition-all duration-205 cursor-pointer" onClick={() => archive.mutate()} disabled={project.status === "archived" || archive.isPending}>
                  {archive.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5 inline" />}
                  Archive
                </button>
              </div>
        ) : null}
      />

              {/* Info Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Card 1: Status */}
                <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-white/[0.06] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)] transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-brand-50 dark:bg-brand-500/10 rounded-xl text-brand-600 dark:text-brand-400">
                      <Activity className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status</p>
                      <div className="mt-1">
                        <StatusBadge kind="project" status={project.status} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2: Category */}
                <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-white/[0.06] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)] transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${project.category === "client" ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" : "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400"}`}>
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Category</p>
                      <div className="mt-1">
                        <span className={`badge text-[10px] font-bold ${project.category === "client" ? "bg-blue-50 dark:bg-blue-955/30 text-blue-700 dark:text-blue-450 border border-blue-200/50 dark:border-blue-900/30" : "bg-purple-50 dark:bg-purple-955/30 text-purple-700 dark:text-purple-455 border border-purple-200/50 dark:border-purple-900/30"}`}>
                          {project.category === "client" ? "Client Project" : "Internal Project"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 3: Start / End */}
                <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-white/[0.06] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)] transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Start / End</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                        {formatDate(project.startDate)} <span className="text-slate-300 dark:text-slate-700 font-normal">→</span> {formatDate(project.endDate)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card 4: Members */}
                <div className="relative rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-white/[0.06] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)] transition-all duration-300 col-span-1">
                  <div className="flex flex-col gap-1.5 h-full justify-center">
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-brand-500" />
                      <span>Project Members ({project.members?.length ?? 0})</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-0.5">
                      {project.members && project.members.length > 0 ? (
                        project.members.map((m) => {
                          const avatarColor = getAvatarColor(m.user.name);
                          const initials = getInitials(m.user.name);
                          return (
                            <Tooltip
                              key={m.id}
                              content={
                                <div className="flex flex-col text-left">
                                  <span className="font-semibold text-slate-100">{m.user.name}</span>
                                  <span className="text-slate-400 dark:text-slate-500 text-[9px] mt-0.5">{m.user.email}</span>
                                </div>
                              }
                            >
                              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs cursor-default ${avatarColor}`}>
                                {initials}
                              </div>
                            </Tooltip>
                          );
                        })
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-600 italic">No members</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tasks Header Section */}
              <div className="flex items-center justify-between mb-3 mt-6">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Tasks</h2>
                {canEdit && (
                  <button className="btn-primary shadow-glow-brand hover:-translate-y-0.5 active:translate-y-0 transform transition-all duration-200 cursor-pointer" onClick={() => {
                    setSelectedTaskId(null);
                    setTaskModalOpen(true);
                  }}>
                    New task
                  </button>
                )}
              </div>

              {/* View Toggle Bar */}
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex bg-slate-100 dark:bg-zinc-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-white/[0.08] shadow-xs">
                  <button
                    onClick={() => setViewMode("kanban")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${viewMode === "kanban"
                        ? "bg-white dark:bg-zinc-700 text-slate-800 dark:text-slate-100 shadow-xs font-bold"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                      }`}
                  >
                    <Kanban className="h-3.5 w-3.5" />
                    <span>Kanban Board</span>
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${viewMode === "list"
                        ? "bg-white dark:bg-zinc-700 text-slate-800 dark:text-slate-100 shadow-xs font-bold"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                      }`}
                  >
                    <List className="h-3.5 w-3.5" />
                    <span>List View</span>
                  </button>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-zinc-900 border border-slate-200/50 dark:border-white/[0.06] px-3 py-1 rounded-lg">
                  Filtered <span className="text-brand-600 dark:text-brand-400 font-bold">{tasks?.items?.length || 0}</span> tasks
                </div>
              </div>

              {viewMode === "list" ? (
                <DataTable rows={tasks?.items} columns={cols} rowKey={(t) => t.id} empty="No tasks in this project yet" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                  {boardColumns.map((col) => {
                    const colTasks = (tasks?.items ?? []).filter((t) => t.status === col.value);
                    return (
                      <div
                        key={col.value}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDrop(e, col.value)}
                        className="flex flex-col rounded-2xl p-4 bg-slate-50/40 dark:bg-zinc-900/30 border border-slate-200/60 dark:border-white/[0.04] min-h-[500px] transition-colors"
                      >
                        {/* Column Header */}
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/50 dark:border-white/[0.04]">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${col.value === "todo" ? "bg-slate-450 dark:bg-slate-500" :
                                col.value === "in_progress" ? "bg-blue-500" :
                                  col.value === "review" ? "bg-amber-500" : "bg-emerald-500"
                              }`} />
                            <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{col.label}</span>
                          </div>
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-zinc-855 px-2.5 py-0.5 rounded-full">
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
                                className={`relative group flex flex-col justify-between rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-white/[0.06] p-4 cursor-grab active:cursor-grabbing hover:-translate-y-0.5 transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.015)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] ${isCurrentTimer ? "ring-2 ring-amber-500 dark:ring-amber-550 shadow-[0_0_15px_rgba(245,158,11,0.15)] bg-amber-50/10 dark:bg-amber-950/5" : ""
                                  } ${isUpdatingStatus || isDeleting ? "opacity-60 pointer-events-none" : ""
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
                                      {project.name}
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
                                      <span className={`w-1.5 h-1.5 rounded-full ${t.priority === "low" ? "bg-slate-455 dark:bg-slate-500" :
                                          t.priority === "medium" ? "bg-sky-500" :
                                            t.priority === "high" ? "bg-amber-500" : "bg-rose-500"
                                        }`} />
                                      {t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}
                                    </span>

                                    {t.dueDate && (() => {
                                      const isOverdue = new Date(t.dueDate) < new Date() && t.status !== "done";
                                      return (
                                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${isOverdue
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
                                          <span className="text-slate-400 dark:text-slate-500 text-[9px] mt-0.5">{t.assignee.email}</span>
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
                                    <span className="text-[11px] text-slate-455 dark:text-slate-600 italic">Unassigned</span>
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

                                    {canEdit && (
                                      <div className="flex items-center gap-0.5 border-l border-slate-100 dark:border-white/[0.06] pl-1">
                                        <button
                                          className="p-0.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded text-slate-400 dark:text-slate-550 hover:text-slate-700 dark:hover:text-slate-350 transition-colors cursor-pointer"
                                          onClick={() => {
                                            setSelectedTaskId(t.id);
                                            setTaskModalOpen(true);
                                          }}
                                          title="Edit task"
                                        >
                                          <Edit2 className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                          className="p-0.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded text-slate-400 dark:text-slate-550 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
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

              <ProjectFormModal
                open={projectModalOpen}
                onClose={() => setProjectModalOpen(false)}
                projectId={project.id}
              />

              <TaskFormModal
                open={taskModalOpen}
                onClose={() => {
                  setTaskModalOpen(false);
                  setSelectedTaskId(null);
                }}
                taskId={selectedTaskId}
                projectId={project.id}
              />
            </>
            );
}
