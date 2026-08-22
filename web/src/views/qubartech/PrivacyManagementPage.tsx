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
  Sparkles,
  Heart
} from "lucide-react";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-_]+$/, "Slug must only contain lowercase alphanumeric characters, dashes, and underscores"),
  shortName: z.string().nullable().optional(),
  tagline: z.string().nullable().optional(),
  badge: z.string().nullable().optional(),
  isNonProfit: z.boolean().default(false),
  category: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  features: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  coverGradient: z.string().nullable().optional(),
  tags: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  link: z.string().nullable().optional(),
  githubUrl: z.string().nullable().optional(),
  techStack: z.string().nullable().optional(),
  mission: z.string().nullable().optional(),
  stats: z.string().nullable().optional(),
  detailsContent: z.string().nullable().optional(),
  status: z.string().default("live"),
  privacyPolicy: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  hasProjectManagement: z.boolean().default(true),
  hasDetails: z.boolean().default(true),
  hasPrivacy: z.boolean().default(true),
});

type FormValues = z.infer<typeof productSchema>;

export default function PrivacyManagementPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"pm" | "details" | "privacy">("pm");

  const { data: products, isLoading } = useQuery({
    queryKey: ["qubartech", "products"],
    queryFn: qubartechProductsApi.list,
  });

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(productSchema as any),
    defaultValues: {
      name: "",
      slug: "",
      shortName: "",
      tagline: "",
      badge: "Product Showcase",
      isNonProfit: false,
      category: "productivity",
      description: "",
      features: "",
      icon: "💼",
      color: "from-blue-600 via-indigo-600 to-violet-700",
      coverGradient: "from-slate-950 via-indigo-950 to-gray-950",
      tags: "",
      image: "",
      link: "#",
      githubUrl: "",
      techStack: "",
      mission: "",
      stats: "",
      detailsContent: "",
      status: "live",
      privacyPolicy: "",
      isActive: true,
      hasProjectManagement: true,
      hasDetails: true,
      hasPrivacy: true,
    },
  });

  const watchProjectManagement = watch("hasProjectManagement", true);
  const watchDetails = watch("hasDetails", true);
  const watchPrivacy = watch("hasPrivacy", true);

  const save = useMutation({
    mutationFn: (data: FormValues) => {
      const payload: QubartechProductInput = {
        name: data.name,
        slug: data.slug,
        shortName: data.shortName || null,
        tagline: data.tagline || null,
        badge: data.badge || null,
        isNonProfit: Boolean(data.isNonProfit),
        category: data.category || null,
        description: data.description || null,
        features: data.features || null,
        icon: data.icon || null,
        color: data.color || null,
        coverGradient: data.coverGradient || null,
        tags: data.tags || null,
        image: data.image || null,
        link: data.link || null,
        githubUrl: data.githubUrl || null,
        techStack: data.techStack || null,
        mission: data.mission || null,
        stats: data.stats || null,
        detailsContent: data.detailsContent || null,
        status: data.status,
        privacyPolicy: data.privacyPolicy || null,
        isActive: data.isActive,
        hasProjectManagement: data.hasProjectManagement,
        hasDetails: data.hasDetails,
        hasPrivacy: data.hasPrivacy,
      };

      return editingId
        ? qubartechProductsApi.update(editingId, payload)
        : qubartechProductsApi.create(payload);
    },
    onSuccess: () => {
      toast.success(editingId ? "Product updated successfully" : "Product created successfully");
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
    setActiveTab("pm");
    reset({
      name: "",
      slug: "",
      shortName: "",
      tagline: "",
      badge: "Product Showcase",
      isNonProfit: false,
      category: "productivity",
      description: "",
      features: "",
      icon: "💼",
      color: "from-blue-600 via-indigo-600 to-violet-700",
      coverGradient: "from-slate-950 via-indigo-950 to-gray-950",
      tags: "",
      image: "",
      link: "#",
      githubUrl: "",
      techStack: "",
      mission: "",
      stats: "",
      detailsContent: "",
      status: "live",
      privacyPolicy: "",
      isActive: true,
      hasProjectManagement: true,
      hasDetails: true,
      hasPrivacy: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (product: QubartechProduct) => {
    setEditingId(product.id);
    setActiveTab("pm");
    reset({
      name: product.name,
      slug: product.slug,
      shortName: product.shortName ?? "",
      tagline: product.tagline ?? "",
      badge: product.badge ?? "Product Showcase",
      isNonProfit: product.isNonProfit ?? false,
      category: product.category ?? "",
      description: product.description ?? "",
      features: product.features ?? "",
      icon: product.icon ?? "💼",
      color: product.color ?? "from-blue-600 via-indigo-600 to-violet-700",
      coverGradient: product.coverGradient ?? "from-slate-950 via-indigo-950 to-gray-950",
      tags: product.tags ?? "",
      image: product.image ?? "",
      link: product.link ?? "#",
      githubUrl: product.githubUrl ?? "",
      techStack: product.techStack ?? "",
      mission: product.mission ?? "",
      stats: product.stats ?? "",
      detailsContent: product.detailsContent ?? "",
      status: product.status,
      privacyPolicy: product.privacyPolicy ?? "",
      isActive: product.isActive,
      hasProjectManagement: product.hasProjectManagement ?? true,
      hasDetails: product.hasDetails ?? true,
      hasPrivacy: product.hasPrivacy ?? true,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  const getWebsiteBaseUrl = () => {
    if (typeof window !== "undefined" && (window.location.hostname.includes("localhost") || window.location.hostname.includes("127.0.0.1"))) {
      return "http://localhost:3000";
    }
    return "https://qubartech.com";
  };

  const columns: Column<QubartechProduct>[] = [
    {
      key: "name",
      header: "Product / Project Name",
      render: (p) => (
        <div className="flex items-center gap-2.5">
          <span className="text-2xl shrink-0 select-none p-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800">{p.icon || "📦"}</span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-800 dark:text-slate-200">{p.name}</span>
              {p.isNonProfit && (
                <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[10px] font-bold text-emerald-600 border border-emerald-500/20">
                  <Heart className="h-2.5 w-2.5 fill-emerald-500 text-emerald-500" /> Non-Profit
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 dark:text-zinc-500 flex items-center gap-1 mt-0.5">
              Slug: <code className="bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono font-medium">{p.slug}</code>
              {p.shortName && <span className="text-slate-500">• {p.shortName}</span>}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category & Badge",
      render: (p) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs uppercase font-bold tracking-wider text-slate-600 dark:text-zinc-400">{p.category || "n/a"}</span>
          {p.badge && <span className="text-[11px] text-slate-400 dark:text-zinc-500">{p.badge}</span>}
        </div>
      ),
    },
    {
      key: "options",
      header: "Enabled Systems",
      render: (p) => (
        <div className="flex flex-col gap-1 text-xs">
          <span className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${p.hasProjectManagement ? "bg-emerald-500" : "bg-slate-300 dark:bg-zinc-700"}`} />
            <span className={p.hasProjectManagement ? "font-semibold text-slate-700 dark:text-slate-300" : "text-slate-400"}>Listing</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${p.hasDetails ? "bg-indigo-500" : "bg-slate-300 dark:bg-zinc-700"}`} />
            <span className={p.hasDetails ? "font-semibold text-indigo-600 dark:text-indigo-400" : "text-slate-400"}>Details Page</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${p.hasPrivacy ? "bg-teal-500" : "bg-slate-300 dark:bg-zinc-700"}`} />
            <span className={p.hasPrivacy ? "font-semibold text-teal-600 dark:text-teal-400" : "text-slate-400"}>Privacy Policy</span>
          </span>
        </div>
      ),
    },
    {
      key: "privacy",
      header: "Privacy Status",
      render: (p) => (
        <span className="flex items-center gap-1.5 text-xs">
          {!p.hasPrivacy ? (
            <span className="inline-flex items-center gap-1 font-semibold text-slate-400 bg-slate-50 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
              Disabled
            </span>
          ) : p.privacyPolicy ? (
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-md">
              <FileText className="h-3.5 w-3.5" /> Configured
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-md">
              <ShieldAlert className="h-3.5 w-3.5" /> Not Set
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
          title="Click to toggle active status"
        >
          {p.isActive ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <CheckCircle className="h-3.5 w-3.5" /> Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full border border-slate-300 dark:border-zinc-700">
              <XCircle className="h-3.5 w-3.5" /> Inactive
            </span>
          )}
        </button>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (p) => {
        const baseUrl = getWebsiteBaseUrl();
        return (
          <div className="flex justify-end gap-1.5">
            {p.isActive && p.hasDetails && (
              <a
                href={`${baseUrl}/products/${p.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary p-2 flex items-center justify-center text-indigo-600 hover:text-indigo-700"
                title="Preview Product Details Page"
              >
                <Sparkles className="h-3.5 w-3.5" />
              </a>
            )}
            {p.isActive && p.hasPrivacy && (
              <a
                href={`${baseUrl}/products/${p.slug}/privacy`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary p-2 flex items-center justify-center text-teal-600 hover:text-teal-700"
                title="Preview Privacy Policy Page"
              >
                <FileText className="h-3.5 w-3.5" />
              </a>
            )}
            <button className="btn-secondary p-2" onClick={() => openEditModal(p)} title="Edit Product & Details">
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
        );
      },
      className: "text-right",
    },
  ];

  return (
    <>
      <PageHeader
        title="QubarTech Products & Details Management"
        description="Manage software products, rich detail pages, specifications, and live Privacy Policies across the QubarTech ecosystem."
        actions={
          <button className="btn-primary flex items-center gap-2 shadow-lg" onClick={openAddModal}>
            <Plus className="h-4 w-4" /> Add New Product
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

      <Modal open={modalOpen} onClose={closeModal} title={editingId ? "Edit Product & Details System" : "Add New Product & Details System"}>
        <form
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          onSubmit={handleSubmit((data) => save.mutate(data))}
        >
          {/* Name */}
          <div>
            <label className="label font-bold text-slate-800 dark:text-slate-200">Product Full Name</label>
            <input className="input" type="text" {...register("name")} placeholder="e.g. QubarTech Business ERP" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          {/* Slug */}
          <div>
            <label className="label font-bold text-slate-800 dark:text-slate-200">URL Slug (Lowercase, no spaces)</label>
            <input className="input font-mono" type="text" {...register("slug")} placeholder="e.g. business-erp" />
            {errors.slug && <p className="text-xs text-red-500 mt-1">{errors.slug.message}</p>}
          </div>

          {/* Tab Selector */}
          <div className="sm:col-span-2 flex bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("pm")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "pm"
                  ? "bg-white dark:bg-zinc-800 text-slate-800 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
            >
              <FolderKanban className="h-4 w-4" />
              <span>1. Basic & Listing</span>
              {watchProjectManagement && <span className="h-2 w-2 rounded-full bg-emerald-500" />}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("details")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "details"
                  ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>2. Product Details System</span>
              {watchDetails && <span className="h-2 w-2 rounded-full bg-indigo-500" />}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("privacy")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "privacy"
                  ? "bg-white dark:bg-zinc-800 text-teal-600 dark:text-teal-400 shadow-sm"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>3. Privacy Policy</span>
              {watchPrivacy && <span className="h-2 w-2 rounded-full bg-teal-500" />}
            </button>
          </div>

          {/* TAB 1: Basic & Listing Content */}
          {activeTab === "pm" && (
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 flex items-center gap-2.5 bg-slate-50 dark:bg-zinc-900/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-zinc-800/80">
                <input 
                  type="checkbox" 
                  id="hasProjectManagement" 
                  className="rounded border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-brand-600 focus:ring-brand-500 h-4.5 w-4.5 cursor-pointer"
                  {...register("hasProjectManagement")} 
                />
                <div>
                  <label htmlFor="hasProjectManagement" className="text-sm font-bold text-slate-800 dark:text-slate-200 select-none cursor-pointer">
                    Enable Public Products Listing
                  </label>
                  <p className="text-xs text-slate-500">Show this product on the main /products showcase directory.</p>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="label">Category</label>
                <input className="input" type="text" {...register("category")} placeholder="e.g. Enterprise & Productivity" />
              </div>

              {/* Icon */}
              <div>
                <label className="label">Icon Emoji</label>
                <input className="input" type="text" {...register("icon")} placeholder="e.g. 💼" />
              </div>

              {/* Color Gradient config */}
              <div>
                <label className="label">Card Tailwind Gradient</label>
                <input className="input font-mono text-xs" type="text" {...register("color")} placeholder="from-blue-600 via-indigo-600 to-violet-700" />
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
                <label className="label">Live Web App URL</label>
                <input className="input" type="text" {...register("link")} placeholder="e.g. https://erp.qubartech.com" />
              </div>

              {/* Image */}
              <div>
                <label className="label">Feature Image URL</label>
                <input className="input" type="text" {...register("image")} placeholder="e.g. https://images.unsplash.com/..." />
              </div>

              {/* Tags */}
              <div className="sm:col-span-2">
                <label className="label">Tags (comma-separated)</label>
                <input className="input" type="text" {...register("tags")} placeholder="e.g. Enterprise, ERP, Project Management, Time Tracking" />
              </div>

              {/* Features list */}
              <div className="sm:col-span-2">
                <label className="label">Quick Features (comma-separated)</label>
                <input className="input" type="text" {...register("features")} placeholder="e.g. Integrated Sprint Kanban, Live Time Tracker, Double-entry Ledger" />
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label className="label">Short Description</label>
                <textarea 
                  className="input min-h-[90px] leading-relaxed p-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl"
                  {...register("description")} 
                  placeholder="Enter a clear summary of what this product solves..."
                />
              </div>
            </div>
          )}

          {/* TAB 2: Product Details System */}
          {activeTab === "details" && (
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 flex items-center justify-between bg-indigo-50/70 dark:bg-indigo-950/30 p-3.5 rounded-xl border border-indigo-200/70 dark:border-indigo-800/50">
                <div className="flex items-center gap-2.5">
                  <input 
                    type="checkbox" 
                    id="hasDetails" 
                    className="rounded border-indigo-300 dark:border-indigo-700 bg-white dark:bg-zinc-800 text-indigo-600 focus:ring-indigo-500 h-4.5 w-4.5 cursor-pointer"
                    {...register("hasDetails")} 
                  />
                  <div>
                    <label htmlFor="hasDetails" className="text-sm font-bold text-indigo-950 dark:text-indigo-200 select-none cursor-pointer">
                      Enable Dedicated Product Detail Page (/products/[slug])
                    </label>
                    <p className="text-xs text-indigo-700 dark:text-indigo-400">Generates dynamic high-conversion showcase page with stats, architecture & mission.</p>
                  </div>
                </div>

                {watchDetails && (
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="isNonProfit" 
                      className="rounded border-emerald-300 dark:border-emerald-700 bg-white dark:bg-zinc-800 text-emerald-600 focus:ring-emerald-500 h-4.5 w-4.5 cursor-pointer"
                      {...register("isNonProfit")} 
                    />
                    <label htmlFor="isNonProfit" className="text-xs font-bold text-emerald-800 dark:text-emerald-300 select-none cursor-pointer">
                      ❤️ Non-Profit Initiative
                    </label>
                  </div>
                )}
              </div>

              {watchDetails ? (
                <>
                  {/* Short Name */}
                  <div>
                    <label className="label">Short Display Name</label>
                    <input className="input" type="text" {...register("shortName")} placeholder="e.g. Business ERP" />
                  </div>

                  {/* Badge */}
                  <div>
                    <label className="label">Header Badge</label>
                    <input className="input" type="text" {...register("badge")} placeholder="e.g. 🏢 Enterprise Suite" />
                  </div>

                  {/* Tagline */}
                  <div className="sm:col-span-2">
                    <label className="label">Hero Tagline</label>
                    <input className="input" type="text" {...register("tagline")} placeholder="e.g. Modern Unified ERP for Engineering Teams" />
                  </div>

                  {/* GitHub URL */}
                  <div>
                    <label className="label">GitHub Repository URL (Optional)</label>
                    <input className="input" type="text" {...register("githubUrl")} placeholder="e.g. https://github.com/qubartech" />
                  </div>

                  {/* Cover Gradient */}
                  <div>
                    <label className="label">Hero Ambient Gradient</label>
                    <input className="input font-mono text-xs" type="text" {...register("coverGradient")} placeholder="from-slate-950 via-indigo-950 to-gray-950" />
                  </div>

                  {/* Tech Stack */}
                  <div className="sm:col-span-2">
                    <label className="label">Tech Stack (comma-separated)</label>
                    <input className="input font-mono text-xs" type="text" {...register("techStack")} placeholder="Next.js 16, React 19, TypeScript, Prisma ORM, PostgreSQL, TailwindCSS" />
                  </div>

                  {/* Key Stats (JSON) */}
                  <div className="sm:col-span-2">
                    <label className="label font-bold text-slate-800 dark:text-slate-200">Key Statistics (JSON array: [{`{"label": "...", "value": "..."}`}, ...])</label>
                    <textarea
                      className="input font-mono text-xs min-h-[80px] leading-relaxed p-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl"
                      {...register("stats")}
                      placeholder={`[{"label": "Core Modules", "value": "7+ Systems"}, {"label": "Architecture", "value": "Next.js 16"}]`}
                    />
                  </div>

                  {/* Mission */}
                  <div className="sm:col-span-2">
                    <label className="label">Mission Statement & Engineering Philosophy</label>
                    <textarea 
                      className="input min-h-[80px] leading-relaxed p-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl"
                      {...register("mission")} 
                      placeholder="Why we built this product and our architectural philosophy..."
                    />
                  </div>

                  {/* Detailed Markdown Content */}
                  <div className="sm:col-span-2">
                    <label className="label font-bold text-slate-800 dark:text-slate-200">Extended Details & Architecture (Markdown)</label>
                    <textarea 
                      className="input font-mono text-xs min-h-[160px] leading-relaxed p-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl"
                      {...register("detailsContent")} 
                      placeholder={`# Product Deep-Dive
Detailed architecture notes, modules overview, and integration guide...`}
                    />
                  </div>
                </>
              ) : (
                <div className="sm:col-span-2 py-8 text-center text-slate-400 dark:text-zinc-500">
                  Product Details system is disabled for this product.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Privacy Policy */}
          {activeTab === "privacy" && (
            <div className="sm:col-span-2 grid grid-cols-1 gap-4">
              <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-zinc-900/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-zinc-800/80">
                <input 
                  type="checkbox" 
                  id="hasPrivacy" 
                  className="rounded border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-brand-600 focus:ring-brand-500 h-4.5 w-4.5 cursor-pointer"
                  {...register("hasPrivacy")} 
                />
                <div>
                  <label htmlFor="hasPrivacy" className="text-sm font-bold text-slate-800 dark:text-slate-200 select-none cursor-pointer">
                    Enable Public Privacy Policy Page (/products/[slug]/privacy)
                  </label>
                  <p className="text-xs text-slate-500">Configure dynamic legal data handling and GDPR/Play Store compliance terms.</p>
                </div>
              </div>

              {watchPrivacy ? (
                <div>
                  <label className="label font-bold text-slate-800 dark:text-slate-200">Privacy Policy Text (Markdown supported)</label>
                  <textarea
                    className="input font-mono text-xs min-h-[280px] leading-relaxed p-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl"
                    {...register("privacyPolicy")}
                    placeholder={`# Privacy Policy for Your Product
Last updated: June 2026.

## 1. Information Collection & Use
We take privacy seriously...`}
                  />
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 dark:text-zinc-500">
                  Privacy Policy page is disabled for this product.
                </div>
              )}
            </div>
          )}

          {/* Active Status */}
          <div className="sm:col-span-2 flex items-center justify-between py-2 border-t border-slate-100 dark:border-zinc-800 pt-4">
            <div className="flex items-center gap-3">
              <input className="rounded border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-brand-600 focus:ring-brand-500 h-4.5 w-4.5 cursor-pointer" type="checkbox" id="isActiveProduct" {...register("isActive")} />
              <label htmlFor="isActiveProduct" className="text-sm font-semibold text-slate-700 dark:text-slate-200 select-none cursor-pointer">Publish on Qubartech Main Website</label>
            </div>
          </div>

          <div className="sm:col-span-2 border-t border-slate-100 dark:border-zinc-800 pt-4 mt-2 flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn-primary flex items-center gap-2" disabled={save.isPending}>
              {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingId ? "Update Product & Details" : "Create Product & Details"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
