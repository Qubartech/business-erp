"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { SelectField, TextField } from "@/components/fields";
import { usersApi } from "@/services/api";
import { Loader2 } from "lucide-react";

const schema = z.object({
  name: z.string().min(1, "Required"),
  email: z.string().email(),
  password: z.string().min(8).or(z.literal("")).optional(),
  role: z.enum(["admin", "manager", "member"]),
  isActive: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

export default function UserFormPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : undefined;
  const editing = Boolean(id);
  const router = useRouter(); const nav = (path: any) => { if (path === -1) router.back(); else router.push(path); };
  const qc = useQueryClient();
  const { data: existing } = useQuery({ queryKey: ["users", id], queryFn: () => usersApi.get(id!), enabled: editing });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", role: "member", isActive: true },
  });

  useEffect(() => {
    if (existing) reset({ name: existing.name, email: existing.email, password: "", role: existing.role, isActive: existing.isActive });
  }, [existing, reset]);

  const save = useMutation({
    mutationFn: async (v: FormValues) => {
      if (editing) {
        const patch: Partial<FormValues> = { ...v };
        if (!patch.password) delete patch.password;
        return usersApi.update(id!, patch);
      }
      return usersApi.create({ ...v, password: v.password || "changeme1" });
    },
    onSuccess: () => {
      toast.success(editing ? "User updated" : "User created");
      qc.invalidateQueries({ queryKey: ["users"] });
      nav("/users");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader title={editing ? "Edit user" : "New user"} />
      <form className="card p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl" onSubmit={handleSubmit(async (v) => {
        try {
          await save.mutateAsync(v);
        } catch {}
      })}>
        <TextField label="Name" {...register("name")} error={errors.name?.message} />
        <TextField label="Email" type="email" {...register("email")} error={errors.email?.message} />
        <TextField label={editing ? "New password (optional)" : "Password"} type="password" {...register("password")} error={errors.password?.message} />
        <SelectField label="Role" {...register("role")} error={errors.role?.message}
          options={[{ value: "admin", label: "Admin" }, { value: "manager", label: "Manager" }, { value: "member", label: "Member" }]} />
        <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
          <input type="checkbox" {...register("isActive")} /> Active
        </label>
        <div className="sm:col-span-2 flex justify-end gap-2">
          <button type="button" className="btn-secondary" disabled={save.isPending || isSubmitting} onClick={() => nav(-1)}>Cancel</button>
          <button className="btn-primary" disabled={save.isPending || isSubmitting}>
            {(save.isPending || isSubmitting) && <Loader2 className="h-4 w-4 animate-spin mr-1.5 inline" />}
            {editing ? "Save" : "Create"}
          </button>
        </div>
      </form>
    </>
  );
}
