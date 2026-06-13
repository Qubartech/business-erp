import { clsx } from "clsx";
import type { ProjectStatus, TaskPriority, TaskStatus } from "@/types";

const projectColors: Record<ProjectStatus, string> = {
  draft: "bg-slate-50 text-slate-700 ring-slate-200",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  on_hold: "bg-amber-50 text-amber-700 ring-amber-200",
  completed: "bg-blue-50 text-blue-700 ring-blue-200",
  archived: "bg-slate-100 text-slate-500 ring-slate-300",
};
const taskColors: Record<TaskStatus, string> = {
  todo: "bg-slate-50 text-slate-700 ring-slate-200",
  in_progress: "bg-blue-50 text-blue-700 ring-blue-200",
  review: "bg-violet-50 text-violet-700 ring-violet-200",
  done: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};
const priorityColors: Record<TaskPriority, string> = {
  low: "bg-slate-50 text-slate-600 ring-slate-200",
  medium: "bg-sky-50 text-sky-700 ring-sky-200",
  high: "bg-amber-50 text-amber-700 ring-amber-200",
  critical: "bg-red-50 text-red-700 ring-red-200",
};

const label = (s: string) => s.replace(/_/g, " ");

export function StatusBadge({ status, kind }: { status: ProjectStatus | TaskStatus; kind: "project" | "task" }) {
  const cls = kind === "project" ? projectColors[status as ProjectStatus] : taskColors[status as TaskStatus];
  return <span className={clsx("badge", cls)}>{label(status)}</span>;
}
export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return <span className={clsx("badge", priorityColors[priority])}>{priority}</span>;
}
