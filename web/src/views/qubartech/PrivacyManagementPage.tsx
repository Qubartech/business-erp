"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/lib/toast";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Modal } from "@/components/Modal";
import { qubartechProductsApi, type QubartechProductInput } from "@/services/qubartechApi";
import type { QubartechProduct } from "@/types";
import {
  FolderKanban,
  Loader2,
  Plus,
  Trash2,
  Edit2,
  FileText,
  ShieldAlert,
  CheckCircle,
  XCircle,
  ExternalLink
} from "lucide-react";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-_]+$/, "Slug must only contain lowercase alphanumeric characters, dashes, and underscores"),
  category: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  features: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  tags: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  link: z.string().nullable().optional(),
  status: z.string().default("live"),
  privacyPolicy: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  hasProjectManagement: z.boolean().default(true),
  hasPrivacy: z.boolean().default(true),
});

type FormValues = z.infer<typeof productSchema>;

export default function PrivacyManagementPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ["qubartech", "products"],
    queryFn: qubartechProductsApi.list,
  });

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(productSchema as any),
    defaultValues: {
      name: "",
      slug: "",
      category: "productivity",
      description: "",
      features: "",
      icon: "📺",
      color: "from-purple-500 to-pink-500",
      tags: "",
      image: "",
      link: "#",
      status: "live",
      privacyPolicy: "",
      isActive: true,
      hasProjectManagement: true,
      hasPrivacy: true,
    },
  });

  const watchProjectManagement = watch("hasProjectManagement", true);
  const watchPrivacy = watch("hasPrivacy", true);

  const save = useMutation({
    mutationFn: (data: FormValues) => {
      const payload: QubartechProductInput = {
        name: data.name,
        slug: data.slug,
        category: data.category || null,
        description: data.description || null,
        features: data.features || null,
        icon: data.icon || null,
        color: data.color || null,
        tags: data.tags || null,
        image: data.image || null,
        link: data.link || null,
        status: data.status,
        privacyPolicy: data.privacyPolicy || null,
        isActive: data.isActive,
        hasProjectManagement: data.hasProjectManagement,
        hasPrivacy: data.hasPrivacy,
      };
      return editingId
        ? qubartechProductsApi.update(editingId, payload)
        : qubartechProductsApi.create(payload);
    },
    onSuccess: () => {
      toast.success(editingId ? "Product updated" : "Product created");
      qc.invalidateQueries({ queryKey: ["qubartech", "products"] });
      closeModal();
    },
    onError: (e: Error) => {
      toast.error(e.message || "Failed to save product details");
    },
  });

  const remove = useMutation({
    mutationFn: qubartechProductsApi.remove,
    onSuccess: () => {
      toast.success("Product deleted");
      qc.invalidateQueries({ queryKey: ["qubartech", "products"] });
    },
    onError: (e: Error) => {
      toast.error(e.message || "Failed to delete product");
    },
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      qubartechProductsApi.update(id, { isActive }),
    onSuccess: () => {
      toast.success("Product status updated");
      qc.invalidateQueries({ queryKey: ["qubartech", "products"] });
    },
  });

  const openAddModal = () => {
    setEditingId(null);
    reset({
      name: "",
      slug: "",
      category: "productivity",
      description: "",
      features: "",
      icon: "📺",
      color: "from-purple-500 to-pink-500",
      tags: "",
      image: "",
      link: "#",
      status: "live",
      privacyPolicy: "",
      isActive: true,
      hasProjectManagement: true,
      hasPrivacy: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (product: QubartechProduct) => {
    setEditingId(product.id);
    reset({
      name: product.name,
      slug: product.slug,
      category: product.category ?? "",
      description: product.description ?? "",
      features: product.features ?? "",
      icon: product.icon ?? "📺",
      color: product.color ?? "from-purple-500 to-pink-500",
      tags: product.tags ?? "",
      image: product.image ?? "",
      link: product.link ?? "#",
      status: product.status,
      privacyPolicy: product.privacyPolicy ?? "",
      isActive: product.isActive,
      hasProjectManagement: product.hasProjectManagement ?? true,
      hasPrivacy: product.hasPrivacy ?? true,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  const columns: Column<QubartechProduct>[] = [
    {
      key: "name",
      header: "Product / Project Name",
      render: (p) => (
        <div className="flex items-center gap-2.5">
          <span className="text-xl shrink-0 select-none">{p.icon || "📦"}</span>
          <div>
            <div className="font-bold text-slate-800 dark:text-slate-200">{p.name}</div>
            <div className="text-xs text-slate-400 dark:text-zinc-550 flex items-center gap-1">
              Slug: <code className="bg-slate-100 dark:bg-zinc-800 px-1 py-0.2 rounded font-mono font-medium">{p.slug}</code>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (p) => <span className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-zinc-450">{p.category || "n/a"}</span>,
    },
    {
      key: "options",
      header: "Configured Features",
      render: (p) => (
        <div className="flex flex-col gap-1 text-xs">
          <span className="flex items-center gap-1">
            <span className={`h-2 w-2 rounded-full ${p.hasProjectManagement ? "bg-emerald-500" : "bg-slate-300"}`} />
            <span className={p.hasProjectManagement ? "font-semibold text-slate-700 dark:text-slate-300" : "text-slate-400"}>Project Mgmt</span>
          </span>
          <span className="flex items-center gap-1">
            <span className={`h-2 w-2 rounded-full ${p.hasPrivacy ? "bg-emerald-500" : "bg-slate-300"}`} />
            <span className={p.hasPrivacy ? "font-semibold text-slate-700 dark:text-slate-300" : "text-slate-400"}>Privacy Policy</span>
          </span>
        </div>
      ),
    },
    {
      key: "privacy",
      header: "Privacy Policy status",
      render: (p) => (
        <span className="flex items-center gap-1.5 text-xs">
          {!p.hasPrivacy ? (
            <span className="inline-flex items-center gap-1 font-semibold text-slate-400 bg-slate-50 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
              Disabled
            </span>
          ) : p.privacyPolicy ? (
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-605 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-md">
              <FileText className="h-3.5 w-3.5" /> Configured ({p.privacyPolicy.length} chars)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-md">
              <ShieldAlert className="h-3.5 w-3.5" /> Not Configured
            </span>
          )}
        </span>
      ),
    },
    {
      key: "isActive",
      header: "Active on Site",
      render: (p) => (
        <button
          onClick={() => toggleActive.mutate({ id: p.id, isActive: !p.isActive })}
          className="cursor-pointer transition-transform active:scale-95"
        >
          {p.isActive ? (
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
      render: (p) => (
        <div className="flex justify-end gap-1.5">
          {p.isActive && p.hasPrivacy && (
            <a
              href={`http://localhost:3000/products/${p.slug}/privecy`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary p-2 flex items-center justify-center"
              title="Preview Privacy Policy Page"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          <button className="btn-secondary p-2" onClick={() => openEditModal(p)} title="Edit Product / Policy">
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            className="btn-danger p-2"
            onClick={() => {
              if (confirm(`Delete product ${p.name}?`)) {
                remove.mutate(p.id);
              }
            }}
            title="Delete Product"
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
        title="QubarTech Project Privacy Policies"
        description="Manage software products, listings, and dynamic Privacy Policies for the website."
        actions={
          <button className="btn-primary flex items-center gap-2" onClick={openAddModal}>
            <Plus className="h-4 w-4" /> Add Product / Project
          </button>
        }
      />

      <DataTable
        rows={products}
        loading={isLoading}
        columns={columns}
        rowKey={(p) => p.id}
        empty="No products registered yet"
      />

      <Modal open={modalOpen} onClose={closeModal} title={editingId ? "Edit Product & Privacy Policy" : "Add Product & Privacy Policy"}>
        <form
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          onSubmit={handleSubmit((data) => save.mutate(data))}
        >
          {/* Name */}
          <div>
            <label className="label">Product / Project Name</label>
            <input className="input" type="text" {...register("name")} placeholder="e.g. PlayQue - Track Playlists" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          {/* Slug */}
          <div>
            <label className="label">URL Slug (Lowercase, no spaces)</label>
            <input className="input font-mono" type="text" {...register("slug")} placeholder="e.g. playque" />
            {errors.slug && <p className="text-xs text-red-500 mt-1">{errors.slug.message}</p>}
          </div>

          {/* Feature Configuration Options */}
          <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-slate-200/60 dark:border-zinc-800/80 mb-2">
            <div className="flex items-start gap-2.5">
              <input 
                type="checkbox" 
                id="hasProjectManagement" 
                className="rounded border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-brand-600 focus:ring-brand-500 h-4.5 w-4.5 mt-0.5"
                {...register("hasProjectManagement")} 
              />
              <div>
                <label htmlFor="hasProjectManagement" className="text-sm font-bold text-slate-800 dark:text-slate-200 select-none cursor-pointer">
                  Project Management
                </label>
                <p className="text-xs text-slate-500">Add descriptions, features, tags, and show on the products listing page.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <input 
                type="checkbox" 
                id="hasPrivacy" 
                className="rounded border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-brand-600 focus:ring-brand-500 h-4.5 w-4.5 mt-0.5"
                {...register("hasPrivacy")} 
              />
              <div>
                <label htmlFor="hasPrivacy" className="text-sm font-bold text-slate-800 dark:text-slate-200 select-none cursor-pointer">
                  Privacy Policy
                </label>
                <p className="text-xs text-slate-500">Enable dynamic privacy policy content and details page.</p>
              </div>
            </div>
          </div>

          {/* Project Management Fields */}
          {watchProjectManagement && (
            <>
              {/* Category */}
              <div>
                <label className="label">Category</label>
                <input className="input" type="text" {...register("category")} placeholder="e.g. productivity" />
              </div>

              {/* Icon */}
              <div>
                <label className="label">Icon Emoji</label>
                <input className="input" type="text" {...register("icon")} placeholder="e.g. 📺" />
              </div>

              {/* Color Gradient config */}
              <div>
                <label className="label">Color Tailwind Gradient (Optional)</label>
                <input className="input font-mono text-xs" type="text" {...register("color")} placeholder="from-purple-500 to-pink-500" />
              </div>

              {/* Status */}
              <div>
                <label className="label">Status</label>
                <select className="input" {...register("status")}>
                  <option value="live">Live / Production</option>
                  <option value="beta">Beta Testing</option>
                  <option value="development">In Development</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* External Link */}
              <div>
                <label className="label">Website / App Store URL Link</label>
                <input className="input" type="text" {...register("link")} placeholder="e.g. https://playque.com" />
              </div>

              {/* Image */}
              <div>
                <label className="label">Feature Image URL</label>
                <input className="input" type="text" {...register("image")} placeholder="e.g. https://i.ibb.co/..." />
              </div>

              {/* Tags */}
              <div className="sm:col-span-2">
                <label className="label">Tags (comma-separated)</label>
                <input className="input" type="text" {...register("tags")} placeholder="e.g. Productivity, Playlists, Tracker" />
              </div>

              {/* Features list */}
              <div className="sm:col-span-2">
                <label className="label">Product Features (comma-separated)</label>
                <input className="input" type="text" {...register("features")} placeholder="e.g. Add playlists via URL, Track completed videos, Daily reminders" />
              </div>
            </>
          )}

          {/* Privacy Policy Fields */}
          {watchPrivacy && (
            <div className="sm:col-span-2">
              <label className="label font-bold text-slate-800 dark:text-slate-200">Privacy Policy Text (Markdown / Text supported)</label>
              <textarea
                className="input font-mono text-xs min-h-[300px] leading-relaxed p-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl"
                {...register("privacyPolicy")}
                placeholder={`# Privacy Policy for Your Product
Last updated: June 2026.

## 1. Information Collection
We collect...`}
              />
            </div>
          )}

          {/* Active Status */}
          <div className="sm:col-span-2 flex items-center gap-3 py-1">
            <input className="rounded border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-brand-600 focus:ring-brand-500 h-4.5 w-4.5" type="checkbox" id="isActiveProduct" {...register("isActive")} />
            <label htmlFor="isActiveProduct" className="text-sm font-semibold text-slate-700 dark:text-slate-200 select-none cursor-pointer">Publish on Qubartech Website</label>
          </div>

          <div className="sm:col-span-2 border-t border-slate-100 dark:border-zinc-800 pt-4 mt-2 flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={save.isPending}>
              {save.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5 inline" />}
              {editingId ? "Update Product" : "Create Product"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
