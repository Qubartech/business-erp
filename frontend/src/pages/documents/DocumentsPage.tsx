import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Modal } from "@/components/Modal";
import { documentsApi } from "@/services/featureApis";
import { projectsApi } from "@/services/api";
import type { Document } from "@/types";
import { formatDate } from "@/lib/format";

export default function DocumentsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [projectId, setProjectId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filterProj, setFilterProj] = useState("");

  const { data: projects } = useQuery({ queryKey: ["projects","all"], queryFn: () => projectsApi.list({ pageSize: 100 }) });
  const { data, isLoading } = useQuery({
    queryKey: ["documents", filterProj],
    queryFn: () => documentsApi.list({ projectId: filterProj || undefined, pageSize: 100 }),
  });

  const upload = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append("title", title);
      if (category) fd.append("category", category);
      if (projectId) fd.append("projectId", projectId);
      if (file) fd.append("file", file);
      return documentsApi.upload(fd);
    },
    onSuccess: () => {
      toast.success("Uploaded"); setOpen(false); setTitle(""); setCategory(""); setProjectId(""); setFile(null);
      qc.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function download(d: Document) {
    try {
      const res = await documentsApi.download(d.id);
      window.open(res.url, "_blank", "noopener");
    } catch (e) { toast.error((e as Error).message); }
  }
  const remove = useMutation({
    mutationFn: (id: string) => documentsApi.remove(id),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["documents"] }); },
  });

  const cols: Column<Document>[] = [
    { key: "t", header: "Title", render: (d) => <span className="font-medium text-slate-900">{d.title}</span> },
    { key: "p", header: "Project", render: (d) => d.project?.name ?? "—" },
    { key: "c", header: "Category", render: (d) => d.category ?? "—" },
    { key: "u", header: "Uploader", render: (d) => d.uploader?.name ?? "—" },
    { key: "d", header: "Uploaded", render: (d) => formatDate(d.createdAt) },
    { key: "a", header: "", render: (d) => (
      <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
        <button className="btn-secondary" onClick={() => download(d)}>Download</button>
        <button className="btn-danger" onClick={() => remove.mutate(d.id)}>Delete</button>
      </div>
    ), className: "text-right" },
  ];

  return (
    <>
      <PageHeader title="Documents" actions={<button className="btn-primary" onClick={() => setOpen(true)}>Upload</button>} />
      <div className="mb-3">
        <select className="input max-w-[240px]" value={filterProj} onChange={(e) => setFilterProj(e.target.value)}>
          <option value="">All projects</option>
          {projects?.items.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <DataTable rows={data?.items} loading={isLoading} columns={cols} rowKey={(d) => d.id} />

      <Modal open={open} onClose={() => setOpen(false)} title="Upload document"
        footer={<>
          <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" disabled={!title || !file || upload.isPending} onClick={() => upload.mutate()}>Upload</button>
        </>}>
        <div className="space-y-3">
          <input className="input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className="input" placeholder="Category (optional)" value={category} onChange={(e) => setCategory(e.target.value)} />
          <select className="input" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">No project</option>
            {projects?.items.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input className="input" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>
      </Modal>
    </>
  );
}
