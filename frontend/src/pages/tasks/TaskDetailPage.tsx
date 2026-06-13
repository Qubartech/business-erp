import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge, PriorityBadge } from "@/components/Badges";
import { SelectField } from "@/components/fields";
import { tasksApi, timeApi } from "@/services/featureApis";
import type { TaskPriority, TaskStatus } from "@/types";
import { formatDate } from "@/lib/format";
import { useAuth } from "@/features/auth/AuthProvider";

export default function TaskDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: task, isLoading } = useQuery({ queryKey: ["tasks", id], queryFn: () => tasksApi.get(id!), enabled: !!id });

  const update = useMutation({
    mutationFn: (patch: Partial<{ status: TaskStatus; priority: TaskPriority }>) => tasksApi.update(id!, patch),
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["tasks"] }); },
  });
  const remove = useMutation({
    mutationFn: () => tasksApi.remove(id!),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["tasks"] }); nav("/tasks"); },
  });
  const startTimer = useMutation({
    mutationFn: () => timeApi.start(id!),
    onSuccess: () => { toast.success("Timer started"); qc.invalidateQueries({ queryKey: ["time"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !task) return <div className="text-sm text-slate-500">Loading…</div>;
  const canManage = user?.role === "admin" || user?.role === "manager";

  return (
    <>
      <PageHeader title={task.title} description={task.project?.name}
        actions={
          <>
            <button className="btn-secondary" onClick={() => startTimer.mutate()}>Start timer</button>
            {canManage && <button className="btn-danger" onClick={() => remove.mutate()}>Delete</button>}
          </>
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <div className="text-xs text-slate-500 mb-1">Status</div>
          <StatusBadge kind="task" status={task.status} />
          <div className="mt-3">
            <SelectField value={task.status} onChange={(e) => update.mutate({ status: e.target.value as TaskStatus })}
              options={[{value:"todo",label:"Todo"},{value:"in_progress",label:"In Progress"},{value:"review",label:"Review"},{value:"done",label:"Done"}]} />
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500 mb-1">Priority</div>
          <PriorityBadge priority={task.priority} />
          <div className="mt-3">
            <SelectField value={task.priority} onChange={(e) => update.mutate({ priority: e.target.value as TaskPriority })}
              options={[{value:"low",label:"Low"},{value:"medium",label:"Medium"},{value:"high",label:"High"},{value:"critical",label:"Critical"}]} />
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500">Assignee</div><div className="text-sm mt-2">{task.assignee?.name ?? "—"}</div>
          <div className="text-xs text-slate-500 mt-3">Due</div><div className="text-sm mt-1">{formatDate(task.dueDate)}</div>
        </div>
      </div>
      {task.description && <div className="card p-4"><div className="text-xs text-slate-500 mb-2">Description</div><div className="text-sm whitespace-pre-wrap">{task.description}</div></div>}
    </>
  );
}
