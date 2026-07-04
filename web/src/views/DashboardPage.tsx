import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { dashboardApi } from "@/services/featureApis";
import { Folder, CheckSquare, Users, Clock, GitCommit, GitBranch, Play, Calendar, Palmtree, CheckCircle } from "lucide-react";
import { Modal } from "@/components/Modal";
import { toast } from "@/lib/toast";
import { useAuth } from "@/features/auth/AuthProvider";
import { DashboardSkeleton } from "@/components/Skeleton";

interface CardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  colorClass?: string;
  gradientClass?: string;
  children?: React.ReactNode;
}

function Card({ label, value, icon, colorClass = "text-brand-600 bg-brand-50 border-brand-100 dark:text-brand-400 dark:bg-brand-900/20 dark:border-brand-900/60", gradientClass = "from-brand-500/5 to-indigo-500/5", children }: CardProps) {
  return (
    <div className={`card-premium p-6 flex items-start justify-between bg-gradient-to-br ${gradientClass} border border-slate-200/50 dark:border-slate-800/60 hover:shadow-lg transition-all duration-300`}>
      <div className="space-y-2 min-w-0 flex-1 mr-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</span>
        <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">{value}</div>
        {children && <div className="pt-2 flex flex-wrap gap-1.5">{children}</div>}
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

interface UserAttendanceCardProps {
  group: any;
  type: "active" | "checked-out";
  now: number;
}

function UserAttendanceCard({ group, type, now }: UserAttendanceCardProps) {
  const [showAll, setShowAll] = useState(false);

  const userInitials = group.user?.name
    ? group.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  const totalSessions = group.entries.length;
  const firstEntry = group.entries[0];
  const remainingEntries = group.entries.slice(1);

  // We show 2 sessions max by default: 1 main session + 1 remaining session
  const visibleEntries = showAll ? remainingEntries : remainingEntries.slice(0, 1);
  const extraSessionsCount = remainingEntries.length - 1; // totalSessions - 2

  const checkInTime = new Date(firstEntry.checkIn).getTime();
  const durationMs = type === "active" ? now - checkInTime : new Date(firstEntry.checkOut).getTime() - checkInTime;
  const mins = Math.max(0, Math.round(durationMs / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const durationStr = `${h > 0 ? `${h}h ` : ""}${m}m`;

  const activeTimer = firstEntry.user?.timeEntries?.[0];
  const activeTask = activeTimer?.task;

  return (
    <div className="relative flex flex-col p-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-900 hover:shadow-xs transition-all duration-200 overflow-hidden">
      {/* Dashed line connecting sessions, only show if we have more than 1 session */}
      {totalSessions > 1 && (
        <div className="absolute left-[30px] top-[46px] bottom-[22px] border-l border-dashed border-slate-200 dark:border-slate-800/80" />
      )}

      {/* Header: User Profile & First/Latest Session */}
      <div className="flex items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`h-8 w-8 rounded-xl bg-gradient-to-tr ${type === "active" ? "from-emerald-500 to-teal-500" : "from-slate-400 to-slate-500"} flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0 select-none`}>
            {userInitials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-slate-700 dark:text-slate-200 text-xs truncate leading-snug">
                {group.user?.name}
              </span>
              {totalSessions > 1 && (
                <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md border shrink-0 select-none ${
                  type === "active" 
                    ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40"
                    : "bg-brand-50 dark:bg-brand-950/20 text-brand-700 dark:text-brand-400 border-brand-100 dark:border-brand-900/40"
                }`}>
                  {totalSessions} sessions
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
              {type === "active" ? (
                `In: ${new Date(firstEntry.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
              ) : (
                `In: ${new Date(firstEntry.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • Out: ${new Date(firstEntry.checkOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
              )}
            </div>
          </div>
        </div>
        {type === "active" ? (
          <span className="text-[10px] font-extrabold font-mono bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/40 px-2 py-0.5 rounded-lg flex items-center gap-1 shrink-0 select-none">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {durationStr}
          </span>
        ) : (
          <span className="text-[10px] font-extrabold font-mono bg-slate-100 dark:bg-zinc-800 text-slate-650 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 px-2 py-0.5 rounded-lg flex items-center gap-1 shrink-0 select-none">
            {durationStr}
          </span>
        )}
      </div>

      {/* Active Task for main session */}
      {type === "active" && activeTask && (
        <div className="mt-2.5 text-[10px] text-amber-800 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/40 rounded-xl p-2 flex items-center gap-2 min-w-0 ml-[42px] relative z-10">
          <Play className="h-3 w-3 text-amber-600 fill-amber-600 shrink-0 animate-pulse" />
          <span className="truncate font-semibold">
            Working on: <span className="font-bold text-slate-700 dark:text-slate-200">{activeTask.title}</span>
          </span>
        </div>
      )}

      {/* Stacked remaining sessions list */}
      {visibleEntries.length > 0 && (
        <div className="mt-3 space-y-3 relative z-10">
          {visibleEntries.map((entry: any) => {
            const entryCheckInTime = new Date(entry.checkIn).getTime();
            const entryDurationMs = type === "active" ? now - entryCheckInTime : new Date(entry.checkOut).getTime() - entryCheckInTime;
            const entryMins = Math.max(0, Math.round(entryDurationMs / 60000));
            const entryH = Math.floor(entryMins / 60);
            const entryM = entryMins % 60;
            const entryDurationStr = `${entryH > 0 ? `${entryH}h ` : ""}${entryM}m`;

            const entryActiveTimer = entry.user?.timeEntries?.[0];
            const entryActiveTask = entryActiveTimer?.task;

            return (
              <div key={entry.id} className="relative pl-[42px] flex flex-col gap-1.5">
                {/* Timeline node dot */}
                <div className="absolute left-[27px] top-[7px] w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-750 border border-slate-50 dark:border-slate-900 shadow-sm shrink-0" />
                
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    {type === "active" ? (
                      `In: ${new Date(entry.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                    ) : (
                      `In: ${new Date(entry.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • Out: ${new Date(entry.checkOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                    )}
                  </div>
                  {type === "active" ? (
                    <span className="text-[9px] font-extrabold font-mono bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/40 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0 select-none">
                      <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse"></span>
                      {entryDurationStr}
                    </span>
                  ) : (
                    <span className="text-[9px] font-extrabold font-mono bg-slate-100 dark:bg-zinc-800 text-slate-650 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0 select-none">
                      {entryDurationStr}
                    </span>
                  )}
                </div>
                {type === "active" && entryActiveTask && (
                  <div className="text-[9px] text-amber-800 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/40 rounded-lg p-1.5 flex items-center gap-1.5 min-w-0">
                    <Play className="h-2.5 w-2.5 text-amber-600 fill-amber-600 shrink-0 animate-pulse" />
                    <span className="truncate font-semibold">
                      Working on: <span className="font-bold text-slate-700 dark:text-slate-200">{entryActiveTask.title}</span>
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Show more button if extra sessions exist */}
      {totalSessions > 2 && (
        <div className="mt-2.5 pl-[42px] relative z-10">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-[10px] font-extrabold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-350 transition-colors duration-150 cursor-pointer flex items-center gap-1 select-none"
          >
            {showAll ? "Show less" : `Show more (${extraSessionsCount} more)`}
          </button>
        </div>
      )}
    </div>
  );
}

function ActiveUsersList({ activeAttendance, isLoading, type = "active" }: { activeAttendance: any[]; isLoading: boolean; type?: "active" | "checked-out" }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return <div className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center animate-pulse">Loading status...</div>;
  }

  if (!activeAttendance || activeAttendance.length === 0) {
    return (
      <div className="text-xs text-slate-400 dark:text-slate-500 py-6 italic text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
        {type === "active" ? "Nobody is checked in right now." : "Nobody has checked out today."}
      </div>
    );
  }

  // Group entries by user
  const groupedByUser = activeAttendance.reduce((acc: any[], entry) => {
    const userId = entry.userId || entry.user?.id || "unknown";
    let group = acc.find((g: any) => g.userId === userId);
    if (!group) {
      group = {
        userId,
        user: entry.user,
        entries: [],
      };
      acc.push(group);
    }
    group.entries.push(entry);
    return acc;
  }, []);

  // Sort groups: latest checkIn time of any entry in the group descending
  groupedByUser.sort((a: any, b: any) => {
    const latestA = Math.max(...a.entries.map((e: any) => new Date(e.checkIn).getTime()));
    const latestB = Math.max(...b.entries.map((e: any) => new Date(e.checkIn).getTime()));
    return latestB - latestA;
  });

  // Sort entries inside each group descending (latest checkIn first)
  groupedByUser.forEach((group: any) => {
    group.entries.sort((a: any, b: any) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime());
  });

  return (
    <div className="space-y-3">
      {groupedByUser.map((group: any) => (
        <UserAttendanceCard key={group.userId} group={group} type={type} now={now} />
      ))}
    </div>
  );
}

function LeavesTodayList({ leavesToday, isLoading }: { leavesToday: any[]; isLoading: boolean }) {
  if (isLoading) {
    return <div className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center animate-pulse">Loading leave status...</div>;
  }

  if (!leavesToday || leavesToday.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {leavesToday.map((leave) => {
        const userInitials = leave.user?.name
          ? leave.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
          : "U";

        return (
          <div key={leave.id} className="flex items-center justify-between p-3 rounded-2xl bg-violet-50/50 dark:bg-violet-950/10 border border-violet-100 dark:border-violet-900/30">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0 select-none">
                {userInitials}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-slate-700 dark:text-zinc-200 text-xs truncate leading-snug">{leave.user?.name}</div>
                <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium mt-0.5">{leave.user?.email}</div>
              </div>
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-violet-100/70 dark:bg-violet-900/40 text-violet-750 dark:text-violet-400 border border-violet-200/40 dark:border-violet-900/20 px-2 py-0.5 rounded-lg shrink-0 select-none">
              {leave.type}
            </span>
          </div>
        );
      })}
    </div>
  );
}export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: dashboardApi.summary });
  const [webhookModalOpen, setWebhookModalOpen] = useState(false);
  const [officeTab, setOfficeTab] = useState<"active" | "checked-out">("active");

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const activeAttendance = data?.activeAttendance?.filter((entry: any) => !entry.checkOut) || [];
  const checkedOutAttendance = data?.activeAttendance?.filter((entry: any) => entry.checkOut !== null) || [];

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
        >
          {!isLoading && (
            <>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/30">
                {data?.projectsByStatus?.active ?? 0} Active
              </span>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-455 border border-amber-100 dark:border-amber-900/30">
                {data?.projectsByStatus?.on_hold ?? 0} Hold
              </span>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-zinc-700">
                {data?.projectsByStatus?.completed ?? 0} Done
              </span>
            </>
          )}
        </Card>
        <Card 
          label="Total tasks" 
          value={isLoading ? "…" : data?.totalTasks ?? 0} 
          icon={<CheckSquare className="w-5 h-5" />} 
          colorClass="text-sky-600 bg-sky-50 border-sky-100 dark:text-sky-400 dark:bg-sky-950/20 dark:border-sky-900/60"
          gradientClass="from-sky-500/[0.02] to-blue-500/[0.02] dark:from-sky-500/[0.01] dark:to-blue-500/[0.01]"
        >
          {!isLoading && (
            <>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/30 text-sky-650 dark:text-sky-450 border border-sky-100 dark:border-sky-900/30">
                {data?.inProgressTasks ?? 0} Active
              </span>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/30">
                {data?.completedTasks ?? 0} Completed
              </span>
            </>
          )}
        </Card>
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
          
          {/* Who is checked in */}
          <div className="card-premium p-6 flex flex-col h-fit">
            <div className="flex items-center justify-between mb-5 border-b border-slate-100 dark:border-white/[0.06] pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                Who's in the Office
              </h3>
              <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-zinc-800/60 p-0.5 rounded-xl border border-slate-200/50 dark:border-white/[0.05]">
                <button
                  onClick={() => setOfficeTab("active")}
                  className={`text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg transition-all cursor-pointer select-none ${
                    officeTab === "active"
                      ? "bg-white dark:bg-zinc-700 text-emerald-700 dark:text-emerald-450 shadow-xs"
                      : "text-slate-400 dark:text-slate-500 hover:text-slate-650 dark:hover:text-zinc-350"
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setOfficeTab("checked-out")}
                  className={`text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg transition-all cursor-pointer select-none ${
                    officeTab === "checked-out"
                      ? "bg-white dark:bg-zinc-700 text-slate-700 dark:text-zinc-300 shadow-xs"
                      : "text-slate-400 dark:text-slate-500 hover:text-slate-650 dark:hover:text-zinc-350"
                  }`}
                >
                  Checked Out Today
                </button>
              </div>
            </div>
            <ActiveUsersList 
              activeAttendance={officeTab === "active" ? activeAttendance : checkedOutAttendance} 
              isLoading={isLoading} 
              type={officeTab}
            />
          </div>

          {/* Active Projects Activity */}
          <div className="card-premium p-6">
            <div className="flex items-center justify-between mb-5 border-b border-slate-100 dark:border-white/[0.06] pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Folder className="w-4 h-4 text-brand-600" />
                Active Projects Activity & Commits
              </h3>
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-brand-50 dark:bg-brand-950/20 text-brand-700 dark:text-brand-400 border border-brand-100/50 dark:border-brand-900/40 px-2.5 py-0.5 rounded-lg select-none">
                {data?.activeProjectsList?.length || 0} active
              </span>
            </div>

            {isLoading ? (
              <div className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center animate-pulse">Loading active projects...</div>
            ) : !data?.activeProjectsList || data.activeProjectsList.length === 0 ? (
              <div className="text-xs text-slate-400 dark:text-slate-500 py-8 italic text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                No active projects found.
              </div>
            ) : (
              <div className="space-y-4">
                {data.activeProjectsList.map((project) => {
                  const projectStart = new Date(project.startDate || project.createdAt);
                  const activeDays = Math.max(0, Math.floor((Date.now() - projectStart.getTime()) / (1000 * 60 * 60 * 24)));
                  
                  // Calculate active duration string
                  let durationStr = "";
                  if (activeDays < 30) {
                    durationStr = `${activeDays} day${activeDays === 1 ? "" : "s"}`;
                  } else {
                    const months = Math.floor(activeDays / 30);
                    const remainingDays = activeDays % 30;
                    durationStr = `${months} month${months === 1 ? "" : "s"}${remainingDays > 0 ? ` ${remainingDays} day${remainingDays === 1 ? "" : "s"}` : ""}`;
                  }

                  const lastCommit = project.commits?.[0];
                  let commitDaysAgo = -1;
                  let lastCommitStr = "No commits yet";
                  
                  if (lastCommit) {
                    const commitDate = new Date(lastCommit.committedAt);
                    commitDaysAgo = Math.max(0, Math.floor((Date.now() - commitDate.getTime()) / (1000 * 60 * 60 * 24)));
                    if (commitDaysAgo === 0) {
                      lastCommitStr = "today";
                    } else if (commitDaysAgo === 1) {
                      lastCommitStr = "yesterday";
                    } else {
                      lastCommitStr = `${commitDaysAgo} days ago`;
                    }
                  }

                  // Determine warning level
                  let statusColor = "text-slate-500 dark:text-slate-450";
                  let warningText = "";
                  let isAlert = false;

                  if (lastCommit) {
                    if (commitDaysAgo >= 60) {
                      statusColor = "text-rose-650 dark:text-rose-400 font-semibold";
                      warningText = "Delayed / Inactive > 2 months";
                      isAlert = true;
                    } else if (commitDaysAgo >= 30) {
                      statusColor = "text-amber-600 dark:text-amber-400 font-semibold";
                      warningText = "Delayed / Inactive > 1 month";
                      isAlert = true;
                    } else if (commitDaysAgo >= 7) {
                      statusColor = "text-slate-650 dark:text-slate-350";
                    } else {
                      statusColor = "text-emerald-650 dark:text-emerald-400 font-semibold";
                    }
                  } else {
                    if (activeDays >= 60) {
                      statusColor = "text-rose-650 dark:text-rose-400 font-semibold";
                      warningText = "No commits & active > 2 months";
                      isAlert = true;
                    } else if (activeDays >= 30) {
                      statusColor = "text-amber-600 dark:text-amber-400 font-semibold";
                      warningText = "No commits & active > 1 month";
                      isAlert = true;
                    }
                  }

                  // Task counts
                  const projectInProgressTasks = project.tasks.filter((t) => t.status === "in_progress").length;
                  const projectCompletedTasks = project.tasks.filter((t) => t.status === "done").length;

                  return (
                    <div key={project.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-900 hover:shadow-xs transition-all duration-200">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-snug">
                            {project.name}
                          </span>
                          {isAlert && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-md bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-450 border border-rose-100 dark:border-rose-900/40 uppercase tracking-wider animate-pulse">
                              Attention Needed
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-455 dark:text-slate-500 font-medium mt-1">
                          Continuing for <span className="text-slate-650 dark:text-slate-350 font-bold">{durationStr}</span> (since {projectStart.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })})
                        </div>
                        
                        {/* Tasks breakdown for project */}
                        <div className="flex items-center gap-2.5 mt-2.5 text-[10px] font-bold select-none">
                          <span className="flex items-center gap-1.5 bg-blue-50/60 dark:bg-blue-950/25 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-lg border border-blue-100/40 dark:border-blue-900/30">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                            {projectInProgressTasks} in progress
                          </span>
                          <span className="flex items-center gap-1.5 bg-emerald-50/60 dark:bg-emerald-950/25 text-emerald-700 dark:text-emerald-450 px-2 py-0.5 rounded-lg border border-emerald-100/40 dark:border-emerald-900/30">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            {projectCompletedTasks} completed
                          </span>
                        </div>
                      </div>

                      <div className="text-left sm:text-right shrink-0">
                        <div className="text-[11px] text-slate-455 dark:text-slate-500 font-medium">
                          Last commit: <span className={statusColor}>{lastCommitStr}</span>
                        </div>
                        {warningText && (
                          <div className="text-[9px] font-bold text-rose-500 dark:text-rose-400 mt-1">
                            {warningText}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Office status & Timeline */}
        <div className="lg:col-span-1 space-y-6">

          {/* Who is on leave today (Only show if > 0) */}
          {!isLoading && data?.leavesToday && data.leavesToday.length > 0 && (
            <div className="card-premium p-6 flex flex-col h-fit">
              <div className="flex items-center justify-between mb-5 border-b border-slate-100 dark:border-white/[0.06] pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 text-slate-400">
                  <Palmtree className="w-4 h-4 text-violet-600" />
                  On Leave Today
                </h3>
                <span className="text-[9px] font-bold px-2 py-0.5 bg-violet-50 dark:bg-violet-950/20 text-violet-650 dark:text-violet-400 border border-violet-100 dark:border-violet-900/40 rounded-full select-none uppercase tracking-wider">Time-Off</span>
              </div>
              <LeavesTodayList leavesToday={data.leavesToday} isLoading={isLoading} />
            </div>
          )}

          {/* Commits timeline card */}
          <div className="card-premium p-6 flex flex-col h-fit">
            <div className="flex items-center justify-between mb-5 border-b border-slate-100 dark:border-white/[0.06] pb-3">
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
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-zinc-800/80 text-slate-500 dark:text-zinc-400 border border-slate-200/40 dark:border-white/[0.06] px-1.5 py-0.5 rounded-md">
                            {commit.project.name}
                          </span>
                        )}
                        <a href={commit.url} target="_blank" rel="noopener noreferrer" className="text-[9px] font-bold font-mono text-blue-500 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-55 dark:hover:bg-blue-900/30 border border-blue-100/30 dark:border-blue-900/40 px-1.5 py-0.5 rounded-md transition-all">
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
