import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Modal } from "@/components/Modal";
import { timeApi, tasksApi } from "@/services/featureApis";
import type { TimeEntry, Task } from "@/types";
import { formatDateTime, formatMinutes } from "@/lib/format";
import { useAuth } from "@/features/auth/AuthProvider";
import { TimePageSkeleton } from "@/components/Skeletons";
import { Clock, Calendar, ChevronLeft, ChevronRight, Edit2, Trash2, User, Play, Square, Loader2, SlidersHorizontal, List } from "lucide-react";
import * as Slider from "@radix-ui/react-slider";

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

export default function TimePage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"log" | "review">("review");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toLocaleDateString("en-CA") // YYYY-MM-DD local
  );

  // Manual entry modal states
  const [manualOpen, setManualOpen] = useState(false);
  const [manualTaskId, setManualTaskId] = useState("");
  const [manualStartTime, setManualStartTime] = useState("");
  const [manualEndTime, setManualEndTime] = useState("");

  // Edit entry modal states
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [editStartMinutes, setEditStartMinutes] = useState<number>(540); // 9:00 AM
  const [editEndMinutes, setEditEndMinutes] = useState<number>(600); // 10:00 AM
  const [editTaskId, setEditTaskId] = useState<string>("");

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Refs
  const timelineContainerRef = useRef<HTMLDivElement>(null);

  // Queries
  const { data: current } = useQuery({ queryKey: ["time", "current"], queryFn: timeApi.current });
  const { data: list, isLoading } = useQuery({
    queryKey: ["time", "list"],
    queryFn: () => timeApi.list({ pageSize: 100 }),
  });
  const { data: tasks } = useQuery({
    queryKey: ["tasks", "all"],
    queryFn: () => tasksApi.list({ pageSize: 100 }),
  });

  // Mutators
  const stop = useMutation({
    mutationFn: (id: string) => timeApi.stop(id),
    onSuccess: () => {
      toast.success("Stopped");
      qc.invalidateQueries({ queryKey: ["time"] });
    },
  });

  const addManual = useMutation({
    mutationFn: () =>
      timeApi.manual({
        taskId: manualTaskId,
        startTime: new Date(manualStartTime).toISOString(),
        endTime: new Date(manualEndTime).toISOString(),
      }),
    onSuccess: () => {
      toast.success("Entry added");
      setManualOpen(false);
      qc.invalidateQueries({ queryKey: ["time"] });
      setManualTaskId("");
      setManualStartTime("");
      setManualEndTime("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateEntry = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { startTime: string; endTime: string; taskId: string } }) =>
      timeApi.update(id, data),
    onSuccess: () => {
      toast.success("Entry updated successfully");
      setEditingEntry(null);
      qc.invalidateQueries({ queryKey: ["time"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeEntry = useMutation({
    mutationFn: (id: string) => timeApi.remove(id),
    onSuccess: () => {
      toast.success("Entry deleted");
      setEditingEntry(null);
      qc.invalidateQueries({ queryKey: ["time"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Scroll to 8 AM on mount / tab change
  useEffect(() => {
    if (activeTab === "review" && timelineContainerRef.current) {
      timelineContainerRef.current.scrollTop = 480; // 8 hours * 60px
    }
  }, [activeTab]);

  // Helpers for editing modal
  const openEditModal = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setEditTaskId(entry.taskId);
    const start = new Date(entry.startTime);
    const end = entry.endTime ? new Date(entry.endTime) : new Date();
    setEditStartMinutes(start.getHours() * 60 + start.getMinutes());
    setEditEndMinutes(end.getHours() * 60 + end.getMinutes());
  };

  const handleSaveEdit = () => {
    if (!editingEntry) return;
    const [y, m, d] = selectedDate.split("-").map(Number);
    const newStart = new Date(y, m - 1, d, Math.floor(editStartMinutes / 60), editStartMinutes % 60);
    const newEnd = new Date(y, m - 1, d, Math.floor(editEndMinutes / 60), editEndMinutes % 60);

    updateEntry.mutate({
      id: editingEntry.id,
      data: {
        startTime: newStart.toISOString(),
        endTime: newEnd.toISOString(),
        taskId: editTaskId,
      },
    });
  };

  const shiftDay = (amount: number) => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + amount);
    setSelectedDate(d.toLocaleDateString("en-CA"));
  };

  // Filter entries for selected date
  const filteredEntries = (list?.items ?? []).filter((e) => {
    const entryDateStr = new Date(e.startTime).toLocaleDateString("en-CA");
    return entryDateStr === selectedDate;
  });

  // Group by user for daily session log summary
  const dailyUsersLog = (() => {
    const groups: Record<string, { id: string; name: string; sessions: number; minutes: number }> = {};
    filteredEntries.forEach((e) => {
      const uId = e.user?.id || "unknown";
      const uName = e.user?.name || "Unknown User";
      if (!groups[uId]) {
        groups[uId] = { id: uId, name: uName, sessions: 0, minutes: 0 };
      }
      groups[uId].sessions += 1;
      groups[uId].minutes += e.durationMinutes ?? 0;
    });
    return Object.values(groups);
  })();

  // Group selected user's entries by task for the detail modal
  const groupedUserTasks = (() => {
    if (!selectedUserId) return [];
    
    const groups: Record<string, {
      taskId: string;
      taskTitle: string;
      totalMinutes: number;
      sprints: {
        id: string;
        startTime: string;
        endTime: string | null;
        durationMinutes: number | null;
      }[];
    }> = {};

    filteredEntries.forEach((e) => {
      const uId = e.user?.id || "unknown";
      if (uId !== selectedUserId) return;
      
      const tId = e.taskId || "unknown-task";
      const tTitle = e.task?.title || "Unknown Task";
      
      if (!groups[tId]) {
        groups[tId] = {
          taskId: tId,
          taskTitle: tTitle,
          totalMinutes: 0,
          sprints: []
        };
      }
      
      groups[tId].totalMinutes += e.durationMinutes ?? 0;
      groups[tId].sprints.push({
        id: e.id,
        startTime: e.startTime,
        endTime: e.endTime,
        durationMinutes: e.durationMinutes
      });
    });

    // Sort tasks by total minutes descending, and sprints chronologically
    const result = Object.values(groups);
    result.forEach((group) => {
      group.sprints.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    });
    result.sort((a, b) => b.totalMinutes - a.totalMinutes);

    return result;
  })();

  // Formatting helpers for slider
  const formatMinutesToTime = (totalMin: number) => {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    const ampm = h >= 12 ? "PM" : "AM";
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ampm}`;
  };

  const formatMinutesDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h > 0 ? `${h}h ` : ""}${m}m`;
  };



  const cols: Column<TimeEntry>[] = [
    {
      key: "t",
      header: "Task",
      render: (e) => (
        <span className="font-bold text-slate-850 dark:text-slate-200">
          {e.task?.title ?? "—"}
        </span>
      )
    },
    {
      key: "s",
      header: "Start",
      render: (e) => (
        <span className="font-mono text-xs text-slate-550 dark:text-slate-400 bg-slate-100/80 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded">
          {formatDateTime(e.startTime)}
        </span>
      )
    },
    {
      key: "e",
      header: "End",
      render: (e) => (
        e.endTime ? (
          <span className="font-mono text-xs text-slate-550 dark:text-slate-400 bg-slate-100/80 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded">
            {formatDateTime(e.endTime)}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold animate-pulse ring-1 ring-amber-500/25">
            Running
          </span>
        )
      )
    },
    {
      key: "d",
      header: "Duration",
      render: (e) => (
        <span className="badge bg-slate-100 dark:bg-zinc-800/80 text-slate-700 dark:text-slate-300 ring-slate-200/50 dark:ring-white/[0.04] font-semibold">
          {formatMinutes(e.durationMinutes)}
        </span>
      )
    },
    {
      key: "u",
      header: "User",
      render: (e) => (
        e.user ? (
          <div className="flex items-center gap-2">
            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${getAvatarColor(e.user.name)}`}>
              {getInitials(e.user.name)}
            </div>
            <span className="font-medium text-slate-750 dark:text-slate-350">{e.user.name}</span>
          </div>
        ) : (
          <span className="text-slate-450 dark:text-slate-655">—</span>
        )
      )
    },
    {
      key: "actions",
      header: "",
      render: (e) => (
        <button
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
          onClick={() => openEditModal(e)}
        >
          <Edit2 className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Time Tracking"
        actions={
          <button className="btn-primary shadow-glow-brand hover:-translate-y-0.5 active:translate-y-0 transform transition-all duration-200 cursor-pointer" onClick={() => setManualOpen(true)}>
            Manual entry
          </button>
        }
      />

      {isLoading ? (
        <TimePageSkeleton />
      ) : (
        <>
          {/* Active running timer bar */}
          {current ? (
        <div className="card-premium p-5 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-4 border-amber-500 relative overflow-hidden bg-gradient-to-r from-amber-500/[0.03] to-transparent dark:from-amber-500/[0.02]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none" />
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Active Sprint Timer</span>
            </div>
            <div className="font-extrabold text-slate-850 dark:text-slate-100 text-lg mt-1 flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500 animate-pulse shrink-0" />
              {current.task?.title}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-450 mt-1 flex items-center gap-1.5">
              <span className="font-semibold text-slate-450">Started at:</span>
              <span className="font-mono bg-slate-100 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded text-slate-655 dark:text-slate-355">
                {formatDateTime(current.startTime)}
              </span>
            </div>
          </div>
          <button
            className="btn-danger flex items-center gap-2 shadow-md shadow-red-500/10 hover:shadow-red-500/20 transform hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            onClick={() => stop.mutate(current.id)}
            disabled={stop.isPending}
          >
            {stop.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              <Square className="h-4 w-4 fill-white text-white" />
            )}
            {stop.isPending ? "Stopping..." : "Stop Sprint"}
          </button>
        </div>
      ) : (
        <div className="card-premium p-4 mb-6 text-sm text-slate-500 dark:text-slate-450 flex items-center gap-3 border border-slate-100 dark:border-white/[0.06] bg-slate-50/20 dark:bg-zinc-900/20">
          <div className="p-2 bg-slate-100 dark:bg-zinc-800 rounded-lg text-slate-455 dark:text-slate-500">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <p className="font-bold text-slate-700 dark:text-slate-350">No timer is running</p>
            <p className="text-xs text-slate-450 dark:text-slate-500">Start a sprint from any task detail page to track time automatically.</p>
          </div>
        </div>
      )}

      {/* Tab Selectors */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex bg-slate-100 dark:bg-zinc-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-white/[0.08] shadow-xs">
          <button
            onClick={() => setActiveTab("review")}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === "review"
                ? "bg-white dark:bg-zinc-700 text-slate-800 dark:text-slate-100 shadow-xs font-bold"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Smart Review Timeline</span>
          </button>
          <button
            onClick={() => setActiveTab("log")}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === "log"
                ? "bg-white dark:bg-zinc-700 text-slate-800 dark:text-slate-100 shadow-xs font-bold"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <List className="h-3.5 w-3.5" />
            <span>All Time Logs</span>
          </button>
        </div>
      </div>

      {activeTab === "log" ? (
        <DataTable rows={list?.items} loading={isLoading} columns={cols} rowKey={(e) => e.id} />
      ) : (
        <div className="space-y-6">
          {/* Timeline Date Picker bar */}
          <div className="card-premium p-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-900 shadow-xs border border-slate-200/80 dark:border-white/[0.06]">
            <div className="flex items-center gap-2">
              <button className="btn-secondary !p-2 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 transform transition-all duration-200" onClick={() => shiftDay(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="relative">
                <input
                  type="date"
                  className="input !py-1.5 !pl-8 !pr-3 font-semibold text-slate-700 dark:text-zinc-200 bg-slate-50 dark:bg-zinc-900/40 hover:bg-slate-100 dark:hover:bg-zinc-800/50 cursor-pointer rounded-lg border-slate-200 dark:border-white/[0.08]"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
              </div>
              <button className="btn-secondary !p-2 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 transform transition-all duration-200" onClick={() => shiftDay(1)}>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-zinc-900 border border-slate-200/50 dark:border-white/[0.06] px-3 py-1 rounded-lg">
              Showing <span className="font-bold text-brand-600 dark:text-brand-400">{filteredEntries.length} entries</span> for this day
            </div>
          </div>

          {/* Daily session log per user */}
          <div className="card-premium p-5 border border-slate-200/80 dark:border-white/[0.06]">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-white/[0.04] pb-3">
              <User className="h-4 w-4 text-brand-650 dark:text-brand-400" />
              Daily Session Log
            </h3>
            {dailyUsersLog.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 italic py-2">No developer sessions logged for this day.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {dailyUsersLog.map((log, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedUserId(log.id)}
                    className="p-4 rounded-xl border border-slate-250/35 dark:border-white/[0.05] bg-slate-50/40 dark:bg-zinc-900/30 flex items-center justify-between hover:border-brand-400/50 dark:hover:border-brand-500/50 hover:bg-white dark:hover:bg-zinc-800/40 active:scale-[0.98] cursor-pointer transition-all duration-300 shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-sm ${getAvatarColor(log.name)}`}>
                        {getInitials(log.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{log.name}</div>
                        <div className="text-[11px] text-slate-455 dark:text-slate-500 font-medium font-semibold">Logged today</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="badge bg-brand-55/60 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400 ring-brand-100 dark:ring-brand-900/30">
                        {log.sessions} {log.sessions === 1 ? "sprint" : "sprints"}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {formatMinutesDuration(log.minutes)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Timeline View */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 flex flex-col">
              <div className="mb-2 text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider pl-16">
                Activity Timeline
              </div>
              <div
                ref={timelineContainerRef}
                className="relative h-[600px] overflow-y-auto border border-slate-200 dark:border-white/[0.06] rounded-2xl bg-white dark:bg-zinc-900 shadow-sm"
              >
                {/* 24 hour grid lines */}
                {Array.from({ length: 24 }).map((_, hour) => (
                  <div
                    key={hour}
                    className="absolute w-full border-t border-slate-100 dark:border-white/[0.04] flex items-start pl-3 text-slate-400 dark:text-slate-550 select-none"
                    style={{ top: `${hour * 60}px`, height: "60px" }}
                  >
                    <span className="text-[10px] font-semibold font-mono tracking-tight bg-white dark:bg-zinc-900 pr-2 mt-[-7px] z-10 text-slate-400 dark:text-slate-550">
                      {hour.toString().padStart(2, "0")}:00
                    </span>
                  </div>
                ))}

                {/* Absolutely positioned time blocks */}
                {filteredEntries.map((e) => {
                  const start = new Date(e.startTime);
                  const end = e.endTime ? new Date(e.endTime) : new Date();
                  const startMin = start.getHours() * 60 + start.getMinutes();
                  const endMin = end.getHours() * 60 + end.getMinutes();
                  const dur = Math.max(25, endMin - startMin); // Minimum 25px height

                  return (
                    <div
                      key={e.id}
                      onClick={() => openEditModal(e)}
                      style={{
                        top: `${startMin}px`,
                        height: `${dur}px`,
                      }}
                      className="absolute left-[65px] right-4 bg-brand-500/[0.04] dark:bg-brand-500/[0.06] border-l-4 border-brand-600 dark:border-brand-500 rounded-xl p-2.5 cursor-pointer hover:bg-brand-500/[0.08] dark:hover:bg-brand-500/[0.1] hover:scale-[1.002] active:scale-100 transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-slate-200/50 dark:border-white/[0.05] overflow-hidden flex flex-col justify-between group"
                    >
                      <div className="flex items-start justify-between gap-2 min-w-0">
                        <div className="min-w-0 flex-1">
                          <div className="font-extrabold text-slate-800 dark:text-slate-100 text-[11px] truncate group-hover:text-brand-700 dark:group-hover:text-brand-400 leading-tight">
                            {e.task?.title ?? "—"}
                          </div>
                          {dur >= 45 && (
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold flex items-center gap-1.5 mt-1">
                              <div className={`h-4.5 w-4.5 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 ${getAvatarColor(e.user?.name ?? "")}`}>
                                {getInitials(e.user?.name ?? "")}
                              </div>
                              <span className="truncate">{e.user?.name}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="shrink-0 flex items-center gap-1.5">
                          <span className="bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-400 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md">
                            {formatMinutesDuration(endMin - startMin)}
                          </span>
                        </div>
                      </div>

                      {dur >= 35 && (
                        <div className="flex items-center justify-between text-[9px] text-slate-450 dark:text-slate-500 font-mono tracking-tight font-semibold mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {formatMinutesToTime(startMin)} - {formatMinutesToTime(endMin)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-4 space-y-4">
              <div className="card-premium p-5 border border-slate-200/80 dark:border-white/[0.06] bg-slate-50/30 dark:bg-zinc-900/20 relative overflow-hidden">
                <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-brand-500/5 rounded-full filter blur-xl" />
                <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="p-1 bg-brand-55/60 dark:bg-brand-500/10 rounded text-brand-600 dark:text-brand-400">
                    <SlidersHorizontal className="h-4 w-4" />
                  </span>
                  Timeline Review Guide
                </h4>
                <ul className="text-xs text-slate-550 dark:text-slate-400 space-y-2.5 list-none pl-0">
                  <li className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                    <span>Select a date using the picker to view logs from that specific day.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                    <span>Developer sessions and total hours will summarize in the log cards at the top.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                    <span>Click on any colored block in the timeline grid to review or edit details.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                    <span>A visual dual range slider allows you to drag the handles to correct times if you forgot to pause.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* Manual Entry Modal */}
      <Modal
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        title="Manual Time Log"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setManualOpen(false)} disabled={addManual.isPending}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={() => addManual.mutate()}
              disabled={!manualTaskId || !manualStartTime || !manualEndTime || addManual.isPending}
            >
              {addManual.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5 inline" />}
              Save Entry
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Select Task</label>
            <select
              className="input"
              value={manualTaskId}
              onChange={(e) => setManualTaskId(e.target.value)}
            >
              <option value="">— pick task —</option>
              {tasks?.items.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Start Time</label>
            <input
              className="input"
              type="datetime-local"
              value={manualStartTime}
              onChange={(e) => setManualStartTime(e.target.value)}
            />
          </div>
          <div>
            <label className="label">End Time</label>
            <input
              className="input"
              type="datetime-local"
              value={manualEndTime}
              onChange={(e) => setManualEndTime(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* Visual Range Slider Editing Modal */}
      <Modal
        open={editingEntry !== null}
        onClose={() => setEditingEntry(null)}
        title="Review & Adjust Time Block"
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              className="btn-danger flex items-center gap-1.5 !px-3"
              disabled={removeEntry.isPending || updateEntry.isPending}
              onClick={() => {
                if (editingEntry && window.confirm("Are you sure you want to delete this log?")) {
                  removeEntry.mutate(editingEntry.id);
                }
              }}
            >
              {removeEntry.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete
            </button>
            <div className="flex gap-2">
              <button
                className="btn-secondary"
                disabled={removeEntry.isPending || updateEntry.isPending}
                onClick={() => setEditingEntry(null)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                disabled={removeEntry.isPending || updateEntry.isPending}
                onClick={handleSaveEdit}
              >
                {updateEntry.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5 inline" />}
                Save Changes
              </button>
            </div>
          </div>
        }
      >
        {editingEntry && (
          <div className="space-y-6">
            <div>
              <label className="label">Task</label>
              <select
                className="input"
                value={editTaskId}
                onChange={(e) => setEditTaskId(e.target.value)}
              >
                {tasks?.items.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="text-slate-400 dark:text-slate-550 block text-xs">Start Time</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 font-mono">
                    {formatMinutesToTime(editStartMinutes)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 dark:text-slate-550 block text-xs">End Time</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 font-mono">
                    {formatMinutesToTime(editEndMinutes)}
                  </span>
                </div>
              </div>

              {/* Slider Component */}
              <div className="py-4 px-2">
                <Slider.Root
                  className="relative flex items-center select-none touch-none w-full h-5"
                  value={[editStartMinutes, editEndMinutes]}
                  onValueChange={(val: number[]) => {
                    setEditStartMinutes(val[0]);
                    setEditEndMinutes(val[1]);
                  }}
                  max={1440}
                  min={0}
                  step={5}
                >
                  <Slider.Track className="bg-slate-200 dark:bg-zinc-800 relative grow rounded-full h-2">
                    <Slider.Range className="absolute bg-brand-600 dark:bg-brand-500 rounded-full h-full" />
                  </Slider.Track>
                  <Slider.Thumb
                    className="block w-5 h-5 bg-white dark:bg-zinc-900 border-2 border-brand-600 dark:border-brand-500 shadow-md rounded-full hover:bg-slate-50 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer transition-transform hover:scale-110 active:scale-100"
                    aria-label="Start time"
                  />
                  <Slider.Thumb
                    className="block w-5 h-5 bg-white dark:bg-zinc-900 border-2 border-brand-600 dark:border-brand-500 shadow-md rounded-full hover:bg-slate-50 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer transition-transform hover:scale-110 active:scale-100"
                    aria-label="End time"
                  />
                </Slider.Root>
              </div>

              <div className="bg-brand-50/50 dark:bg-brand-900/20 rounded-xl p-3 border border-brand-100 dark:border-brand-900/40 text-center">
                <span className="text-xs text-slate-500 dark:text-slate-400 block uppercase font-bold tracking-wider mb-1">
                  Adjusted Duration
                </span>
                <span className="text-2xl font-extrabold text-brand-700 dark:text-brand-400 font-mono">
                  {formatMinutesDuration(editEndMinutes - editStartMinutes)}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* User Session Detail Modal */}
      <Modal
        open={selectedUserId !== null}
        onClose={() => setSelectedUserId(null)}
        title={`${dailyUsersLog.find(u => u.id === selectedUserId)?.name || "User"}'s Daily Sessions`}
        footer={
          <button className="btn-secondary cursor-pointer" onClick={() => setSelectedUserId(null)}>
            Close
          </button>
        }
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {groupedUserTasks.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No entries found for this user.</p>
          ) : (
            groupedUserTasks.map((group) => (
              <div key={group.taskId} className="border border-slate-200/70 dark:border-white/[0.06] rounded-xl p-4 bg-slate-50/50 dark:bg-zinc-900/40 shadow-xs space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm break-words">{group.taskTitle}</h4>
                  </div>
                  <span className="text-xs font-semibold text-slate-655 dark:text-zinc-350 flex items-center gap-1.5 bg-white dark:bg-zinc-800 px-2.5 py-1 rounded-lg border border-slate-200/50 dark:border-white/[0.04] shrink-0 whitespace-nowrap shadow-2xs">
                    <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    Total: {formatMinutesDuration(group.totalMinutes)}
                  </span>
                </div>
                
                <div className="border-t border-slate-200/60 dark:border-white/[0.06] pt-3 space-y-2">
                  {group.sprints.map((sprint, sIdx) => {
                    const start = new Date(sprint.startTime);
                    const end = sprint.endTime ? new Date(sprint.endTime) : new Date();
                    const startMin = start.getHours() * 60 + start.getMinutes();
                    const endMin = end.getHours() * 60 + end.getMinutes();

                    return (
                      <div key={sprint.id} className="flex items-center justify-between text-xs text-slate-600 dark:text-zinc-350 bg-white/75 dark:bg-zinc-800/45 hover:bg-slate-100/70 dark:hover:bg-zinc-850 p-2 rounded-lg transition-colors border border-slate-150/40 dark:border-white/[0.02]">
                        <span className="font-semibold text-slate-450 dark:text-zinc-500 font-mono">
                          Sprint #{sIdx + 1}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-slate-600 dark:text-zinc-400">
                            {formatMinutesToTime(startMin)} - {formatMinutesToTime(endMin)}
                          </span>
                          <span className="bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 font-bold px-2 py-0.5 rounded text-[10px]">
                            {formatMinutesDuration((sprint.durationMinutes ?? (endMin - startMin)))}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </>
  );
}
