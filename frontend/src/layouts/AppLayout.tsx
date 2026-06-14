import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, FolderKanban, ListChecks, StickyNote,
  Clock, FileText, Settings as Cog, LogOut, Menu, Square, Loader2, Calendar
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { useTimeTracker } from "@/features/time/TimeTrackerContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { attendanceApi } from "@/services/featureApis";
import { toast } from "sonner";
import { clsx } from "clsx";
import type { Role } from "@/types";

type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }>; roles?: Role[] };
const items: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/notes", label: "Notes", icon: StickyNote },
  { to: "/time", label: "Time", icon: Clock },
  { to: "/attendance", label: "Attendance", icon: Calendar },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/users", label: "Users", icon: Users, roles: ["admin"] },
  { to: "/settings", label: "Settings", icon: Cog, roles: ["admin"] },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const { currentTimer, stopTimer, sprintRemaining, isTimerActionPending } = useTimeTracker();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const visible = items.filter((i) => !i.roles || (user && i.roles.includes(user.role)));
  const qc = useQueryClient();

  const { data: attendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ["attendance", "today"],
    queryFn: attendanceApi.status,
    enabled: !!user,
  });

  const checkIn = useMutation({
    mutationFn: attendanceApi.checkIn,
    onSuccess: () => {
      toast.success("Checked in successfully");
      qc.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: (e: Error) => toast.error(e.message || "Check in failed"),
  });

  const checkOut = useMutation({
    mutationFn: attendanceApi.checkOut,
    onSuccess: () => {
      toast.success("Checked out successfully");
      qc.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: (e: Error) => toast.error(e.message || "Check out failed"),
  });

  const formatSeconds = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex h-full">
      <aside className={clsx(
        "w-60 shrink-0 border-r border-slate-200 bg-white flex flex-col",
        open ? "block fixed inset-y-0 left-0 z-40" : "hidden md:flex",
      )}>
        <div className="h-14 flex items-center px-4 border-b border-slate-200">
          <span className="font-semibold tracking-tight text-slate-900">ERP</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {visible.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 px-4 py-2 text-sm",
                  isActive
                    ? "bg-brand-50 text-brand-700 border-r-2 border-brand-600"
                    : "text-slate-700 hover:bg-slate-50",
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-200 text-xs text-slate-500">
          <div className="truncate font-medium text-slate-700">{user?.name}</div>
          <div className="truncate">{user?.email}</div>
          <div className="mt-1 inline-block badge bg-slate-50 text-slate-600 ring-slate-200">{user?.role}</div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex items-center justify-between px-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <button className="md:hidden btn-secondary !p-2" onClick={() => setOpen((v) => !v)}>
              <Menu className="h-4 w-4" />
            </button>
            <div className="text-sm text-slate-500 font-medium hidden sm:block">Internal ERP</div>
          </div>

          <div className="flex items-center gap-3">
            {currentTimer && (
              <div className="flex items-center gap-3 px-3 py-1 bg-amber-50/80 border border-amber-200 rounded-full shadow-xs text-xs font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-slate-600 truncate max-w-[120px] md:max-w-[200px]">
                  {currentTimer.task?.title}
                </span>
                <span className="font-mono bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                  {formatSeconds(sprintRemaining)}
                </span>
                <button
                  onClick={stopTimer}
                  disabled={isTimerActionPending}
                  className="p-1 hover:bg-amber-200 rounded-full text-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  title="Stop timer"
                >
                  {isTimerActionPending ? (
                    <Loader2 className="h-3 w-3 animate-spin text-amber-700" />
                  ) : (
                    <Square className="h-3 w-3 fill-amber-700" />
                  )}
                </button>
              </div>
            )}

            {user && (
              <div className="flex items-center gap-2">
                {attendanceLoading ? (
                  <span className="text-xs text-slate-400">Loading attendance...</span>
                ) : attendance?.status === "checked-in" ? (
                  <button
                    disabled={checkOut.isPending || loggingOut}
                    onClick={() => checkOut.mutate()}
                    className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 active:bg-rose-200 rounded-full text-xs font-semibold active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {checkOut.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin text-rose-700" />
                    ) : (
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                      </span>
                    )}
                    {checkOut.isPending ? "Checking Out..." : "Check Out"}
                  </button>
                ) : attendance?.status === "checked-out" ? (
                  <span className="px-3 py-1 bg-slate-100 text-slate-500 border border-slate-200 rounded-full text-xs font-semibold flex items-center gap-1 select-none">
                    Checked Out
                  </span>
                ) : (
                  <button
                    disabled={checkIn.isPending || loggingOut}
                    onClick={() => checkIn.mutate()}
                    className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 active:bg-emerald-200 rounded-full text-xs font-semibold active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {checkIn.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin text-emerald-700" />
                    ) : null}
                    {checkIn.isPending ? "Checking In..." : "Check In"}
                  </button>
                )}
              </div>
            )}
          </div>

          <button
            className="btn-secondary flex items-center gap-2"
            disabled={loggingOut || checkIn.isPending || checkOut.isPending}
            onClick={async () => {
              setLoggingOut(true);
              try {
                await logout();
                nav("/login");
              } catch (e) {
                toast.error("Logout failed");
              } finally {
                setLoggingOut(false);
              }
            }}
          >
            {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            Logout
          </button>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
