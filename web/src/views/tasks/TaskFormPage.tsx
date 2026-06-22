import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { tasksApi } from "@/services/featureApis";
import { projectsApi, usersApi } from "@/services/api";
import { Loader2, Briefcase, User, Type, FileText, Calendar, Check } from "lucide-react";
import { clsx } from "clsx";
import { Modal } from "@/components/Modal";

const schema = z.object({
  projectId: z.string().uuid("Pick a project"),
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "review", "done"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function TaskFormModal({ open, onClose, taskId, projectId, onSuccess }: {
  open: boolean;
  onClose: () => void;
  taskId?: string | null;
  projectId?: string | null;
  onSuccess?: () => void;
}) {
  const editing = Boolean(taskId);
  const qc = useQueryClient();
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);

  const { data: projects } = useQuery({ queryKey: ["projects", "all"], queryFn: () => projectsApi.list({ pageSize: 100 }), enabled: open });
  const { data: users } = useQuery({ queryKey: ["users", "all"], queryFn: () => usersApi.list({ pageSize: 100 }), enabled: open });
  const { data: existing } = useQuery({
    queryKey: ["tasks", taskId],
    queryFn: () => tasksApi.get(taskId!),
    enabled: open && editing,
  });

  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema as any),
    defaultValues: { projectId: projectId ?? "", title: "", status: "todo", priority: "medium", assignedTo: "" },
  });

  useEffect(() => {
    if (open) {
      setAssigneeDropdownOpen(false);
      setAssigneeSearch("");
      if (existing && editing) {
        reset({
          projectId: existing.projectId,
          title: existing.title,
          description: existing.description ?? "",
          status: existing.status,
          priority: existing.priority,
          assignedTo: existing.assignedTo || "",
          dueDate: existing.dueDate?.slice(0, 10) ?? "",
        });
      } else if (!editing) {
        reset({
          projectId: projectId ?? "",
          title: "",
          description: "",
          status: "todo",
          priority: "medium",
          assignedTo: "",
          dueDate: "",
        });
      }
    }
  }, [existing, reset, open, editing, projectId]);

  const save = useMutation({
    mutationFn: (v: FormValues) => {
      const payload = {
        ...v,
        assignedTo: v.assignedTo || null,
        dueDate: v.dueDate || null,
      };
      return editing ? tasksApi.update(taskId!, payload) : tasksApi.create(payload);
    },
    onSuccess: () => {
      toast.success(editing ? "Task updated" : "Task created");
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit Task" : "New Task"}>
      <form 
        className="grid grid-cols-1 sm:grid-cols-2 gap-4" 
        onSubmit={handleSubmit(async (v) => {
          try {
            await save.mutateAsync(v);
          } catch {}
        })}
      >
        {/* Project Selector */}
        <div>
          <label className="label text-xs font-semibold mb-1.5 block">Project</label>
          <div className="relative rounded-xl shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Briefcase className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
            </div>
            <select 
              className={clsx(
                "input pl-9 rounded-xl focus:ring-2 focus:ring-brand-500 text-xs h-9",
                errors.projectId ? "ring-red-500 focus:ring-red-500" : ""
              )}
              {...register("projectId")}
              disabled={Boolean(projectId)}
            >
              <option value="">— pick project —</option>
              {projects?.items.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          {errors.projectId?.message && <p className="field-error text-xs text-red-500 mt-1">{errors.projectId.message}</p>}
        </div>

        {/* Searchable Assignee Selector */}
        <div className="relative">
          <label className="label text-xs font-semibold mb-1.5 block">Assignee</label>
          <Controller
            control={control}
            name="assignedTo"
            render={({ field }) => {
              const selectedUser = users?.items.find(u => u.id === field.value);
              return (
                <div className="relative">
                  <div 
                    className="input pl-9 pr-3 rounded-xl focus:ring-2 focus:ring-brand-500 cursor-pointer flex items-center justify-between h-9 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/[0.08]"
                    onClick={() => setAssigneeDropdownOpen(!assigneeDropdownOpen)}
                  >
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                      <User className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
                    </div>
                    <span className={clsx("text-xs truncate", !selectedUser && "text-slate-400 dark:text-zinc-500")}>
                      {selectedUser ? selectedUser.name : "Unassigned"}
                    </span>
                    <span className="text-[8px] text-slate-400">▼</span>
                  </div>

                  {assigneeDropdownOpen && (
                    <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-zinc-950 p-2 shadow-lg max-h-52 flex flex-col gap-2">
                      <input
                        type="text"
                        className="input text-xs py-1 px-2.5 rounded-lg"
                        placeholder="Search users..."
                        value={assigneeSearch}
                        onChange={(e) => setAssigneeSearch(e.target.value)}
                        autoFocus
                      />
                      <div className="overflow-y-auto flex-1 flex flex-col gap-1 max-h-32">
                        <button
                          type="button"
                          className="text-left px-2.5 py-1.5 rounded-lg text-[11px] hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-500 font-semibold"
                          onClick={() => {
                            field.onChange("");
                            setAssigneeDropdownOpen(false);
                            setAssigneeSearch("");
                          }}
                        >
                          Unassigned
                        </button>
                        {users?.items
                          .filter(u => u.name.toLowerCase().includes(assigneeSearch.toLowerCase()) || u.email.toLowerCase().includes(assigneeSearch.toLowerCase()))
                          .map(u => (
                            <button
                              type="button"
                              key={u.id}
                              className={clsx(
                                "text-left px-2 py-1 rounded-lg text-[11px] flex items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-900 w-full",
                                u.id === field.value && "bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 font-bold"
                              )}
                              onClick={() => {
                                field.onChange(u.id);
                                setAssigneeDropdownOpen(false);
                                setAssigneeSearch("");
                              }}
                            >
                              <div className="min-w-0 flex-1 leading-tight">
                                <div className="font-semibold truncate">{u.name}</div>
                                <div className="text-[9px] text-slate-450 dark:text-zinc-500 truncate">{u.email}</div>
                              </div>
                              {u.id === field.value && <Check className="h-3.5 w-3.5 text-brand-500 shrink-0" />}
                            </button>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </div>
              );
            }}
          />
        </div>

        {/* Task Title */}
        <div className="sm:col-span-2">
          <label className="label text-xs font-semibold mb-1.5 block">Task Title</label>
          <div className="relative rounded-xl shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Type className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
            </div>
            <input
              type="text"
              className={clsx(
                "input pl-9 rounded-xl focus:ring-2 focus:ring-brand-500 text-xs h-9",
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
          <label className="label text-xs font-semibold mb-1.5 block">Description</label>
          <div className="relative rounded-xl shadow-sm">
            <div className="pointer-events-none absolute top-3 left-0 flex items-start pl-3">
              <FileText className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
            </div>
            <textarea
              className="input pl-9 rounded-xl min-h-[80px] py-2 focus:ring-2 focus:ring-brand-500 text-xs"
              placeholder="Add description or notes for this task..."
              {...register("description")}
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="label text-xs font-semibold mb-1.5 block">Status</label>
          <select 
            className="input rounded-xl focus:ring-2 focus:ring-brand-500 text-xs h-9" 
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
          <label className="label text-xs font-semibold mb-1.5 block">Priority</label>
          <select 
            className="input rounded-xl focus:ring-2 focus:ring-brand-500 text-xs h-9" 
            {...register("priority")}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        {/* Due Date */}
        <div className="sm:col-span-2">
          <label className="label text-xs font-semibold mb-1.5 block">Due Date</label>
          <div className="relative rounded-xl shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Calendar className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
            </div>
            <input
              type="date"
              className="input pl-9 rounded-xl focus:ring-2 focus:ring-brand-500 text-xs h-9"
              {...register("dueDate")}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="sm:col-span-2 flex justify-end gap-2 mt-4 border-t border-slate-200 dark:border-slate-800 pt-3 w-full">
          <button 
            type="button" 
            className="btn-secondary px-4 py-1.5 rounded-xl text-xs" 
            disabled={save.isPending || isSubmitting} 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="btn-primary px-5 py-1.5 rounded-xl text-xs" 
            disabled={save.isPending || isSubmitting}
          >
            {(save.isPending || isSubmitting) && <Loader2 className="h-3 w-3 animate-spin mr-1.5 inline" />}
            {editing ? "Save Changes" : "Create Task"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function TaskFormPage() {
  return null;
}
