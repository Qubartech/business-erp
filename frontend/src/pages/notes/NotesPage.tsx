import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { notesApi } from "@/services/featureApis";
import type { Note } from "@/types";
import { Loader2 } from "lucide-react";

export default function NotesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data } = useQuery({ queryKey: ["notes", search], queryFn: () => notesApi.list({ search: search || undefined, pageSize: 100 }) });
  function pick(n: Note) { setSelected(n); setTitle(n.title); setContent(n.content); }
  function blank() { setSelected(null); setTitle(""); setContent(""); }

  const save = useMutation({
    mutationFn: async () => selected ? notesApi.update(selected.id, { title, content }) : notesApi.create({ title, content }),
    onSuccess: (n) => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["notes"] }); pick(n); },
  });
  const remove = useMutation({
    mutationFn: () => notesApi.remove(selected!.id),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["notes"] }); blank(); },
  });

  return (
    <>
      <PageHeader title="Notes" actions={<button className="btn-primary" disabled={save.isPending || remove.isPending} onClick={blank}>New note</button>} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <input className="input mb-2" placeholder="Search notes" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="card divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
            {data?.items.map((n) => (
              <button key={n.id} onClick={() => pick(n)}
                disabled={save.isPending || remove.isPending}
                className={`w-full text-left p-3 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed ${selected?.id === n.id ? "bg-brand-50" : ""}`}>
                <div className="font-medium text-sm text-slate-900 truncate">{n.title || "Untitled"}</div>
                <div className="text-xs text-slate-500 truncate">{n.content.replace(/<[^>]+>/g," ").slice(0, 80)}</div>
              </button>
            ))}
            {data?.items.length === 0 && <div className="p-4 text-sm text-slate-500">No notes yet.</div>}
          </div>
        </div>
        <div className="lg:col-span-2 card p-4 space-y-3">
          <input className="input text-lg" placeholder="Title" disabled={save.isPending || remove.isPending} value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea className="input min-h-[300px]" placeholder="Write here…" disabled={save.isPending || remove.isPending} value={content} onChange={(e) => setContent(e.target.value)} />
          <div className="flex justify-end gap-2">
            {selected && (
              <button
                className="btn-danger"
                disabled={save.isPending || remove.isPending}
                onClick={() => remove.mutate()}
              >
                {remove.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5 inline" />}
                Delete
              </button>
            )}
            <button
              className="btn-primary"
              disabled={!title || save.isPending || remove.isPending}
              onClick={() => save.mutate()}
            >
              {save.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5 inline" />}
              {selected ? "Save" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
