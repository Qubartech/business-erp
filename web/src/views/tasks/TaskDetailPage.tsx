"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  Loader2, ChevronLeft, Calendar, User, Edit2, Trash2, 
  Play, Square, Activity, SlidersHorizontal, ClipboardList 
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge, PriorityBadge } from "@/components/Badges";
import { tasksApi } from "@/services/featureApis";
import type { TaskPriority, TaskStatus } from "@/types";
import { formatDate } from "@/lib/format";
import { useAuth } from "@/features/auth/AuthProvider";
import { LoadingPage } from "@/components/Loading";
import { TaskFormModal } from "./TaskFormPage";
import { useTimeTracker } from "@/features/time/TimeTrackerContext";
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

export default function TaskDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : undefined;
  const router = useRouter(); const nav = (path: any) => { if (path === -1) router.back(); else router.push(path); };
  const qc = useQueryClient();
  const { user } = useAuth();
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const { data: task, isLoading } = useQuery({ queryKey: ["tasks", id], queryFn: () => tasksApi.get(id!), enabled: !!id });

  const { currentTimer, startTimer, stopTimer, isTimerActionPending, sprintRemaining, startTimerVariables } = useTimeTracker();

  const update = useMutation({
    mutationFn: (patch: Partial<{ status: TaskStatus; priority: TaskPriority }>) => tasksApi.update(id!, patch),
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["tasks"] }); },
  });

  const remove = useMutation({
    mutationFn: () => tasksApi.remove(id!),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["tasks"] }); nav("/tasks"); },
  });

  if (isLoading || !task) return <LoadingPage message="Loading Task..." />;
  const canManage = user?.role === "admin" || user?.role === "manager";

  const formatSeconds = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const isCurrentTimer = currentTimer?.taskId === task.id;
  const isThisTaskStarting = isTimerActionPending && startTimerVariables === task.id;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";

  const assigneeColor = task.assignee ? getAvatarColor(task.assignee.name) : "";
  const assigneeInitials = task.assignee ? getInitials(task.assignee.name) : "";

  return (
    <>
      {/* Back Link */}
      <Link 
        href="/tasks" 
        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors mb-4 group"
      >
        <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        <span>Back to tasks</span>
      </Link>

      <PageHeader 
        title={task.title} 
        description={task.project ? `Project: ${task.project.name}` : undefined}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {isCurrentTimer ? (
              <button
                onClick={stopTimer}
                disabled={isTimerActionPending}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-sm font-mono font-bold cursor-pointer transition-all duration-300 shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 animate-pulse"
                title="Stop timer"
              >
                {isTimerActionPending ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <Square className="h-3.5 w-3.5 fill-white text-white" />
                )}
                <span className="ml-1">{formatSeconds(sprintRemaining)}</span>
              </button>
            ) : (
              <button
                onClick={() => startTimer(task.id)}
                disabled={isTimerActionPending}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md text-sm font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20"
                title="Start timer"
              >
                {isThisTaskStarting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <Play className="h-3.5 w-3.5 fill-white text-white" />
                )}
                <span>Start timer</span>
              </button>
            )}

            {canManage && (
              <>
                <button
                  className="btn-secondary flex items-center gap-1.5 hover:-translate-y-0.5 transform transition-all duration-200 cursor-pointer"
                  disabled={isTimerActionPending || remove.isPending}
                  onClick={() => setTaskModalOpen(true)}
                >
                  <Edit2 className="h-4 w-4" />
                  <span>Edit</span>
                </button>
                <button
                  className="btn-danger flex items-center gap-1.5 hover:-translate-y-0.5 transform transition-all duration-200 cursor-pointer"
                  disabled={isTimerActionPending || remove.isPending}
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete this task?")) {
                      remove.mutate();
                    }
                  }}
                >
                  {remove.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5 inline" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  <span>Delete</span>
                </button>
              </>
            )}
          </div>
        }
      />

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {/* Card 1: Status */}
        <div className="card-premium p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
                <Activity className="h-4 w-4" />
              </div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status</p>
            </div>
            <div className="mt-1 mb-4">
              <StatusBadge kind="task" status={task.status} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide block mb-1.5">Change Status</label>
            <div className="relative">
              <select
                value={task.status}
                disabled={update.isPending}
                onChange={(e) => update.mutate({ status: e.target.value as TaskStatus })}
                className="w-full bg-slate-50 dark:bg-zinc-800/85 text-slate-700 dark:text-slate-200 rounded-xl px-3.5 py-2 text-sm font-semibold border border-slate-200 dark:border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all cursor-pointer"
              >
                <option value="todo">Todo</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>
        </div>

        {/* Card 2: Priority */}
        <div className="card-premium p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg text-amber-600 dark:text-amber-400">
                <SlidersHorizontal className="h-4 w-4" />
              </div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Priority</p>
            </div>
            <div className="mt-1 mb-4">
              <PriorityBadge priority={task.priority} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide block mb-1.5">Change Priority</label>
            <div className="relative">
              <select
                value={task.priority}
                disabled={update.isPending}
                onChange={(e) => update.mutate({ priority: e.target.value as TaskPriority })}
                className="w-full bg-slate-50 dark:bg-zinc-800/85 text-slate-700 dark:text-slate-200 rounded-xl px-3.5 py-2 text-sm font-semibold border border-slate-200 dark:border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all cursor-pointer"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
        </div>

        {/* Card 3: Assignee & Due Date */}
        <div className="card-premium p-5 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-50 dark:bg-purple-500/10 rounded-lg text-purple-600 dark:text-purple-400">
              <User className="h-4 w-4" />
            </div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Assignee & Due Date</p>
          </div>

          <div className="space-y-4">
            {/* Assignee info */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide block mb-1">Assignee</span>
              {task.assignee ? (
                <Tooltip content={
                  <div className="flex flex-col text-left">
                    <span className="font-semibold text-slate-100">{task.assignee.name}</span>
                    <span className="text-slate-400 dark:text-slate-500 text-[9px] mt-0.5">{task.assignee.email}</span>
                  </div>
                }>
                  <div className="flex items-center gap-2 mt-1 cursor-default">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs ${assigneeColor}`}>
                      {assigneeInitials}
                    </div>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{task.assignee.name}</span>
                  </div>
                </Tooltip>
              ) : (
                <span className="text-xs text-slate-450 dark:text-slate-500 italic mt-1 block">Unassigned</span>
              )}
            </div>

            {/* Due date info */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide block mb-1">Due Date</span>
              {task.dueDate ? (
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                    isOverdue 
                      ? "text-rose-600 dark:text-rose-450 bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30 font-bold" 
                      : "text-slate-600 dark:text-slate-350 bg-slate-50 dark:bg-zinc-800/80 border-slate-200 dark:border-white/[0.08]"
                  }`}>
                    <Calendar className="h-3.5 w-3.5 opacity-70" />
                    <span>{formatDate(task.dueDate)}</span>
                    {isOverdue && <span className="text-[9px] px-1 bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 rounded-md ml-1 border border-rose-200/50">Overdue</span>}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-slate-400 dark:text-slate-500 italic mt-1 block">No due date</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Description Card */}
      <div className="card-premium p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400">
            <ClipboardList className="h-4 w-4" />
          </div>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Description</p>
        </div>
        {task.description ? (
          <div className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap bg-slate-50/50 dark:bg-zinc-800/30 rounded-xl p-4 border border-slate-100 dark:border-white/[0.04] shadow-inner">
            {task.description}
          </div>
        ) : (
          <div className="text-slate-400 dark:text-slate-500 text-xs italic bg-slate-50/50 dark:bg-zinc-800/30 rounded-xl p-4 border border-slate-100 dark:border-white/[0.04] text-center">
            No description provided for this task.
          </div>
        )}
      </div>

      <TaskFormModal open={taskModalOpen} onClose={() => setTaskModalOpen(false)} taskId={task.id} />
    </>
  );
}
