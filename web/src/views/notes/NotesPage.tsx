import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { PageHeader } from "@/components/PageHeader";
import { notesApi } from "@/services/featureApis";
import type { Note } from "@/types";
import { Loader2, Plus, Search, Pin, Trash2, X, FileText } from "lucide-react";
import { LoadingPage } from "@/components/Loading";

interface NoteMeta {
  color?: string;
  category?: string;
  pinned?: boolean;
}

export default function NotesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | "pinned" | "work" | "personal" | "ideas" | "todo">("all");
  const [sortBy, setSortBy] = useState<"updated" | "title">("updated");

  // Editor Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalNote, setModalNote] = useState<Note | null>(null);
  const [modalTitle, setModalTitle] = useState("");
  const [modalContent, setModalContent] = useState("");
  const [modalColor, setModalColor] = useState<string>("neutral");
  const [modalCategory, setModalCategory] = useState<string>("work");
  const [modalPinned, setModalPinned] = useState<boolean>(false);

  const { data, isLoading } = useQuery({
    queryKey: ["notes", search],
    queryFn: () => notesApi.list({ search: search || undefined, pageSize: 100 })
  });

  // One-time automatic migration of legacy localStorage metadata to the database
  useEffect(() => {
    if (!data?.items || data.items.length === 0) return;
    try {
      const stored = localStorage.getItem("qubar_notes_metadata");
      if (stored) {
        const localMeta = JSON.parse(stored) as Record<string, NoteMeta>;
        let hasMigratedAny = false;

        const migratePromises = data.items.map(async (note) => {
          const lMeta = localMeta[note.id];
          if (lMeta) {
            const needsUpdate = 
              (lMeta.color && note.color !== lMeta.color) || 
              (lMeta.category && note.category !== lMeta.category) || 
              (lMeta.pinned !== undefined && note.pinned !== lMeta.pinned);

            if (needsUpdate) {
              hasMigratedAny = true;
              return notesApi.update(note.id, {
                color: lMeta.color || note.color,
                category: lMeta.category || note.category,
                pinned: lMeta.pinned !== undefined ? lMeta.pinned : note.pinned,
              });
            }
          }
          return null;
        });

        Promise.all(migratePromises.filter(Boolean)).then(() => {
          if (hasMigratedAny) {
            toast.success("Migrated note settings to the database");
            qc.invalidateQueries({ queryKey: ["notes"] });
          }
          localStorage.removeItem("qubar_notes_metadata");
        });
      }
    } catch (e) {
      console.error("Migration failed:", e);
    }
  }, [data, qc]);

  const save = useMutation({
    mutationFn: async (variables: { id?: string; title: string; content: string; color: string; category: string; pinned: boolean }) => {
      const { id, title, content, color, category, pinned } = variables;
      if (id) {
        return notesApi.update(id, { title, content, color, category, pinned });
      } else {
        return notesApi.create({ title, content, color, category, pinned });
      }
    },
    onSuccess: (n, variables) => {
      toast.success(variables.id ? "Note saved" : "Note created");
      qc.invalidateQueries({ queryKey: ["notes"] });
      setModalOpen(false);
    },
    onError: (err) => {
      toast.error("Failed to save note");
      console.error(err);
    }
  });

  const remove = useMutation({
    mutationFn: (id: string) => notesApi.remove(id),
    onSuccess: () => {
      toast.success("Note deleted");
      qc.invalidateQueries({ queryKey: ["notes"] });
      setModalOpen(false);
    },
    onError: (err) => {
      toast.error("Failed to delete note");
      console.error(err);
    }
  });

  const openForCreate = () => {
    setModalNote(null);
    setModalTitle("");
    setModalContent("");
    setModalColor("neutral");
    setModalCategory("work");
    setModalPinned(false);
    setModalOpen(true);
  };

  const openForEdit = (note: any) => {
    setModalNote(note);
    setModalTitle(note.title);
    setModalContent(note.content);
    setModalColor(note.color);
    setModalCategory(note.category);
    setModalPinned(note.pinned);
    setModalOpen(true);
  };

  const togglePin = (note: any) => {
    const nextPin = !note.pinned;
    notesApi.update(note.id, { pinned: nextPin })
      .then(() => {
        qc.invalidateQueries({ queryKey: ["notes"] });
        toast.success(nextPin ? "Note pinned" : "Note unpinned");
      })
      .catch((err) => {
        toast.error("Failed to toggle pin state");
        console.error(err);
      });
  };

  const getCardStyles = (colorName: string) => {
    switch (colorName) {
      case "amber":
        return {
          card: "bg-amber-500/[0.03] dark:bg-amber-500/[0.01] border-amber-200/50 dark:border-amber-500/20 hover:border-amber-300 dark:hover:border-amber-500/40 shadow-amber-500/[0.01]",
          stripe: "bg-amber-500",
          badge: "bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200/40 dark:border-amber-500/10",
          dot: "bg-amber-500"
        };
      case "emerald":
        return {
          card: "bg-emerald-500/[0.03] dark:bg-emerald-500/[0.01] border-emerald-200/50 dark:border-emerald-500/20 hover:border-emerald-300 dark:hover:border-emerald-500/40 shadow-emerald-500/[0.01]",
          stripe: "bg-emerald-500",
          badge: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/40 dark:border-emerald-500/10",
          dot: "bg-emerald-500"
        };
      case "blue":
        return {
          card: "bg-blue-500/[0.03] dark:bg-blue-500/[0.01] border-blue-200/50 dark:border-blue-500/20 hover:border-blue-300 dark:hover:border-blue-500/40 shadow-blue-500/[0.01]",
          stripe: "bg-blue-500",
          badge: "bg-blue-50 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-200/40 dark:border-blue-500/10",
          dot: "bg-blue-500"
        };
      case "rose":
        return {
          card: "bg-rose-500/[0.03] dark:bg-rose-500/[0.01] border-rose-200/50 dark:border-rose-500/20 hover:border-rose-300 dark:hover:border-rose-500/40 shadow-rose-500/[0.01]",
          stripe: "bg-rose-500",
          badge: "bg-rose-50 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200/40 dark:border-rose-500/10",
          dot: "bg-rose-500"
        };
      case "violet":
        return {
          card: "bg-violet-500/[0.03] dark:bg-violet-500/[0.01] border-violet-200/50 dark:border-violet-500/20 hover:border-violet-300 dark:hover:border-violet-500/40 shadow-violet-500/[0.01]",
          stripe: "bg-violet-500",
          badge: "bg-violet-50 text-violet-800 dark:bg-violet-950/20 dark:text-violet-400 border border-violet-200/40 dark:border-violet-500/10",
          dot: "bg-violet-500"
        };
      default:
        return {
          card: "bg-white dark:bg-zinc-900/60 border-slate-200/60 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.12]",
          stripe: "bg-slate-300 dark:bg-zinc-650",
          badge: "bg-slate-50 text-slate-700 dark:bg-zinc-900/60 dark:text-zinc-400 border border-slate-200/60 dark:border-white/[0.06]",
          dot: "bg-slate-400 dark:bg-zinc-500"
        };
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const items = data?.items || [];
  const processedNotes = items; // Read straight from note response attributes!

  const filteredNotes = processedNotes.filter(note => {
    if (activeCategory === "all") return true;
    if (activeCategory === "pinned") return note.pinned;
    return note.category === activeCategory;
  });

  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (sortBy === "title") {
      return a.title.localeCompare(b.title);
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const pinnedNotes = sortedNotes.filter(n => n.pinned);
  const otherNotes = sortedNotes.filter(n => !n.pinned);

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-zinc-900 flex items-center justify-center text-slate-400 dark:text-zinc-500 mb-4 border border-slate-200/50 dark:border-white/[0.04]">
        <FileText className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-zinc-100">No notes found</h3>
      <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1 max-w-sm">
        {search || activeCategory !== "all"
          ? "No notes match the selected search filters. Try adjusting your search query or categories."
          : "Create notes to jot down ideas, draft task scopes, or store research information."}
      </p>
      {!search && activeCategory === "all" && (
        <button
          onClick={openForCreate}
          className="btn-primary mt-4 flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" /> Create first note
        </button>
      )}
    </div>
  );

  const renderNoteCard = (note: any) => {
    const styles = getCardStyles(note.color);
    return (
      <div
        key={note.id}
        onClick={() => openForEdit(note)}
        className={`group relative card-premium overflow-hidden p-5 flex flex-col justify-between cursor-pointer border ${styles.card}`}
      >
        <div className={`absolute left-0 top-0 bottom-0 w-[4px] ${styles.stripe}`} />

        <div className="mb-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold text-base text-slate-950 dark:text-zinc-50 line-clamp-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
              {note.title || "Untitled Note"}
            </h3>
            {note.pinned && (
              <Pin className="h-3.5 w-3.5 text-slate-450 dark:text-zinc-450 fill-current flex-shrink-0" />
            )}
          </div>

          <p className="text-sm text-slate-600 dark:text-zinc-350 mt-2 line-clamp-3 leading-relaxed break-words">
            {note.content ? note.content.replace(/<[^>]+>/g, " ") : "No content"}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.04]">
          <span className={`badge uppercase tracking-wider text-[10px] px-2 py-0.5 font-bold ${styles.badge}`}>
            {note.category}
          </span>

          <div className="relative h-6 flex items-center">
            <span className="text-xs text-slate-400 dark:text-zinc-500 group-hover:opacity-0 transition-opacity duration-200">
              {formatDate(note.updatedAt)}
            </span>

            <div className="absolute right-0 opacity-0 group-hover:opacity-100 flex items-center gap-1.5 transition-opacity duration-200" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => togglePin(note)}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                title={note.pinned ? "Unpin note" : "Pin note"}
              >
                <Pin className={`h-3.5 w-3.5 ${note.pinned ? "fill-current text-brand-500" : ""}`} />
              </button>
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to delete this note?")) {
                    remove.mutate(note.id);
                  }
                }}
                className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 transition-colors"
                title="Delete note"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <PageHeader
        title="Notes"
        description="Jot down quick thoughts, ideas, task requirements, or research details."
        actions={
          <button
            onClick={openForCreate}
            className="btn-primary flex items-center gap-1.5 shadow-md shadow-brand-500/10 hover:translate-y-[-1px] active:translate-y-[0px] transition-all"
          >
            <Plus className="h-4 w-4" /> New note
          </button>
        }
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500" />
          <input
            className="input pl-9 pr-4 w-full"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900/60 p-1 rounded-lg border border-slate-200/60 dark:border-white/[0.06]">
            {(["all", "pinned", "work", "personal", "ideas", "todo"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-all duration-200 ${
                  activeCategory === cat
                    ? "bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-sm border border-slate-200/40 dark:border-white/[0.04]"
                    : "text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "updated" | "title")}
            className="input py-1 px-3 text-xs w-auto bg-white dark:bg-zinc-900/60 h-[34px] cursor-pointer"
          >
            <option value="updated">Recent</option>
            <option value="title">Alphabetical</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <LoadingPage message="Loading Notes..." />
      ) : (
        <div className="space-y-6">
          {pinnedNotes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
                <Pin className="h-3.5 w-3.5 fill-current" />
                <span className="text-xs font-semibold tracking-wider uppercase">Pinned</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {pinnedNotes.map(note => renderNoteCard(note))}
              </div>
            </div>
          )}

          {pinnedNotes.length > 0 && otherNotes.length > 0 && (
            <div className="border-t border-slate-200/50 dark:border-white/[0.06] my-6" />
          )}

          {otherNotes.length > 0 ? (
            <div className="space-y-3">
              {pinnedNotes.length > 0 && (
                <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
                  <span className="text-xs font-semibold tracking-wider uppercase">Others</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {otherNotes.map(note => renderNoteCard(note))}
              </div>
            </div>
          ) : (
            pinnedNotes.length === 0 && renderEmptyState()
          )}
        </div>
      )}

      {/* Glassy Note Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 dark:bg-zinc-950/70 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setModalOpen(false)}
          />

          <div className="relative w-full max-w-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden transition-all duration-300 transform scale-100 z-10">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors z-20"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="p-6 pb-4 flex flex-col gap-4 overflow-y-auto flex-1">
              <input
                type="text"
                placeholder="Untitled note"
                value={modalTitle}
                onChange={(e) => setModalTitle(e.target.value)}
                className="w-full text-2xl font-bold border-none outline-none focus:outline-none focus:ring-0 bg-transparent text-slate-950 dark:text-zinc-50 placeholder-slate-350 dark:placeholder-zinc-655 px-0"
              />

              <textarea
                placeholder="Start writing your thoughts here..."
                value={modalContent}
                onChange={(e) => setModalContent(e.target.value)}
                className="w-full text-base border-none outline-none focus:outline-none focus:ring-0 bg-transparent text-slate-700 dark:text-zinc-300 placeholder-slate-400 dark:placeholder-zinc-600 resize-none flex-1 min-h-[280px] px-0 leading-relaxed"
              />
            </div>

            <div className="border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-zinc-900/30 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5" title="Note theme color">
                  {(["neutral", "amber", "emerald", "blue", "rose", "violet"] as const).map((colorName) => {
                    const colorDotStyles = getCardStyles(colorName);
                    return (
                      <button
                        key={colorName}
                        onClick={() => setModalColor(colorName)}
                        className={`h-5 w-5 rounded-full ${colorDotStyles.dot} flex items-center justify-center transition-all ${
                          modalColor === colorName
                            ? "ring-2 ring-offset-2 ring-brand-500 dark:ring-offset-zinc-900 scale-110"
                            : "hover:scale-105 opacity-80 hover:opacity-100"
                        }`}
                      />
                    );
                  })}
                </div>

                <div className="h-4 w-px bg-slate-200 dark:bg-white/[0.08]" />

                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-400 dark:text-zinc-500">Category:</span>
                  <select
                    value={modalCategory}
                    onChange={(e) => setModalCategory(e.target.value)}
                    className="bg-transparent border-none text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300 focus:ring-0 cursor-pointer py-0 pl-1 pr-5"
                  >
                    {(["work", "personal", "ideas", "todo"] as const).map((cat) => (
                      <option key={cat} value={cat} className="bg-white dark:bg-zinc-900 capitalize text-slate-800 dark:text-zinc-200">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="h-4 w-px bg-slate-200 dark:bg-white/[0.08]" />

                <button
                  onClick={() => setModalPinned(!modalPinned)}
                  className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors ${
                    modalPinned
                      ? "text-brand-500 hover:text-brand-600"
                      : "text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                  }`}
                  title={modalPinned ? "Unpin note" : "Pin note"}
                >
                  <Pin className={`h-4 w-4 ${modalPinned ? "fill-current" : ""}`} />
                </button>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 dark:text-zinc-500">
                  {modalContent ? modalContent.trim().split(/\s+/).filter(Boolean).length : 0} words
                </span>

                <div className="flex items-center gap-2">
                  {modalNote && (
                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this note?")) {
                          remove.mutate(modalNote.id);
                        }
                      }}
                      disabled={save.isPending || remove.isPending}
                      className="btn bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-400 dark:border dark:border-red-900/30 ring-0"
                    >
                      {remove.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin inline mr-1" />}
                      Delete
                    </button>
                  )}

                  <button
                    onClick={() => {
                      save.mutate({
                        id: modalNote?.id,
                        title: modalTitle,
                        content: modalContent,
                        color: modalColor,
                        category: modalCategory,
                        pinned: modalPinned,
                      });
                    }}
                    disabled={!modalTitle || save.isPending || remove.isPending}
                    className="btn-primary flex items-center gap-1.5"
                  >
                    {save.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin inline" />}
                    {modalNote ? "Save" : "Create"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
