import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { dashboardApi } from "@/services/featureApis";
import { Folder, CheckSquare, Users, Clock, GitCommit, GitBranch, Play, Calendar } from "lucide-react";
import { Modal } from "@/components/Modal";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/AuthProvider";

interface CardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  colorClass?: string;
  gradientClass?: string;
}

function Card({ label, value, icon, colorClass = "text-brand-600 bg-brand-50 border-brand-100 dark:text-brand-400 dark:bg-brand-900/20 dark:border-brand-900/60", gradientClass = "from-brand-500/5 to-indigo-500/5" }: CardProps) {
  return (
    <div className={`card-premium p-6 flex items-center justify-between bg-gradient-to-br ${gradientClass} border border-slate-200/50 dark:border-slate-800/60 hover:shadow-lg transition-all duration-300`}>
      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</span>
        <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">{value}</div>
      </div>
      <div className={`p-3.5 rounded-2xl border ${colorClass} shadow-sm transition-transform duration-200 hover:scale-105 shrink-0`}>
        {icon}
      </div>
    </div>
  );
}

function formatDuration(minutes: number) {
  if (!minutes) return "0h 0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

function formatRelativeTime(dateStr: string) {
  const d = new Date(dateStr);
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function ActiveUsersList({ activeAttendance, isLoading }: { activeAttendance: any[]; isLoading: boolean }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return <div className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center animate-pulse">Loading status...</div>;
  }

  if (!activeAttendance || activeAttendance.length === 0) {
    return <div className="text-xs text-slate-400 dark:text-slate-500 py-6 italic text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">Nobody is checked in right now.</div>;
  }

  return (
    <div className="space-y-3">
      {activeAttendance.map((entry) => {
        const checkInTime = new Date(entry.checkIn).getTime();
        const elapsedMs = now - checkInTime;
        const mins = Math.max(0, Math.round(elapsedMs / 60000));
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        const durationStr = `${h > 0 ? `${h}h ` : ""}${m}m`;

        const activeTimer = entry.user?.timeEntries?.[0];
        const activeTask = activeTimer?.task;

        const userInitials = entry.user?.name
          ? entry.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
          : "U";

        return (
          <div key={entry.id} className="flex flex-col p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-900 hover:shadow-xs transition-all duration-205">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0 select-none">
                  {userInitials}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-slate-700 dark:text-slate-200 text-xs truncate leading-snug">{entry.user?.name}</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">Checked in at {new Date(entry.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              </div>
              <span className="text-[10px] font-extrabold font-mono bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 px-2 py-0.5 rounded-lg flex items-center gap-1 shrink-0 select-none">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {durationStr}
              </span>
            </div>
            {activeTask && (
              <div className="mt-2 text-[10px] text-amber-800 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/40 rounded-xl p-2 flex items-center gap-2 min-w-0">
                <Play className="h-3 w-3 text-amber-600 fill-amber-600 shrink-0 animate-pulse" />
                <span className="truncate font-semibold">
                  Working on: <span className="font-bold text-slate-700 dark:text-slate-200">{activeTask.title}</span>
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: dashboardApi.summary });
  const [webhookModalOpen, setWebhookModalOpen] = useState(false);

  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    active: { bg: "bg-emerald-50/50 dark:bg-emerald-950/10", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-100/80 dark:border-emerald-900/30" },
    draft: { bg: "bg-sky-50/50 dark:bg-sky-950/10", text: "text-sky-700 dark:text-sky-400", border: "border-sky-100/80 dark:border-sky-900/30" },
    on_hold: { bg: "bg-amber-50/50 dark:bg-amber-950/10", text: "text-amber-700 dark:text-amber-400", border: "border-amber-100/80 dark:border-amber-900/30" },
    completed: { bg: "bg-violet-50/50 dark:bg-violet-950/10", text: "text-violet-700 dark:text-violet-400", border: "border-violet-100/80 dark:border-violet-900/30" },
    archived: { bg: "bg-slate-50/50 dark:bg-slate-800/20", text: "text-slate-600 dark:text-slate-400", border: "border-slate-200/80 dark:border-slate-800/50" },
  };

  return (
    <>
      {/* Welcome Greeting Banner */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
            Welcome back, <span className="text-gradient-brand">{user?.name || "Member"}</span>!
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Here is what's happening across your workspace today.</p>
        </div>
        <div className="flex items-center gap-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-zinc-900/50 dark:backdrop-blur-md border border-slate-200/60 dark:border-white/[0.06] px-4 py-2.5 rounded-xl shadow-sm w-fit select-none">
          <Calendar className="h-4 w-4 text-brand-600" />
          <span>{new Date().toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <Card 
          label="Total projects" 
          value={isLoading ? "…" : data?.totalProjects ?? 0} 
          icon={<Folder className="w-5 h-5" />} 
          colorClass="text-brand-600 bg-brand-50 border-brand-100 dark:text-brand-400 dark:bg-brand-900/20 dark:border-brand-900/60"
          gradientClass="from-brand-500/[0.02] to-indigo-500/[0.02] dark:from-brand-500/[0.01] dark:to-indigo-500/[0.01]"
        />
        <Card 
          label="Total tasks" 
          value={isLoading ? "…" : data?.totalTasks ?? 0} 
          icon={<CheckSquare className="w-5 h-5" />} 
          colorClass="text-emerald-600 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/20 dark:border-emerald-900/60"
          gradientClass="from-emerald-500/[0.02] to-teal-500/[0.02] dark:from-emerald-500/[0.01] dark:to-teal-500/[0.01]"
        />
        <Card 
          label="Team members" 
          value={isLoading ? "…" : data?.teamMembers ?? 0} 
          icon={<Users className="w-5 h-5" />} 
          colorClass="text-violet-600 bg-violet-50 border-violet-100 dark:text-violet-400 dark:bg-violet-950/20 dark:border-violet-900/60"
          gradientClass="from-violet-500/[0.02] to-purple-500/[0.02] dark:from-violet-500/[0.01] dark:to-purple-500/[0.01]"
        />
        <Card 
          label="Time tracked" 
          value={isLoading ? "…" : formatDuration(data?.totalMinutes ?? 0)} 
          icon={<Clock className="w-5 h-5" />} 
          colorClass="text-amber-600 bg-amber-50 border-amber-100 dark:text-amber-400 dark:bg-amber-950/20 dark:border-amber-900/60"
          gradientClass="from-amber-500/[0.02] to-orange-500/[0.02] dark:from-amber-500/[0.01] dark:to-orange-500/[0.01]"
        />
      </div>

      {/* Main Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Projects & Rates */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Projects Status Distribution */}
          <div className="card-premium p-6 bg-white border border-slate-200/50">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-5">Projects Status Distribution</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
              {(["active", "on_hold", "draft", "completed", "archived"] as const).map((status) => {
                const count = data?.projectsByStatus?.[status] ?? 0;
                const colors = statusColors[status] || statusColors.draft;
                return (
                  <div key={status} className={`p-4 rounded-2xl border ${colors.bg} ${colors.border} flex flex-col items-center justify-center transition-all duration-200 hover:scale-[1.03] hover:shadow-xs`}>
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">{isLoading ? "…" : count}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider mt-2 px-2.5 py-0.5 rounded-lg ${colors.text} bg-white dark:bg-zinc-800/80 border border-current/10 dark:border-white/[0.05] select-none`}>
                      {status.replace("_", " ")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time & Task Completion Overview */}
          <div className="card-premium p-6 bg-white border border-slate-200/50 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Total Hours Tracked</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">All registered developer hours for the current cycle.</p>
              <div className="text-4xl font-black text-brand-600 dark:text-brand-400 font-mono flex items-baseline gap-1 mt-3">
                {isLoading ? "…" : `${Math.floor((data?.totalMinutes ?? 0) / 60)}`}
                <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider ml-1 select-none">hours</span>
                <span className="text-4xl font-black text-indigo-500 dark:text-indigo-400 font-mono ml-2">{(data?.totalMinutes ?? 0) % 60}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider ml-1 select-none">mins</span>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Task Completion Rate</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Successful completions over total assigned workflow tasks.</p>
              {isLoading ? (
                <div className="text-4xl font-extrabold text-slate-350 dark:text-slate-700">…</div>
              ) : (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">{data?.completedTasks} of {data?.totalTasks} tasks done</span>
                    <span className="text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 border border-brand-100/50 dark:border-brand-900/40 px-2 py-0.5 rounded-lg font-extrabold">
                      {data?.totalTasks ? Math.round((data.completedTasks / data.totalTasks) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-zinc-850/50 h-2.5 rounded-full overflow-hidden border border-slate-200/30 dark:border-white/[0.05]">
                    <div className="bg-gradient-to-r from-brand-500 to-indigo-500 h-full rounded-full transition-all duration-500 shadow-xs"
                      style={{ width: `${data?.totalTasks ? (data.completedTasks / data.totalTasks) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Office status & Timeline */}
        <div className="lg:col-span-1 space-y-6">
          {/* Who is checked in */}
          <div className="card-premium p-6 bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-white/[0.06] flex flex-col h-fit">
            <div className="flex items-center justify-between mb-5 border-b border-slate-105 dark:border-white/[0.06] pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                Who's in the Office
              </h3>
              <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 rounded-full select-none uppercase tracking-wider">Active</span>
            </div>
            <ActiveUsersList activeAttendance={data?.activeAttendance || []} isLoading={isLoading} />
          </div>

          {/* Commits timeline card */}
          <div className="card-premium p-6 bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-white/[0.06] flex flex-col h-fit">
            <div className="flex items-center justify-between mb-5 border-b border-slate-105 dark:border-white/[0.06] pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-blue-600" />
                Latest Commits
              </h3>
              <button
                onClick={() => setWebhookModalOpen(true)}
                className="text-[9px] font-bold px-2 py-0.5 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-700 dark:hover:text-blue-300 transition-all select-none uppercase tracking-wider cursor-pointer"
              >
                Webhooks
              </button>
            </div>

            {isLoading ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500 py-12 text-xs font-semibold animate-pulse">Loading commits feed…</div>
            ) : !data?.latestCommits || data.latestCommits.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-550 py-12 text-center">
                <GitBranch className="w-8 h-8 mb-2 text-slate-350" />
                <p className="text-xs font-bold text-slate-450">No commits received yet.</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 px-4 mt-1.5 leading-normal max-w-xs mx-auto font-normal">Configure your GitHub webhooks to POST to `/api/webhooks/github` to see pushes here.</p>
              </div>
            ) : (
              <div className="flex-1 relative border-l border-slate-100 dark:border-white/[0.06] pl-4 ml-2.5 space-y-5">
                {data.latestCommits.map((commit) => (
                  <div key={commit.id} className="relative group">
                    {/* Timeline Node dot */}
                    <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white dark:border-zinc-900 group-hover:scale-120 group-hover:bg-indigo-650 transition-all" />
                    
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-550 mb-1">
                        <span className="font-bold text-slate-650 dark:text-slate-350">{commit.authorName}</span>
                        <span className="font-medium">{formatRelativeTime(commit.committedAt)}</span>
                      </div>
                      <div className="text-xs text-slate-800 dark:text-slate-205 font-semibold break-words leading-relaxed group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        {commit.message}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {commit.project && (
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-slate-105 dark:bg-zinc-800/80 text-slate-500 dark:text-zinc-400 border border-slate-200/40 dark:border-white/[0.06] px-1.5 py-0.5 rounded-md">
                            {commit.project.name}
                          </span>
                        )}
                        <a href={commit.url} target="_blank" rel="noopener noreferrer" className="text-[9px] font-bold font-mono text-blue-500 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-55 dark:hover:bg-blue-900/30 border border-blue-105/30 dark:border-blue-900/40 px-1.5 py-0.5 rounded-md transition-all">
                          SHA: {commit.sha.slice(0, 7)}
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* GitHub Webhook Info Modal */}
      <Modal
        open={webhookModalOpen}
        onClose={() => setWebhookModalOpen(false)}
        title="GitHub Webhook Setup"
        footer={
          <button className="btn-primary" onClick={() => setWebhookModalOpen(false)}>
            Close
          </button>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed font-medium">
            Pushed commits are automatically shown on this timeline in real-time. Configure a webhook in your GitHub repository to POST events to this ERP instance.
          </p>
          <div>
            <label className="label font-bold text-slate-550 dark:text-slate-400 text-[10px] uppercase tracking-wider mb-1.5 block">Payload URL</label>
            <div className="flex gap-2">
              <input
                className="input font-mono text-[11px] bg-slate-50 dark:bg-zinc-900/40 dark:backdrop-blur-sm border-slate-200 dark:border-white/[0.08] select-all flex-1 py-2 px-3.5 rounded-xl text-slate-700 dark:text-slate-350"
                readOnly
                value={`${window.location.origin}/api/webhooks/github`}
              />
              <button
                className="btn-secondary text-xs shrink-0 flex items-center gap-1.5 rounded-xl font-bold"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/github`);
                  toast.success("Copied to clipboard");
                }}
              >
                Copy
              </button>
            </div>
          </div>
          <div className="text-xs text-slate-550 dark:text-slate-400 space-y-1.5 pl-4 list-decimal mt-4 border-t border-slate-100 dark:border-white/[0.06] pt-4 font-medium">
            <h4 className="font-bold text-slate-705 dark:text-slate-200 -ml-4 mb-1.5 text-xs">Configuration Steps:</h4>
            <li>Go to your repository <strong>Settings</strong> &rarr; <strong>Webhooks</strong>.</li>
            <li>Click <strong>Add webhook</strong>.</li>
            <li>Use the payload URL above.</li>
            <li>Set Content type to <strong>application/json</strong>.</li>
            <li>Trigger on <strong>push</strong> events.</li>
          </div>
        </div>
      </Modal>
    </>
  );
}
