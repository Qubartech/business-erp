import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { settingsApi } from "@/services/featureApis";
import type { Setting } from "@/types";

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["settings"], queryFn: settingsApi.list });
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");

  const save = useMutation({
    mutationFn: () => settingsApi.upsert({ key, value }),
    onSuccess: () => { toast.success("Saved"); setKey(""); setValue(""); qc.invalidateQueries({ queryKey: ["settings"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (k: string) => settingsApi.remove(k),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["settings"] }); },
  });

  const cols: Column<Setting>[] = [
    { key: "k", header: "Key", render: (s) => <code className="text-xs">{s.key}</code> },
    { key: "v", header: "Value", render: (s) => <span className="text-sm truncate inline-block max-w-md align-middle">{s.value}</span> },
    { key: "a", header: "", render: (s) => (
      <div className="flex justify-end gap-2">
        <button className="btn-secondary" onClick={() => { setKey(s.key); setValue(s.value); }}>Edit</button>
        <button className="btn-danger" onClick={() => remove.mutate(s.key)}>Delete</button>
      </div>
    ), className: "text-right" },
  ];

  return (
    <>
      <PageHeader title="Settings" description="Company and application preferences" />
      <div className="card p-4 mb-4 grid grid-cols-1 sm:grid-cols-[200px,1fr,auto] gap-2 items-end">
        <div><label className="label">Key</label><input className="input" value={key} onChange={(e) => setKey(e.target.value)} placeholder="company.name" /></div>
        <div><label className="label">Value</label><input className="input" value={value} onChange={(e) => setValue(e.target.value)} /></div>
        <button className="btn-primary" disabled={!key || !value} onClick={() => save.mutate()}>Save</button>
      </div>
      <DataTable rows={data?.items} loading={isLoading} columns={cols} rowKey={(s) => s.id} empty="No settings yet" />
    </>
  );
}
