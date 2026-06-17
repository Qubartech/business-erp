import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { projectsApi, usersApi } from "@/services/api";
import { Loader2, FolderKanban, Calendar, Github, Check, FileText, UserPlus } from "lucide-react";
import { clsx } from "clsx";

const schema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  status: z.enum(["draft","active","on_hold","completed","archived"]),
  category: z.enum(["client", "non_client"]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  githubRepo: z.string().optional(),
  memberIds: z.array(z.string().uuid()).default([]),
});
type FormValues = z.infer<typeof schema>;

export default function ProjectFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data: users } = useQuery({ queryKey: ["users","all"], queryFn: () => usersApi.list({ pageSize: 100 }) });
  const { data: existing } = useQuery({ queryKey: ["projects", id], queryFn: () => projectsApi.get(id!), enabled: editing });

  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", status: "draft", category: "client", githubRepo: "", memberIds: [] },
  });

  useEffect(() => {
    if (existing) reset({
      name: existing.name, description: existing.description ?? "",
      status: existing.status,
      category: existing.category,
      startDate: existing.startDate?.slice(0,10),
      endDate: existing.endDate?.slice(0,10),
      githubRepo: existing.githubRepo ?? "",
      memberIds: existing.members?.map(m => m.userId) ?? [],
    });
  }, [existing, reset]);

  const save = useMutation({
    mutationFn: (v: FormValues) => {
      const clean = {
        ...v,
        description: v.description || undefined,
        startDate: v.startDate || undefined,
        endDate: v.endDate || undefined,
        githubRepo: v.githubRepo || null,
      };
      return editing ? projectsApi.update(id!, clean) : projectsApi.create(clean as typeof v);
    },
    onSuccess: (p) => {
      toast.success(editing ? "Project updated" : "Project created");
      qc.invalidateQueries({ queryKey: ["projects"] });
      nav(`/projects/${p.id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader title={editing ? "Edit Project" : "New Project"} />
      
      <form 
        className="glass-panel p-6 sm:p-8 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-6 border border-slate-200/50 dark:border-white/[0.08] shadow-lg animate-fade-in" 
        onSubmit={handleSubmit(async (v) => {
          try {
            await save.mutateAsync(v);
          } catch {}
        })}
      >
        {/* Project Name */}
        <div className="sm:col-span-2">
          <label className="label text-sm font-semibold mb-1.5 block">Project Name</label>
          <div className="relative rounded-xl shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <FolderKanban className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
            </div>
            <input
              type="text"
              className={clsx(
                "input pl-9 rounded-xl focus:ring-2 focus:ring-brand-500",
                errors.name ? "ring-red-500 focus:ring-red-500" : ""
              )}
              placeholder="Enter project name..."
              {...register("name")}
            />
          </div>
          {errors.name?.message && <p className="field-error text-xs text-red-500 mt-1">{errors.name.message}</p>}
        </div>

        {/* Description */}
        <div className="sm:col-span-2">
          <label className="label text-sm font-semibold mb-1.5 block">Description</label>
          <div className="relative rounded-xl shadow-sm">
            <div className="pointer-events-none absolute top-3 left-0 flex items-start pl-3">
              <FileText className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
            </div>
            <textarea
              className="input pl-9 rounded-xl min-h-[100px] py-2 focus:ring-2 focus:ring-brand-500"
              placeholder="Describe what this project is about..."
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
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="label text-sm font-semibold mb-1.5 block">Category</label>
          <select 
            className="input rounded-xl focus:ring-2 focus:ring-brand-500" 
            {...register("category")}
          >
            <option value="client">Client Project</option>
            <option value="non_client">Non-Client (Company/Personal)</option>
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label className="label text-sm font-semibold mb-1.5 block">Start Date</label>
          <div className="relative rounded-xl shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Calendar className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
            </div>
            <input
              type="date"
              className="input pl-9 rounded-xl focus:ring-2 focus:ring-brand-500"
              {...register("startDate")}
            />
          </div>
        </div>

        {/* End Date */}
        <div>
          <label className="label text-sm font-semibold mb-1.5 block">End Date</label>
          <div className="relative rounded-xl shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Calendar className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
            </div>
            <input
              type="date"
              className="input pl-9 rounded-xl focus:ring-2 focus:ring-brand-500"
              {...register("endDate")}
            />
          </div>
        </div>

        {/* GitHub Repo */}
        <div className="sm:col-span-2">
          <label className="label text-sm font-semibold mb-1.5 block">GitHub Repository</label>
          <div className="relative rounded-xl shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Github className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
            </div>
            <input
              type="text"
              className="input pl-9 rounded-xl focus:ring-2 focus:ring-brand-500"
              placeholder="e.g. owner/repo"
              {...register("githubRepo")}
            />
          </div>
        </div>

        {/* Members Multi-select checklist Grid */}
        <div className="sm:col-span-2">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="h-4 w-4 text-slate-500" />
            <label className="label text-sm font-semibold mb-0 block">Assign Members</label>
          </div>
          <Controller 
            control={control} 
            name="memberIds" 
            render={({ field }) => {
              const selected = field.value || [];
              const toggleMember = (userId: string) => {
                if (selected.includes(userId)) {
                  field.onChange(selected.filter(id => id !== userId));
                } else {
                  field.onChange([...selected, userId]);
                }
              };
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border border-slate-200 dark:border-white/[0.08] rounded-xl bg-slate-50/50 dark:bg-zinc-950/30">
                  {users?.items.map((u) => {
                    const isSelected = selected.includes(u.id);
                    const initials = u.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
                    return (
                      <button
                        type="button"
                        key={u.id}
                        onClick={() => toggleMember(u.id)}
                        className={clsx(
                          "flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all duration-150 cursor-pointer w-full",
                          isSelected
                            ? "bg-brand-50/80 dark:bg-brand-900/20 border-brand-500/80 dark:border-brand-500/40 text-brand-900 dark:text-brand-300 ring-1 ring-brand-500/30"
                            : "bg-white dark:bg-zinc-900/50 border-slate-200 dark:border-white/[0.06] text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-zinc-800/50"
                        )}
                      >
                        <div className={clsx(
                          "h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 select-none",
                          isSelected
                            ? "bg-brand-500 text-white"
                            : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400"
                        )}>
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1 leading-tight">
                          <div className="text-xs font-bold truncate">{u.name}</div>
                          <div className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">{u.email}</div>
                        </div>
                        <div className={clsx(
                          "h-4.5 w-4.5 rounded-full border flex items-center justify-center shrink-0",
                          isSelected
                            ? "border-brand-500 bg-brand-500 text-white"
                            : "border-slate-300 dark:border-zinc-700 bg-transparent"
                        )}>
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            }} 
          />
        </div>

        {/* Action Buttons */}
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
            {editing ? "Save Changes" : "Create Project"}
          </button>
        </div>
      </form>
    </div>
  );
}
