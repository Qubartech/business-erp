import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { settingsApi } from "@/services/featureApis";
import type { Setting } from "@/types";
import { GitBranch, Loader2 } from "lucide-react";

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
    { key: "a", header: "", render: (s) => {
      const isPendingDelete = remove.isPending && remove.variables === s.key;
      return (
        <div className="flex justify-end gap-2">
          <button className="btn-secondary" disabled={isPendingDelete} onClick={() => { setKey(s.key); setValue(s.value); }}>Edit</button>
          <button
            className="btn-danger"
            disabled={isPendingDelete}
            onClick={() => remove.mutate(s.key)}
          >
            {isPendingDelete && <Loader2 className="h-4 w-4 animate-spin mr-1.5 inline" />}
            Delete
          </button>
        </div>
      );
    }, className: "text-right" },
  ];

  return (
    <>
      <PageHeader title="Settings" description="Company and application preferences" />
      <div className="card p-4 mb-4 grid grid-cols-1 sm:grid-cols-[200px,1fr,auto] gap-2 items-end">
        <div><label className="label">Key</label><input className="input" value={key} onChange={(e) => setKey(e.target.value)} placeholder="company.name" /></div>
        <div><label className="label">Value</label><input className="input" value={value} onChange={(e) => setValue(e.target.value)} /></div>
        <button
          className="btn-primary"
          disabled={!key || !value || save.isPending}
          onClick={() => save.mutate()}
        >
          {save.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5 inline" />}
          Save
        </button>
      </div>
      <DataTable rows={data?.items} loading={isLoading} columns={cols} rowKey={(s) => s.id} empty="No settings yet" />

      {/* GitHub Webhook Info Section */}
      <div className="card p-6 border border-slate-100 mt-6 bg-slate-50/50">
        <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-2">
          <GitBranch className="w-5 h-5 text-blue-600" />
          GitHub Webhook Integration
        </h3>
        <p className="text-xs text-slate-500 mb-4 max-w-2xl leading-relaxed">
          Configure a webhook in your GitHub repository settings to push commit events to your ERP dashboard. This allows the team to see live code changes in real-time.
        </p>
        <div className="space-y-4">
          <div>
            <label className="label font-semibold text-xs text-slate-600 block mb-1">Payload URL</label>
            <div className="flex gap-2 max-w-xl">
              <input
                className="input font-mono text-[11px] bg-white border-slate-200 select-all flex-1 py-1.5 px-2.5 rounded-lg"
                readOnly
                value={`${window.location.origin}/api/webhooks/github`}
              />
              <button
                className="btn-secondary text-xs shrink-0 flex items-center gap-1.5"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/github`);
                  toast.success("Copied to clipboard");
                }}
              >
                Copy
              </button>
            </div>
          </div>
          <div className="text-xs text-slate-500 space-y-1.5 pl-4 list-decimal font-normal">
            <h4 className="font-bold text-slate-700 -ml-4 mb-1">Configuration Steps:</h4>
            <li>Go to your repository <strong>Settings</strong> &rarr; <strong>Webhooks</strong>.</li>
            <li>Click <strong>Add webhook</strong>.</li>
            <li>Paste the Payload URL from above.</li>
            <li>Set Content type to <strong>application/json</strong>.</li>
            <li>Select <strong>Just the push event</strong> or select individual events.</li>
          </div>
        </div>
      </div>
    </>
  );
}
