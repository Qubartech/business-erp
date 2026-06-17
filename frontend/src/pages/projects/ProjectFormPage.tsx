import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { projectsApi, usersApi } from "@/services/api";
import { Loader2, FolderKanban, Calendar, Github, Check, FileText, UserPlus } from "lucide-react";
import { clsx } from "clsx";
import { Modal } from "@/components/Modal";

const schema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  status: z.enum(["draft", "active", "on_hold", "completed", "archived"]),
  category: z.enum(["client", "non_client"]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  githubRepo: z.string().optional(),
  memberIds: z.array(z.string().uuid()).default([]),
});
type FormValues = z.infer<typeof schema>;

export function ProjectFormModal({ open, onClose, projectId, onSuccess }: {
  open: boolean;
  onClose: () => void;
  projectId?: string | null;
  onSuccess?: () => void;
}) {
  const editing = Boolean(projectId);
  const qc = useQueryClient();
  const [memberSearch, setMemberSearch] = useState("");

  const { data: users } = useQuery({ queryKey: ["users", "all"], queryFn: () => usersApi.list({ pageSize: 100 }), enabled: open });
  const { data: existing } = useQuery({ queryKey: ["projects", projectId], queryFn: () => projectsApi.get(projectId!), enabled: open && editing });

  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", status: "draft", category: "client", githubRepo: "", memberIds: [] },
  });

  useEffect(() => {
    if (open) {
      setMemberSearch("");
      if (existing && editing) {
        reset({
          name: existing.name,
          description: existing.description ?? "",
          status: existing.status,
          category: existing.category,
          startDate: existing.startDate?.slice(0, 10) ?? "",
          endDate: existing.endDate?.slice(0, 10) ?? "",
          githubRepo: existing.githubRepo ?? "",
          memberIds: existing.members?.map(m => m.userId) ?? [],
        });
      } else if (!editing) {
        reset({ name: "", description: "", status: "draft", category: "client", githubRepo: "", memberIds: [] });
      }
    }
  }, [existing, reset, open, editing]);

  const save = useMutation({
    mutationFn: (v: FormValues) => {
      const clean = {
        ...v,
        description: v.description || undefined,
        startDate: v.startDate || undefined,
        endDate: v.endDate || undefined,
        githubRepo: v.githubRepo || null,
      };
      return editing ? projectsApi.update(projectId!, clean) : projectsApi.create(clean as typeof v);
    },
    onSuccess: () => {
      toast.success(editing ? "Project updated" : "Project created");
      qc.invalidateQueries({ queryKey: ["projects"] });
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit Project" : "New Project"}>
      <form 
        className="grid grid-cols-1 sm:grid-cols-2 gap-4" 
        onSubmit={handleSubmit(async (v) => {
          try {
            await save.mutateAsync(v);
          } catch {}
        })}
      >
        {/* Project Name */}
        <div className="sm:col-span-2">
          <label className="label text-xs font-semibold mb-1.5 block">Project Name</label>
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
          <label className="label text-xs font-semibold mb-1.5 block">Description</label>
          <div className="relative rounded-xl shadow-sm">
            <div className="pointer-events-none absolute top-3 left-0 flex items-start pl-3">
              <FileText className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
            </div>
            <textarea
              className="input pl-9 rounded-xl min-h-[80px] py-2 focus:ring-2 focus:ring-brand-500 text-xs"
              placeholder="Describe what this project is about..."
              {...register("description")}
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="label text-xs font-semibold mb-1.5 block">Status</label>
          <select 
            className="input rounded-xl focus:ring-2 focus:ring-brand-500 text-xs" 
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
          <label className="label text-xs font-semibold mb-1.5 block">Category</label>
          <select 
            className="input rounded-xl focus:ring-2 focus:ring-brand-500 text-xs" 
            {...register("category")}
          >
            <option value="client">Client Project</option>
            <option value="non_client">Non-Client (Company/Personal)</option>
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label className="label text-xs font-semibold mb-1.5 block">Start Date</label>
          <div className="relative rounded-xl shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Calendar className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
            </div>
            <input
              type="date"
              className="input pl-9 rounded-xl focus:ring-2 focus:ring-brand-500 text-xs"
              {...register("startDate")}
            />
          </div>
        </div>

        {/* End Date */}
        <div>
          <label className="label text-xs font-semibold mb-1.5 block">End Date</label>
          <div className="relative rounded-xl shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Calendar className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
            </div>
            <input
              type="date"
              className="input pl-9 rounded-xl focus:ring-2 focus:ring-brand-500 text-xs"
              {...register("endDate")}
            />
          </div>
        </div>

        {/* GitHub Repo */}
        <div className="sm:col-span-2">
          <label className="label text-xs font-semibold mb-1.5 block">GitHub Repository</label>
          <div className="relative rounded-xl shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Github className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
            </div>
            <input
              type="text"
              className="input pl-9 rounded-xl focus:ring-2 focus:ring-brand-500 text-xs"
              placeholder="e.g. owner/repo"
              {...register("githubRepo")}
            />
          </div>
        </div>

        {/* Members Multi-select checklist Grid */}
        <div className="sm:col-span-2">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-slate-500" />
              <label className="label text-xs font-semibold mb-0 block">Assign Members</label>
            </div>
            <input
              type="text"
              className="input text-[11px] !py-1 !px-2 max-w-[150px] rounded-lg"
              placeholder="Search members..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
            />
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
              const filteredUsers = users?.items.filter(u => 
                u.name.toLowerCase().includes(memberSearch.toLowerCase()) || 
                u.email.toLowerCase().includes(memberSearch.toLowerCase())
              ) ?? [];
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-slate-200 dark:border-white/[0.08] rounded-xl bg-slate-50/50 dark:bg-zinc-950/30">
                  {filteredUsers.length === 0 ? (
                    <div className="sm:col-span-2 text-center py-4 text-xs text-slate-400">No members found</div>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSelected = selected.includes(u.id);
                      const initials = u.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
                      return (
                        <button
                          type="button"
                          key={u.id}
                          onClick={() => toggleMember(u.id)}
                          className={clsx(
                            "flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all duration-150 cursor-pointer w-full",
                            isSelected
                              ? "bg-brand-50/80 dark:bg-brand-900/20 border-brand-500/80 dark:border-brand-500/40 text-brand-900 dark:text-brand-300 ring-1 ring-brand-500/30"
                              : "bg-white dark:bg-zinc-900/50 border-slate-200 dark:border-white/[0.06] text-slate-700 dark:text-slate-350 hover:bg-slate-55 dark:hover:bg-zinc-800"
                          )}
                        >
                          <div className={clsx(
                            "h-7 w-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 select-none",
                            isSelected
                              ? "bg-brand-500 text-white"
                              : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400"
                          )}>
                            {initials}
                          </div>
                          <div className="min-w-0 flex-1 leading-tight">
                            <div className="text-[11px] font-bold truncate">{u.name}</div>
                            <div className="text-[9px] text-slate-400 dark:text-zinc-500 truncate">{u.email}</div>
                          </div>
                          <div className={clsx(
                            "h-4 w-4 rounded-full border flex items-center justify-center shrink-0",
                            isSelected
                              ? "border-brand-500 bg-brand-500 text-white"
                              : "border-slate-300 dark:border-zinc-700 bg-transparent"
                          )}>
                            {isSelected && <Check className="h-2.5 w-2.5" />}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              );
            }} 
          />
        </div>

        {/* Action Buttons */}
        <div className="sm:col-span-2 flex justify-end gap-2 mt-4 border-t border-slate-105 dark:border-slate-800 pt-3">
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
            {(save.isPending || isSubmitting) && <Loader2 className="h-3 w-3 animate-spin mr-1 inline" />}
            {editing ? "Save Changes" : "Create Project"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function ProjectFormPage() {
  return null;
}
