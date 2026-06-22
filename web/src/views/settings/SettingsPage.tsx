import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { settingsApi, personalApiKeyApi } from "@/services/featureApis";
import type { Setting } from "@/types";
import { GitBranch, Loader2, Key, Copy, Eye, EyeOff, RefreshCw, Trash2, Check, ShieldCheck } from "lucide-react";
import { useAuth } from "@/features/auth/AuthProvider";

export default function SettingsPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  
  // Company settings queries (Admin only)
  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: settingsApi.list,
    enabled: user?.role === "admin",
  });
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

  // Personal API Key queries (All users)
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: apiKeyData, isLoading: apiKeyLoading, refetch: refetchApiKey } = useQuery({
    queryKey: ["apiKey"],
    queryFn: personalApiKeyApi.get,
    enabled: !!user,
  });

  const generateKey = useMutation({
    mutationFn: personalApiKeyApi.generate,
    onSuccess: () => {
      toast.success("API key generated successfully");
      refetchApiKey();
      setShowKey(true);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revokeKey = useMutation({
    mutationFn: personalApiKeyApi.revoke,
    onSuccess: () => {
      toast.success("API key revoked");
      refetchApiKey();
      setShowKey(false);
    },
    onError: (e: Error) => toast.error(e.message),
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
      <PageHeader title="Settings" description="Company preferences and developer API configuration" />
      
      {user?.role === "admin" && (
        <>
          <div className="card p-4 mb-4 grid grid-cols-1 sm:grid-cols-[200px_1fr_auto] gap-3 items-end">
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
          <DataTable rows={settingsData?.items} loading={settingsLoading} columns={cols} rowKey={(s) => s.id} empty="No settings yet" />

          {/* GitHub Webhook Info Section */}
          <div className="card p-6 mt-6 bg-slate-50/50 dark:bg-zinc-900/30">
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-2">
              <GitBranch className="w-5 h-5 text-blue-600 dark:text-blue-500" />
              GitHub Webhook Integration
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4 max-w-2xl leading-relaxed">
              Configure a webhook in your GitHub repository settings to push commit events to your ERP dashboard. This allows the team to see live code changes in real-time.
            </p>
            <div className="space-y-4">
              <div>
                <label className="label font-semibold text-xs">Payload URL</label>
                <div className="flex gap-2 max-w-xl">
                  <input
                    className="input font-mono text-[11px] select-all flex-1 py-1.5 px-2.5 font-normal"
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
              <ol className="text-xs text-slate-500 dark:text-zinc-400 space-y-1.5 pl-4 list-decimal font-normal">
                <h4 className="font-bold text-slate-700 dark:text-slate-300 -ml-4 mb-1">Configuration Steps:</h4>
                <li>Go to your repository <strong>Settings</strong> &rarr; <strong>Webhooks</strong>.</li>
                <li>Click <strong>Add webhook</strong>.</li>
                <li>Paste the Payload URL from above.</li>
                <li>Set Content type to <strong>application/json</strong>.</li>
                <li>Select <strong>Just the push event</strong> or select individual events.</li>
              </ol>
            </div>
          </div>
        </>
      )}

      {/* Personal API Key Section */}
      <div className="card p-6 mt-6">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-2">
          <Key className="w-5 h-5 text-indigo-600 dark:text-indigo-500" />
          Personal API Key
        </h3>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4 max-w-2xl leading-relaxed">
          Use this personal API key to authorize third-party tools and custom agents (such as the Model Context Protocol server, Antigravity, or Claude Desktop) to view and update your projects, tasks, and notes.
        </p>

        {apiKeyLoading ? (
          <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-600 dark:text-indigo-400" />
            Loading API Key...
          </div>
        ) : apiKeyData?.apiKey ? (
          <div className="space-y-4">
            <div>
              <label className="label font-semibold text-xs">Your API Key</label>
              <div className="flex gap-2 max-w-xl">
                <div className="relative flex-1">
                  <input
                    type={showKey ? "text" : "password"}
                    className="input font-mono text-[11px] bg-slate-50/50 dark:bg-zinc-950/25 select-all w-full pr-10 py-1.5 px-2.5 font-normal"
                    readOnly
                    value={apiKeyData.apiKey}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  className="btn-secondary text-xs shrink-0 flex items-center gap-1.5"
                  onClick={() => {
                    navigator.clipboard.writeText(apiKeyData.apiKey!);
                    setCopied(true);
                    toast.success("Copied API key to clipboard");
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy
                </button>
                <button
                  className="btn-danger text-xs shrink-0 flex items-center gap-1.5"
                  disabled={revokeKey.isPending}
                  onClick={() => {
                    if (confirm("Are you sure you want to revoke this API key? Any applications currently using this key will immediately lose access.")) {
                      revokeKey.mutate();
                    }
                  }}
                >
                  {revokeKey.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Revoke
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                className="btn-secondary text-xs flex items-center gap-1.5"
                disabled={generateKey.isPending}
                onClick={() => {
                  if (confirm("Rotating your API key will invalidate the current key. Do you want to proceed?")) {
                    generateKey.mutate();
                  }
                }}
              >
                {generateKey.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Rotate Key
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/15 border border-amber-100/60 dark:border-amber-900/30 rounded-lg p-3 max-w-xl mb-4">
              You do not have an active API key. Generate one to interact with this application via terminal tools or AI agents.
            </p>
            <button
              className="btn-primary text-xs flex items-center gap-1.5"
              disabled={generateKey.isPending}
              onClick={() => generateKey.mutate()}
            >
              {generateKey.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
              Generate API Key
            </button>
          </div>
        )}

        {/* MCP Setup Instructions */}
        {apiKeyData?.apiKey && (
          <div className="mt-6 border-t border-slate-100 dark:border-white/[0.08] pt-6">
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
              How to configure in Claude Desktop / Antigravity
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mb-3 max-w-2xl leading-relaxed">
              Add the following configuration block to your Claude Desktop configuration file (located at <code className="bg-slate-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-[10px] text-slate-800 dark:text-slate-200">~/Library/Application Support/Claude/claude_desktop_config.json</code>) or your workspace's MCP config. <br />
              <strong className="text-amber-700 dark:text-amber-500 font-semibold">⚠️ IMPORTANT:</strong> You must replace <code className="bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-1 py-0.5 rounded text-[10px]">/absolute/path/to/your/project</code> with the actual absolute path to this project directory on your computer (e.g. <code className="bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-slate-200 px-1 py-0.5 rounded text-[10px]">/Users/yourusername/projects/business-erp/mcp/dist/index.js</code>).
            </p>
            <pre className="bg-slate-900 text-slate-100 text-[10px] p-3 rounded-lg overflow-x-auto font-mono max-w-2xl">
{`{
  "mcpServers": {
    "erp-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/your/project/mcp/dist/index.js"],
      "env": {
        "ERP_API_KEY": "${showKey ? apiKeyData.apiKey : "YOUR_API_KEY_HERE"}",
        "ERP_API_URL": "${window.location.origin}/api"
      }
    }
  }
}`}
            </pre>
          </div>
        )}
      </div>
    </>
  );
}
