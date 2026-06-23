"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/lib/toast";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Modal } from "@/components/Modal";
import { qubartechTeamApi, type QubartechTeamMemberInput } from "@/services/qubartechApi";
import type { QubartechTeamMember } from "@/types";
import {
  Users,
  Loader2,
  Plus,
  Trash2,
  Edit2,
  Globe,
  Facebook,
  Linkedin,
  Github,
  CheckCircle,
  XCircle,
  ArrowUpDown
} from "lucide-react";

const teamSchema = z.object({
  name: z.string().min(1, "Name is required"),
  position: z.string().min(1, "Position is required"),
  image: z.string().nullable().optional(),
  facebook: z.string().nullable().optional(),
  linkedin: z.string().nullable().optional(),
  github: z.string().nullable().optional(),
  portfolio: z.string().nullable().optional(),
  x: z.string().nullable().optional(),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof teamSchema>;

export default function TeamManagementPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ["qubartech", "team"],
    queryFn: qubartechTeamApi.list,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(teamSchema as any),
    defaultValues: {
      name: "",
      position: "",
      image: "",
      facebook: "",
      linkedin: "",
      github: "",
      portfolio: "",
      x: "",
      order: 0,
      isActive: true,
    },
  });

  const save = useMutation({
    mutationFn: (data: FormValues) => {
      const payload: QubartechTeamMemberInput = {
        name: data.name,
        position: data.position,
        image: data.image || null,
        facebook: data.facebook || null,
        linkedin: data.linkedin || null,
        github: data.github || null,
        portfolio: data.portfolio || null,
        x: data.x || null,
        order: data.order,
        isActive: data.isActive,
      };
      return editingId
        ? qubartechTeamApi.update(editingId, payload)
        : qubartechTeamApi.create(payload);
    },
    onSuccess: () => {
      toast.success(editingId ? "Team member updated" : "Team member created");
      qc.invalidateQueries({ queryKey: ["qubartech", "team"] });
      closeModal();
    },
    onError: (e: Error) => {
      toast.error(e.message || "Failed to save team member");
    },
  });

  const remove = useMutation({
    mutationFn: qubartechTeamApi.remove,
    onSuccess: () => {
      toast.success("Team member deleted");
      qc.invalidateQueries({ queryKey: ["qubartech", "team"] });
    },
    onError: (e: Error) => {
      toast.error(e.message || "Failed to delete team member");
    },
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      qubartechTeamApi.update(id, { isActive }),
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["qubartech", "team"] });
    },
  });

  const openAddModal = () => {
    setEditingId(null);
    reset({
      name: "",
      position: "",
      image: "",
      facebook: "",
      linkedin: "",
      github: "",
      portfolio: "",
      x: "",
      order: 0,
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (member: QubartechTeamMember) => {
    setEditingId(member.id);
    reset({
      name: member.name,
      position: member.position,
      image: member.image ?? "",
      facebook: member.facebook ?? "",
      linkedin: member.linkedin ?? "",
      github: member.github ?? "",
      portfolio: member.portfolio ?? "",
      x: member.x ?? "",
      order: member.order,
      isActive: member.isActive,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  const columns: Column<QubartechTeamMember>[] = [
    {
      key: "name",
      header: "Member Details",
      render: (m) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500 overflow-hidden">
            {m.image ? (
              <img src={m.image} alt={m.name} className="h-full w-full object-cover" />
            ) : (
              <Users className="h-5 w-5" />
            )}
          </div>
          <div>
            <div className="font-bold text-slate-800 dark:text-slate-200">{m.name}</div>
            <div className="text-xs text-slate-400 dark:text-zinc-550">{m.position}</div>
          </div>
        </div>
      ),
    },
    {
      key: "order",
      header: <span className="flex items-center gap-1">Order <ArrowUpDown className="h-3 w-3" /></span>,
      render: (m) => <span className="font-mono text-xs font-semibold">{m.order}</span>,
    },
    {
      key: "socials",
      header: "Links",
      render: (m) => (
        <div className="flex gap-2 text-slate-400">
          {m.github && <a href={m.github} target="_blank" rel="noopener noreferrer" title="GitHub" className="hover:text-slate-600 dark:hover:text-slate-200"><Github className="h-4 w-4" /></a>}
          {m.linkedin && <a href={m.linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn" className="hover:text-blue-600"><Linkedin className="h-4 w-4" /></a>}
          {m.facebook && <a href={m.facebook} target="_blank" rel="noopener noreferrer" title="Facebook" className="hover:text-blue-500"><Facebook className="h-4 w-4" /></a>}
          {m.portfolio && <a href={m.portfolio} target="_blank" rel="noopener noreferrer" title="Portfolio" className="hover:text-brand-500"><Globe className="h-4 w-4" /></a>}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (m) => (
        <button
          onClick={() => toggleActive.mutate({ id: m.id, isActive: !m.isActive })}
          className="cursor-pointer transition-transform active:scale-95"
        >
          {m.isActive ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-650 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full">
              <CheckCircle className="h-3.5 w-3.5" /> Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
              <XCircle className="h-3.5 w-3.5" /> Inactive
            </span>
          )}
        </button>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (m) => (
        <div className="flex justify-end gap-1.5">
          <button className="btn-secondary p-2" onClick={() => openEditModal(m)} title="Edit Member">
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            className="btn-danger p-2"
            onClick={() => {
              if (confirm(`Delete team member ${m.name}?`)) {
                remove.mutate(m.id);
              }
            }}
            title="Delete Member"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
      className: "text-right",
    },
  ];

  return (
    <>
      <PageHeader
        title="QubarTech Team Members"
        description="Manage dynamic team member content displayed on the public website."
        actions={
          <button className="btn-primary flex items-center gap-2" onClick={openAddModal}>
            <Plus className="h-4 w-4" /> Add Team Member
          </button>
        }
      />

      <DataTable
        rows={teamMembers}
        loading={isLoading}
        columns={columns}
        rowKey={(m) => m.id}
        empty="No team members registered yet"
      />

      <Modal open={modalOpen} onClose={closeModal} title={editingId ? "Edit Team Member" : "Add Team Member"}>
        <form
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          onSubmit={handleSubmit((data) => save.mutate(data))}
        >
          {/* Name */}
          <div className="sm:col-span-2">
            <label className="label">Full Name</label>
            <input className="input" type="text" {...register("name")} placeholder="e.g. Tahir Ahmad" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          {/* Position */}
          <div className="sm:col-span-2">
            <label className="label">Position / Role</label>
            <input className="input" type="text" {...register("position")} placeholder="e.g. Co-Founder / Web Developer" />
            {errors.position && <p className="text-xs text-red-500 mt-1">{errors.position.message}</p>}
          </div>

          {/* Image Path */}
          <div className="sm:col-span-2">
            <label className="label">Image URL / Path</label>
            <input className="input font-mono text-xs" type="text" {...register("image")} placeholder="e.g. /image/our_teams/tahir.jpg" />
          </div>

          {/* Github / Linkedin */}
          <div>
            <label className="label">GitHub Profile URL</label>
            <input className="input" type="text" {...register("github")} placeholder="https://github.com/username" />
          </div>
          <div>
            <label className="label">LinkedIn Profile URL</label>
            <input className="input" type="text" {...register("linkedin")} placeholder="https://linkedin.com/in/username" />
          </div>

          {/* Facebook / X */}
          <div>
            <label className="label">Facebook Profile URL</label>
            <input className="input" type="text" {...register("facebook")} placeholder="https://facebook.com/username" />
          </div>
          <div>
            <label className="label">X (Twitter) Profile URL</label>
            <input className="input" type="text" {...register("x")} placeholder="https://x.com/username" />
          </div>

          {/* Portfolio */}
          <div className="sm:col-span-2">
            <label className="label">Portfolio Website URL</label>
            <input className="input" type="text" {...register("portfolio")} placeholder="https://yourportfolio.com" />
          </div>

          {/* Order / Active */}
          <div>
            <label className="label">Sort Order (Lower numbers first)</label>
            <input className="input" type="number" {...register("order", { valueAsNumber: true })} />
          </div>
          <div className="flex items-center gap-3 mt-8">
            <input className="rounded border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-brand-600 focus:ring-brand-500 h-4.5 w-4.5" type="checkbox" id="isActive" {...register("isActive")} />
            <label htmlFor="isActive" className="text-sm font-semibold text-slate-700 dark:text-slate-200 select-none cursor-pointer">Active on Website</label>
          </div>

          <div className="sm:col-span-2 border-t border-slate-100 dark:border-zinc-800 pt-4 mt-2 flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={save.isPending}>
              {save.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5 inline" />}
              {editingId ? "Update Member" : "Create Member"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
