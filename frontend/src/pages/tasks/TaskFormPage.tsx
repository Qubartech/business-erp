import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { SelectField, TextField, TextareaField } from "@/components/fields";
import { tasksApi } from "@/services/featureApis";
import { projectsApi, usersApi } from "@/services/api";
import { Loader2 } from "lucide-react";

const schema = z.object({
  projectId: z.string().uuid("Pick a project"),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["todo","in_progress","review","done"]),
  priority: z.enum(["low","medium","high","critical"]),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function TaskFormPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [sp] = useSearchParams();
  const { data: projects } = useQuery({ queryKey: ["projects","all"], queryFn: () => projectsApi.list({ pageSize: 100 }) });
  const { data: users } = useQuery({ queryKey: ["users","all"], queryFn: () => usersApi.list({ pageSize: 100 }) });
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { projectId: sp.get("projectId") ?? "", title: "", status: "todo", priority: "medium" },
  });

  const create = useMutation({
    mutationFn: (v: FormValues) => tasksApi.create({
      ...v,
      assignedTo: v.assignedTo || null,
      dueDate: v.dueDate || null,
    }),
    onSuccess: (t) => { toast.success("Task created"); qc.invalidateQueries({ queryKey: ["tasks"] }); nav(`/tasks/${t.id}`); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader title="New task" />
      <form className="card p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl" onSubmit={handleSubmit(async (v) => {
        try {
          await create.mutateAsync(v);
        } catch {}
      })}>
        <SelectField label="Project" {...register("projectId")} error={errors.projectId?.message}
          options={[{ value: "", label: "— pick —" }, ...(projects?.items.map(p => ({ value: p.id, label: p.name })) ?? [])]} />
        <SelectField label="Assignee" {...register("assignedTo")}
          options={[{ value: "", label: "Unassigned" }, ...(users?.items.map(u => ({ value: u.id, label: u.name })) ?? [])]} />
        <TextField className="sm:col-span-2" label="Title" {...register("title")} error={errors.title?.message} />
        <TextareaField className="sm:col-span-2" label="Description" {...register("description")} />
        <SelectField label="Status" {...register("status")}
          options={[{value:"todo",label:"Todo"},{value:"in_progress",label:"In Progress"},{value:"review",label:"Review"},{value:"done",label:"Done"}]} />
        <SelectField label="Priority" {...register("priority")}
          options={[{value:"low",label:"Low"},{value:"medium",label:"Medium"},{value:"high",label:"High"},{value:"critical",label:"Critical"}]} />
        <TextField label="Due date" type="date" {...register("dueDate")} />
        <div className="sm:col-span-2 flex justify-end gap-2">
          <button type="button" className="btn-secondary" disabled={create.isPending || isSubmitting} onClick={() => nav(-1)}>Cancel</button>
          <button className="btn-primary" disabled={create.isPending || isSubmitting}>
            {(create.isPending || isSubmitting) && <Loader2 className="h-4 w-4 animate-spin mr-1.5 inline" />}
            Create
          </button>
        </div>
      </form>
    </>
  );
}
