import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Modal } from "@/components/Modal";
import { timeApi, tasksApi } from "@/services/featureApis";
import type { TimeEntry } from "@/types";
import { formatDateTime, formatMinutes } from "@/lib/format";

export default function TimePage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [taskId, setTaskId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const { data: current } = useQuery({ queryKey: ["time","current"], queryFn: timeApi.current });
  const { data: list, isLoading } = useQuery({ queryKey: ["time","list"], queryFn: () => timeApi.list({ pageSize: 100 }) });
  const { data: tasks } = useQuery({ queryKey: ["tasks","all"], queryFn: () => tasksApi.list({ pageSize: 200 }) });

  const stop = useMutation({
    mutationFn: (id: string) => timeApi.stop(id),
    onSuccess: () => { toast.success("Stopped"); qc.invalidateQueries({ queryKey: ["time"] }); },
  });
  const addManual = useMutation({
    mutationFn: () => timeApi.manual({ taskId, startTime: new Date(startTime).toISOString(), endTime: new Date(endTime).toISOString() }),
    onSuccess: () => { toast.success("Entry added"); setOpen(false); qc.invalidateQueries({ queryKey: ["time"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const cols: Column<TimeEntry>[] = [
    { key: "t", header: "Task", render: (e) => e.task?.title ?? "—" },
    { key: "s", header: "Start", render: (e) => formatDateTime(e.startTime) },
    { key: "e", header: "End", render: (e) => formatDateTime(e.endTime) },
    { key: "d", header: "Duration", render: (e) => formatMinutes(e.durationMinutes) },
    { key: "u", header: "User", render: (e) => e.user?.name ?? "—" },
  ];

  return (
    <>
      <PageHeader title="Time tracking" actions={<button className="btn-primary" onClick={() => setOpen(true)}>Manual entry</button>} />
      {current ? (
        <div className="card p-4 mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500">Running</div>
            <div className="font-medium">{current.task?.title}</div>
            <div className="text-xs text-slate-500">Started {formatDateTime(current.startTime)}</div>
          </div>
          <button className="btn-danger" onClick={() => stop.mutate(current.id)}>Stop</button>
        </div>
      ) : (
        <div className="card p-4 mb-4 text-sm text-slate-500">No timer running. Start one from a task page.</div>
      )}
      <DataTable rows={list?.items} loading={isLoading} columns={cols} rowKey={(e) => e.id} />

      <Modal open={open} onClose={() => setOpen(false)} title="Manual entry"
        footer={<>
          <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={() => addManual.mutate()} disabled={!taskId || !startTime || !endTime}>Save</button>
        </>}>
        <div className="space-y-3">
          <select className="input" value={taskId} onChange={(e) => setTaskId(e.target.value)}>
            <option value="">— pick task —</option>
            {tasks?.items.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
          <input className="input" type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          <input className="input" type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
      </Modal>
    </>
  );
}
