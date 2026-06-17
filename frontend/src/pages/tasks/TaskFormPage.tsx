import { useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { tasksApi } from "@/services/featureApis";
import { projectsApi, usersApi } from "@/services/api";
import { Loader2, Briefcase, User, Type, FileText, Calendar } from "lucide-react";
import { clsx } from "clsx";

const schema = z.object({
  projectId: z.string().uuid("Pick a project"),
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  status: z.enum(["todo","in_progress","review","done"]),
  priority: z.enum(["low","medium","high","critical"]),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function TaskFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const nav = useNavigate();
  const qc = useQueryClient();
  const [sp] = useSearchParams();
  const { data: projects } = useQuery({ queryKey: ["projects","all"], queryFn: () => projectsApi.list({ pageSize: 100 }) });
  const { data: users } = useQuery({ queryKey: ["users","all"], queryFn: () => usersApi.list({ pageSize: 100 }) });
  const { data: existing, isLoading: existingLoading } = useQuery({
    queryKey: ["tasks", id],
    queryFn: () => tasksApi.get(id!),
    enabled: editing,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { projectId: sp.get("projectId") ?? "", title: "", status: "todo", priority: "medium" },
  });

  useEffect(() => {
    if (existing) {
      reset({
        projectId: existing.projectId,
        title: existing.title,
        description: existing.description ?? "",
        status: existing.status,
        priority: existing.priority,
        assignedTo: existing.assignedTo || "",
        dueDate: existing.dueDate?.slice(0, 10) ?? "",
      });
    }
  }, [existing, reset]);

  const save = useMutation({
    mutationFn: (v: FormValues) => {
      const payload = {
        ...v,
        assignedTo: v.assignedTo || null,
        dueDate: v.dueDate || null,
      };
      return editing ? tasksApi.update(id!, payload) : tasksApi.create(payload);
    },
    onSuccess: (t) => {
      toast.success(editing ? "Task updated" : "Task created");
      qc.invalidateQueries({ queryKey: ["tasks"] });
      nav(`/tasks/${t.id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (editing && existingLoading) return <div className="text-sm text-slate-500">Loading…</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader title={editing ? "Edit Task" : "New Task"} />

      <form 
        className="glass-panel p-6 sm:p-8 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-6 border border-slate-200/50 dark:border-white/[0.08] shadow-lg animate-fade-in" 
        onSubmit={handleSubmit(async (v) => {
          try {
            await save.mutateAsync(v);
          } catch {}
        })}
      >
        {/* Project Selector */}
        <div>
          <label className="label text-sm font-semibold mb-1.5 block">Project</label>
          <div className="relative rounded-xl shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Briefcase className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
            </div>
            <select 
              className={clsx(
                "input pl-9 rounded-xl focus:ring-2 focus:ring-brand-500",
                errors.projectId ? "ring-red-500 focus:ring-red-500" : ""
              )}
              {...register("projectId")}
            >
              <option value="">— pick project —</option>
              {projects?.items.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          {errors.projectId?.message && <p className="field-error text-xs text-red-500 mt-1">{errors.projectId.message}</p>}
        </div>

        {/* Assignee Selector */}
        <div>
          <label className="label text-sm font-semibold mb-1.5 block">Assignee</label>
          <div className="relative rounded-xl shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <User className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
            </div>
            <select 
              className="input pl-9 rounded-xl focus:ring-2 focus:ring-brand-500" 
              {...register("assignedTo")}
            >
              <option value="">Unassigned</option>
              {users?.items.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Task Title */}
        <div className="sm:col-span-2">
          <label className="label text-sm font-semibold mb-1.5 block">Task Title</label>
          <div className="relative rounded-xl shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Type className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
            </div>
            <input
              type="text"
              className={clsx(
                "input pl-9 rounded-xl focus:ring-2 focus:ring-brand-500",
                errors.title ? "ring-red-500 focus:ring-red-500" : ""
              )}
              placeholder="Enter task title..."
              {...register("title")}
            />
          </div>
          {errors.title?.message && <p className="field-error text-xs text-red-500 mt-1">{errors.title.message}</p>}
        </div>

        {/* Description */}
        <div className="sm:col-span-2">
          <label className="label text-sm font-semibold mb-1.5 block">Description</label>
          <div className="relative rounded-xl shadow-sm">
            <div className="pointer-events-none absolute top-3 left-0 flex items-start pl-3">
              <FileText className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
            </div>
            <textarea
              className="input pl-9 rounded-xl min-h-[120px] py-2 focus:ring-2 focus:ring-brand-500"
              placeholder="Add description or notes for this task..."
              {...register("description")}
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="label text-sm font-semibold mb-1.5 block">Status</label>
          <select 
            className="input rounded-xl focus:ring-2 focus:ring-brand-500" 
            {...register("status")}
          >
            <option value="todo">Todo</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
        </div>

        {/* Priority */}
        <div>
          <label className="label text-sm font-semibold mb-1.5 block">Priority</label>
          <select 
            className="input rounded-xl focus:ring-2 focus:ring-brand-500" 
            {...register("priority")}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        {/* Due Date */}
        <div>
          <label className="label text-sm font-semibold mb-1.5 block">Due Date</label>
          <div className="relative rounded-xl shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Calendar className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
            </div>
            <input
              type="date"
              className="input pl-9 rounded-xl focus:ring-2 focus:ring-brand-500"
              {...register("dueDate")}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="sm:col-span-2 flex justify-end gap-2 mt-4">
          <button 
            type="button" 
            className="btn-secondary px-5 py-2 rounded-xl" 
            disabled={save.isPending || isSubmitting} 
            onClick={() => nav(-1)}
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="btn-primary px-6 py-2 rounded-xl" 
            disabled={save.isPending || isSubmitting}
          >
            {(save.isPending || isSubmitting) && <Loader2 className="h-4 w-4 animate-spin mr-1.5 inline" />}
            {editing ? "Save Changes" : "Create Task"}
          </button>
        </div>
      </form>
    </div>
  );
}
