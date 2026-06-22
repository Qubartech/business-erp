"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/AuthProvider";
import { profileApi } from "@/services/api";
import { PageHeader } from "@/components/PageHeader";
import { Loader2, User, Mail, Lock, Shield, UserCheck } from "lucide-react";
import { clsx } from "clsx";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  email: z.string().email("Invalid email address"),
  password: z.string().optional().refine(val => !val || val.length >= 8, {
    message: "Password must be at least 8 characters",
  }),
});

type FormValues = z.infer<typeof schema>;

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

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const router = useRouter(); const nav = (path: any) => { if (path === -1) router.back(); else router.push(path); };

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema as any),
    defaultValues: { name: "", email: "", password: "" },
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        password: "",
      });
    }
  }, [user, reset]);

  const save = useMutation({
    mutationFn: (v: FormValues) => {
      const payload: Partial<FormValues> = { name: v.name, email: v.email };
      if (v.password) {
        payload.password = v.password;
      }
      return profileApi.update(payload);
    },
    onSuccess: (updatedUser) => {
      toast.success("Profile updated successfully");
      updateUser(updatedUser);
      reset({ ...updatedUser, password: "" });
    },
    onError: (e: Error) => {
      toast.error(e.message || "Failed to update profile");
    },
  });

  if (!user) return null;

  const avatarColor = getAvatarColor(user.name);
  const initials = getInitials(user.name);

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader 
        title="Account Settings" 
        description="Update your personal details, email address, and change your password."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Profile Card Summary */}
        <div className="card-premium p-6 flex flex-col items-center text-center justify-center h-fit">
          <div className={`h-24 w-24 rounded-full flex items-center justify-center text-3xl font-bold shadow-md ${avatarColor} mb-4 border-4 border-white dark:border-zinc-800`}>
            {initials}
          </div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{user.name}</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">{user.email}</p>

          <span className={clsx(
            "mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider border select-none",
            user.role === "admin" 
              ? "bg-red-50 text-red-650 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/40" 
              : user.role === "manager"
              ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40"
              : "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/40"
          )}>
            <Shield className="h-3.5 w-3.5" />
            <span>{user.role}</span>
          </span>
        </div>

        {/* Edit Form */}
        <div className="card-premium p-6 md:col-span-2">
          <form 
            className="space-y-4" 
            onSubmit={handleSubmit(async (v) => {
              try {
                await save.mutateAsync(v);
              } catch {}
            })}
          >
            {/* Full Name */}
            <div>
              <label className="label text-xs font-bold uppercase tracking-wide text-slate-400 mb-1.5 block">Full Name</label>
              <div className="relative rounded-xl shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
                </div>
                <input
                  type="text"
                  className={clsx(
                    "input pl-9 rounded-xl focus:ring-2 focus:ring-brand-500 text-xs h-9",
                    errors.name ? "ring-red-500 focus:ring-red-500" : ""
                  )}
                  placeholder="Your full name"
                  {...register("name")}
                />
              </div>
              {errors.name?.message && <p className="field-error text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            {/* Email Address */}
            <div>
              <label className="label text-xs font-bold uppercase tracking-wide text-slate-400 mb-1.5 block">Email Address</label>
              <div className="relative rounded-xl shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
                </div>
                <input
                  type="email"
                  className={clsx(
                    "input pl-9 rounded-xl focus:ring-2 focus:ring-brand-500 text-xs h-9",
                    errors.email ? "ring-red-500 focus:ring-red-500" : ""
                  )}
                  placeholder="Your email address"
                  {...register("email")}
                />
              </div>
              {errors.email?.message && <p className="field-error text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            {/* New Password */}
            <div>
              <label className="label text-xs font-bold uppercase tracking-wide text-slate-400 mb-1.5 block">New Password (Optional)</label>
              <div className="relative rounded-xl shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
                </div>
                <input
                  type="password"
                  className={clsx(
                    "input pl-9 rounded-xl focus:ring-2 focus:ring-brand-500 text-xs h-9",
                    errors.password ? "ring-red-500 focus:ring-red-500" : ""
                  )}
                  placeholder="Leave blank to keep your current password"
                  {...register("password")}
                />
              </div>
              {errors.password?.message && <p className="field-error text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            {/* Role (Read only) */}
            <div>
              <label className="label text-xs font-bold uppercase tracking-wide text-slate-400 mb-1.5 block">Workspace Role</label>
              <div className="relative rounded-xl shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <UserCheck className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
                </div>
                <input
                  type="text"
                  disabled
                  value={`${user.role.toUpperCase()} (Cannot be changed by user)`}
                  className="input pl-9 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-white/[0.04] text-slate-455 dark:text-slate-500 text-xs h-9 cursor-not-allowed select-none"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-white/[0.06] mt-6">
              <button 
                type="button" 
                className="btn-secondary px-4 py-1.5 rounded-xl text-xs cursor-pointer" 
                disabled={save.isPending || isSubmitting} 
                onClick={() => nav("/")}
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="btn-primary px-5 py-1.5 rounded-xl text-xs cursor-pointer shadow-glow-brand" 
                disabled={save.isPending || isSubmitting}
              >
                {(save.isPending || isSubmitting) && <Loader2 className="h-3 w-3 animate-spin mr-1.5 inline" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
