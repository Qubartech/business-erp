import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { dashboardApi } from "@/services/featureApis";
import { Folder, CheckSquare, Users, Clock, GitCommit, GitBranch } from "lucide-react";

interface CardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}

function Card({ label, value, icon }: CardProps) {
  return (
    <div className="card p-5 hover:shadow-md transition-shadow duration-200 border border-slate-100 flex items-center justify-between">
      <div>
        <div className="text-xs uppercase tracking-wide font-medium text-slate-400">{label}</div>
        <div className="mt-2 text-3xl font-bold text-slate-800">{value}</div>
      </div>
      <div className="p-3 bg-slate-50 text-slate-500 rounded-lg">{icon}</div>
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

export default function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: dashboardApi.summary });

  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    active: { bg: "bg-emerald-50/50", text: "text-emerald-700", border: "border-emerald-100" },
    draft: { bg: "bg-sky-50/50", text: "text-sky-700", border: "border-sky-100" },
    on_hold: { bg: "bg-amber-50/50", text: "text-amber-700", border: "border-amber-100" },
    completed: { bg: "bg-violet-50/50", text: "text-violet-700", border: "border-violet-100" },
    archived: { bg: "bg-slate-50/50", text: "text-slate-600", border: "border-slate-100" },
  };

  return (
    <>
      <PageHeader title="Dashboard" description="Overview at a glance" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card label="Total projects" value={isLoading ? "…" : data?.totalProjects ?? 0} icon={<Folder className="w-5 h-5" />} />
        <Card label="Total tasks" value={isLoading ? "…" : data?.totalTasks ?? 0} icon={<CheckSquare className="w-5 h-5" />} />
        <Card label="Team members" value={isLoading ? "…" : data?.teamMembers ?? 0} icon={<Users className="w-5 h-5" />} />
        <Card label="Time tracked" value={isLoading ? "…" : formatDuration(data?.totalMinutes ?? 0)} icon={<Clock className="w-5 h-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Summaries */}
        <div className="lg:col-span-2 space-y-6">
          {/* Projects Status Distribution */}
          <div className="card p-6 border border-slate-100">
            <h3 className="text-base font-semibold text-slate-800 mb-4">Projects by Status</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {(["active", "on_hold", "draft", "completed", "archived"] as const).map((status) => {
                const count = data?.projectsByStatus?.[status] ?? 0;
                const colors = statusColors[status] || statusColors.draft;
                return (
                  <div key={status} className={`p-4 rounded-xl border ${colors.bg} ${colors.border} flex flex-col items-center justify-center transition-transform hover:scale-102 duration-150`}>
                    <span className="text-2xl font-bold text-slate-800">{isLoading ? "…" : count}</span>
                    <span className={`text-xs font-semibold uppercase tracking-wider mt-1 ${colors.text}`}>
                      {status.replace("_", " ")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time & Task Completion Overview */}
          <div className="card p-6 border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-base font-semibold text-slate-800 mb-2">Logged Hours</h3>
              <p className="text-sm text-slate-500 mb-4">Total recorded developer hours.</p>
              <div className="text-4xl font-extrabold text-blue-600">
                {isLoading ? "…" : `${Math.floor((data?.totalMinutes ?? 0) / 60)}h ${(data?.totalMinutes ?? 0) % 60}m`}
              </div>
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800 mb-2">Task Completion Rate</h3>
              <p className="text-sm text-slate-500 mb-4">Completed tasks out of total tasks.</p>
              {isLoading ? (
                <div className="text-4xl font-extrabold text-slate-400">…</div>
              ) : (
                <div>
                  <div className="text-4xl font-extrabold text-slate-800">
                    {data?.totalTasks ? Math.round((data.completedTasks / data.totalTasks) * 100) : 0}%
                  </div>
                  <div className="w-full bg-slate-100 h-2 mt-3 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${data?.totalTasks ? (data.completedTasks / data.totalTasks) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-400 mt-2">
                    {data?.completedTasks} of {data?.totalTasks} tasks completed
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Commits Timeline */}
        <div className="lg:col-span-1">
          <div className="card p-6 border border-slate-100 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <GitCommit className="w-5 h-5 text-blue-600" />
                Latest Commits
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">Webhooks</span>
            </div>

            {isLoading ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 py-12">Loading commits feed…</div>
            ) : !data?.latestCommits || data.latestCommits.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-12 text-center">
                <GitBranch className="w-8 h-8 mb-2 text-slate-300" />
                <p className="text-sm">No commits received yet.</p>
                <p className="text-xs text-slate-400 px-4 mt-1">Configure your GitHub webhooks to POST to `/api/webhooks/github` to see pushes here.</p>
              </div>
            ) : (
              <div className="flex-1 relative border-l border-slate-150 pl-4 ml-2 space-y-6">
                {data.latestCommits.map((commit) => (
                  <div key={commit.id} className="relative group">
                    {/* Timeline Node dot */}
                    <div className="absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white group-hover:scale-110 transition-transform" />
                    
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span className="font-semibold text-slate-600">{commit.authorName}</span>
                        <span>{formatRelativeTime(commit.committedAt)}</span>
                      </div>
                      <div className="text-sm text-slate-800 font-medium break-words leading-snug">
                        {commit.message}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {commit.project && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {commit.project.name}
                          </span>
                        )}
                        <a href={commit.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-mono text-blue-500 hover:text-blue-700 underline">
                          {commit.sha.slice(0, 7)}
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
    </>
  );
}
