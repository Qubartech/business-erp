import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Modal } from "@/components/Modal";
import { timeApi, tasksApi, attendanceApi } from "@/services/featureApis";
import type { TimeEntry, Task, AttendanceEntry } from "@/types";
import { formatDateTime, formatMinutes } from "@/lib/format";
import { useAuth } from "@/features/auth/AuthProvider";
import { Clock, Calendar, ChevronLeft, ChevronRight, Edit2, Trash2, User, Play, Square, Loader2 } from "lucide-react";
import * as Slider from "@radix-ui/react-slider";

export default function TimePage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"log" | "review" | "attendance">("review");
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
  const { data: attendanceList, isLoading: attendanceListLoading } = useQuery({
    queryKey: ["attendance", "list", selectedDate],
    queryFn: () => attendanceApi.list({ date: selectedDate }),
    enabled: activeTab === "attendance",
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
    const groups: Record<string, { name: string; sessions: number; minutes: number }> = {};
    filteredEntries.forEach((e) => {
      const uId = e.user?.id || "unknown";
      const uName = e.user?.name || "Unknown User";
      if (!groups[uId]) {
        groups[uId] = { name: uName, sessions: 0, minutes: 0 };
      }
      groups[uId].sessions += 1;
      groups[uId].minutes += e.durationMinutes ?? 0;
    });
    return Object.values(groups);
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

  const attendanceCols: Column<AttendanceEntry>[] = [
    { key: "user", header: "Team Member", render: (e) => e.user?.name ?? "—" },
    { key: "in", header: "Check In", render: (e) => formatDateTime(e.checkIn) },
    { key: "out", header: "Check Out", render: (e) => e.checkOut ? formatDateTime(e.checkOut) : "Active Check-In" },
    {
      key: "dur",
      header: "Duration",
      render: (e) => {
        if (!e.checkOut) return "—";
        const diffMs = new Date(e.checkOut).getTime() - new Date(e.checkIn).getTime();
        const mins = Math.max(0, Math.round(diffMs / 60000));
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h > 0 ? `${h}h ` : ""}${m}m`;
      },
    },
  ];

  const cols: Column<TimeEntry>[] = [
    { key: "t", header: "Task", render: (e) => e.task?.title ?? "—" },
    { key: "s", header: "Start", render: (e) => formatDateTime(e.startTime) },
    { key: "e", header: "End", render: (e) => formatDateTime(e.endTime) },
    { key: "d", header: "Duration", render: (e) => formatMinutes(e.durationMinutes) },
    { key: "u", header: "User", render: (e) => e.user?.name ?? "—" },
    {
      key: "actions",
      header: "",
      render: (e) => (
        <button
          className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors"
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
          <button className="btn-primary" onClick={() => setManualOpen(true)}>
            Manual entry
          </button>
        }
      />

      {/* Active running timer bar */}
      {current ? (
        <div className="card p-4 mb-6 flex items-center justify-between border-l-4 border-amber-500 bg-amber-50/30">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Running Sprint</span>
            </div>
            <div className="font-semibold text-slate-800 text-lg mt-1">{current.task?.title}</div>
            <div className="text-xs text-slate-500 mt-0.5">Started at {formatDateTime(current.startTime)}</div>
          </div>
          <button className="btn-danger flex items-center gap-2" onClick={() => stop.mutate(current.id)} disabled={stop.isPending}>
            {stop.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              <Square className="h-4 w-4 fill-white" />
            )}
            {stop.isPending ? "Stopping..." : "Stop Sprint"}
          </button>
        </div>
      ) : (
        <div className="card p-4 mb-6 text-sm text-slate-500 flex items-center gap-2 border border-slate-100">
          <Clock className="h-4 w-4 text-slate-400" />
          No timer running. Start a sprint from any task detail page.
        </div>
      )}

      {/* Tab Selectors */}
      <div className="flex border-b border-slate-200 mb-6">
        <button
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "review"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
          onClick={() => setActiveTab("review")}
        >
          Smart Review Timeline
        </button>
        <button
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "log"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
          onClick={() => setActiveTab("log")}
        >
          All Time Logs
        </button>
        <button
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "attendance"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
          onClick={() => setActiveTab("attendance")}
        >
          Attendance Log
        </button>
      </div>

      {activeTab === "log" ? (
        <DataTable rows={list?.items} loading={isLoading} columns={cols} rowKey={(e) => e.id} />
      ) : activeTab === "attendance" ? (
        <div className="space-y-6">
          {/* Shared Date Picker bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-xs border border-slate-200/80">
            <div className="flex items-center gap-2">
              <button className="btn-secondary !p-2" onClick={() => shiftDay(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="relative">
                <input
                  type="date"
                  className="input !py-1.5 !pl-8 !pr-3 font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 cursor-pointer rounded-lg border-slate-200"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
              <button className="btn-secondary !p-2" onClick={() => shiftDay(1)}>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="text-sm text-slate-500">
              Showing <span className="font-semibold text-slate-700">{attendanceList?.items.length ?? 0} check-ins</span> for this day
            </div>
          </div>

          <DataTable rows={attendanceList?.items} loading={attendanceListLoading} columns={attendanceCols} rowKey={(e) => e.id} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Timeline Date Picker bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-xs border border-slate-200/80">
            <div className="flex items-center gap-2">
              <button className="btn-secondary !p-2" onClick={() => shiftDay(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="relative">
                <input
                  type="date"
                  className="input !py-1.5 !pl-8 !pr-3 font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 cursor-pointer rounded-lg border-slate-200"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
              <button className="btn-secondary !p-2" onClick={() => shiftDay(1)}>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="text-sm text-slate-500">
              Showing <span className="font-semibold text-slate-700">{filteredEntries.length} entries</span> for this day
            </div>
          </div>

          {/* Daily session log per user */}
          <div className="card p-5 border border-slate-200/80">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-brand-600" />
              Daily Session Log
            </h3>
            {dailyUsersLog.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No developer sessions logged for this day.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {dailyUsersLog.map((log, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between hover:border-slate-200 transition-colors"
                  >
                    <div className="font-medium text-slate-800 text-sm truncate">{log.name}</div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="badge bg-brand-50 text-brand-700 ring-brand-100">
                        {log.sessions} {log.sessions === 1 ? "sprint" : "sprints"}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
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
              <div className="mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider pl-16">
                Activity Timeline
              </div>
              <div
                ref={timelineContainerRef}
                className="relative h-[600px] overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-xs"
              >
                {/* 24 hour grid lines */}
                {Array.from({ length: 24 }).map((_, hour) => (
                  <div
                    key={hour}
                    className="absolute w-full border-t border-slate-100 flex items-start pl-3 text-slate-400 select-none"
                    style={{ top: `${hour * 60}px`, height: "60px" }}
                  >
                    <span className="text-[10px] font-semibold font-mono tracking-tight bg-white pr-2 mt-[-7px] z-10">
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
                      className="absolute left-[65px] right-4 bg-brand-50/90 border-l-4 border-brand-600 rounded-lg p-2.5 cursor-pointer shadow-xs hover:bg-brand-100 hover:shadow-sm hover:scale-[1.005] active:scale-100 transition-all overflow-hidden flex flex-col justify-between group"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 text-[11px] truncate group-hover:text-brand-900 leading-tight">
                          {e.task?.title ?? "—"}
                        </div>
                        <div className="text-[9px] text-slate-500 font-medium truncate mt-0.5">
                          {e.user?.name}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono tracking-tight font-semibold mt-1">
                        <span>
                          {formatMinutesToTime(startMin)} - {formatMinutesToTime(endMin)}
                        </span>
                        <span className="bg-brand-100/80 text-brand-700 px-1 rounded">
                          {formatMinutesDuration(endMin - startMin)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-4 space-y-4">
              <div className="card p-5 border border-slate-200/80 bg-slate-50/30">
                <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wider mb-2">Timeline Review Guide</h4>
                <ul className="text-xs text-slate-500 space-y-2 list-disc pl-4">
                  <li>Select a date using the picker to view logs from that specific day.</li>
                  <li>Developer sessions and total hours will summarize in the log cards at the top.</li>
                  <li>Click on any colored block in the timeline grid to review or edit details.</li>
                  <li>
                    A visual dual range slider allows you to drag the handles to correct times if you forgot to pause.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
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
                  <span className="text-slate-400 block text-xs">Start Time</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {formatMinutesToTime(editStartMinutes)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-xs">End Time</span>
                  <span className="font-bold text-slate-800 font-mono">
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
                  <Slider.Track className="bg-slate-200 relative grow rounded-full h-2">
                    <Slider.Range className="absolute bg-brand-600 rounded-full h-full" />
                  </Slider.Track>
                  <Slider.Thumb
                    className="block w-5 h-5 bg-white border-2 border-brand-600 shadow-md rounded-full hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer transition-transform hover:scale-110 active:scale-100"
                    aria-label="Start time"
                  />
                  <Slider.Thumb
                    className="block w-5 h-5 bg-white border-2 border-brand-600 shadow-md rounded-full hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer transition-transform hover:scale-110 active:scale-100"
                    aria-label="End time"
                  />
                </Slider.Root>
              </div>

              <div className="bg-brand-50/50 rounded-xl p-3 border border-brand-100 text-center">
                <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider mb-1">
                  Adjusted Duration
                </span>
                <span className="text-2xl font-extrabold text-brand-700 font-mono">
                  {formatMinutesDuration(editEndMinutes - editStartMinutes)}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
