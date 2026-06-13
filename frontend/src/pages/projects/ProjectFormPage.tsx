import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { SelectField, TextField, TextareaField } from "@/components/fields";
import { projectsApi, usersApi } from "@/services/api";

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["draft","active","on_hold","completed","archived"]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
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
    defaultValues: { name: "", description: "", status: "draft", memberIds: [] },
  });

  useEffect(() => {
    if (existing) reset({
      name: existing.name, description: existing.description ?? "",
      status: existing.status,
      startDate: existing.startDate?.slice(0,10),
      endDate: existing.endDate?.slice(0,10),
      memberIds: existing.members?.map(m => m.userId) ?? [],
    });
  }, [existing, reset]);

  const save = useMutation({
    mutationFn: (v: FormValues) => editing ? projectsApi.update(id!, v) : projectsApi.create(v),
    onSuccess: (p) => {
      toast.success(editing ? "Project updated" : "Project created");
      qc.invalidateQueries({ queryKey: ["projects"] });
      nav(`/projects/${p.id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader title={editing ? "Edit project" : "New project"} />
      <form className="card p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl" onSubmit={handleSubmit((v) => save.mutate(v))}>
        <TextField label="Name" className="sm:col-span-2" {...register("name")} error={errors.name?.message} />
        <TextareaField label="Description" className="sm:col-span-2" {...register("description")} />
        <SelectField label="Status" {...register("status")}
          options={[{value:"draft",label:"Draft"},{value:"active",label:"Active"},{value:"on_hold",label:"On Hold"},{value:"completed",label:"Completed"},{value:"archived",label:"Archived"}]} />
        <div />
        <TextField label="Start date" type="date" {...register("startDate")} />
        <TextField label="End date" type="date" {...register("endDate")} />
        <div className="sm:col-span-2">
          <label className="label">Members</label>
          <Controller control={control} name="memberIds" render={({ field }) => (
            <select multiple value={field.value} onChange={(e) => field.onChange(Array.from(e.target.selectedOptions).map(o => o.value))}
              className="input h-40">
              {users?.items.map((u) => <option key={u.id} value={u.id}>{u.name} — {u.email}</option>)}
            </select>
          )} />
        </div>
        <div className="sm:col-span-2 flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={() => nav(-1)}>Cancel</button>
          <button className="btn-primary" disabled={isSubmitting}>{editing ? "Save" : "Create"}</button>
        </div>
      </form>
    </>
  );
}
