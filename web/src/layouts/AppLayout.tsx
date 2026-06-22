"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, FolderKanban, ListChecks, StickyNote,
  Clock, FileText, Settings as Cog, LogOut, Menu, Square, Loader2, Calendar, Building2,
  Sun, Moon, User, ChevronLeft, ChevronRight
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { useTimeTracker } from "@/features/time/TimeTrackerContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { attendanceApi } from "@/services/featureApis";
import { toast } from "@/lib/toast";
import { clsx } from "clsx";
import { useTheme } from "@/features/theme/ThemeContext";
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
  { to: "/settings", label: "Settings", icon: Cog },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { currentTimer, stopTimer, sprintRemaining, isTimerActionPending } = useTimeTracker();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDesktopCollapsed(localStorage.getItem("qubar_sidebar_collapsed") === "true");
    }
  }, []);

  const toggleDesktopCollapse = () => {
    setDesktopCollapsed((v) => {
      const next = !v;
      if (typeof window !== "undefined") {
        localStorage.setItem("qubar_sidebar_collapsed", String(next));
      }
      return next;
    });
  };

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message || "Check in failed"),
  });

  const checkOut = useMutation({
    mutationFn: attendanceApi.checkOut,
    onSuccess: () => {
      toast.success("Checked out successfully");
      qc.invalidateQueries({ queryKey: ["attendance"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message || "Check out failed"),
  });

  const formatSeconds = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex h-full bg-slate-50/50 dark:bg-zinc-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Sidebar Section */}
      <aside className={clsx(
        "shrink-0 border-r border-slate-200/60 dark:border-white/[0.06] bg-white dark:bg-zinc-900/70 dark:backdrop-blur-lg flex flex-col shadow-sm z-40 transition-all duration-300 fixed inset-y-0 left-0 md:relative md:translate-x-0 md:flex",
        open ? "translate-x-0 w-64" : "-translate-x-full w-64",
        desktopCollapsed ? "md:w-[72px]" : "md:w-64",
      )}>
        {/* Logo Area */}
        <div className={clsx(
          "h-16 flex items-center border-b border-slate-200/60 dark:border-white/[0.06] bg-white dark:bg-zinc-900/70 dark:backdrop-blur-lg transition-all duration-300",
          desktopCollapsed ? "px-4 justify-center" : "px-6 gap-2.5"
        )}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-lg shadow-brand-500/10 shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          {!desktopCollapsed && (
            <span className="font-bold text-base tracking-tight text-gradient-brand truncate animate-fade-in">Qubartech ERP</span>
          )}
        </div>

        {/* Navigation list */}
        <nav className={clsx(
          "flex-1 py-5 space-y-1 bg-slate-50/20 dark:bg-zinc-900/10 transition-all duration-300",
          desktopCollapsed ? "overflow-visible px-2" : "overflow-y-auto px-3.5"
        )}>
          {visible.map((item) => {
            const isActive = item.to === "/" ? pathname === "/" : pathname?.startsWith(item.to);
            return (
              <Link
                key={item.to}
                href={item.to}
                onClick={() => setOpen(false)}
                className={clsx(
                  "flex items-center text-sm font-semibold transition-all duration-200 group border-l-[4px] relative py-2.5",
                  desktopCollapsed ? "justify-center pl-0 pr-0 rounded-none" : "gap-3 pr-4 pl-3 rounded-r-xl rounded-l-none",
                  isActive
                    ? "bg-brand-50/80 dark:bg-brand-900/35 text-brand-700 dark:text-brand-400 border-brand-600 dark:border-brand-500"
                    : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-zinc-800/50",
                )}
              >
                <item.icon className={clsx(
                  "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                  isActive ? "text-brand-600 dark:text-brand-400" : "text-slate-400 group-hover:text-slate-500 dark:text-slate-500 dark:group-hover:text-slate-400"
                )} />
                {!desktopCollapsed && <span className="truncate animate-fade-in">{item.label}</span>}

                {/* Custom Tooltip for collapsed state */}
                {desktopCollapsed && (
                  <div className={clsx(
                    "absolute left-[calc(100%-1px)] top-0 bottom-0 pl-3 pr-5 flex items-center rounded-r-xl border-y border-r opacity-0 translate-x-[-2px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 pointer-events-none whitespace-nowrap z-50 text-sm font-semibold",
                    isActive
                      ? "bg-brand-50/80 dark:bg-brand-900/35 text-brand-700 dark:text-brand-400 border-brand-200 dark:border-brand-900/60"
                      : "bg-slate-100/70 dark:bg-zinc-800/50 text-slate-900 dark:text-slate-100 border-slate-200/60 dark:border-white/[0.06]"
                  )}>
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Card */}
        <div className={clsx(
          "border-t border-slate-200/60 dark:border-white/[0.06] bg-slate-50/60 dark:bg-zinc-900/40 dark:backdrop-blur-md transition-all duration-300 relative group",
          desktopCollapsed ? "p-3 flex justify-center" : "p-4"
        )}>
          <div className={clsx("flex items-center", desktopCollapsed ? "" : "gap-3")}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-sm select-none shrink-0">
              {user?.name ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "U"}
            </div>
            {!desktopCollapsed && (
              <div className="min-w-0 flex-1 space-y-0.5 animate-fade-in">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="truncate font-bold text-xs text-slate-800 dark:text-slate-200 leading-tight">{user?.name}</span>
                  <span className={clsx(
                    "inline-flex items-center rounded-md px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider border shrink-0 select-none",
                    user?.role === "admin"
                      ? "bg-red-55 text-red-650 border-red-100/60 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/40"
                      : user?.role === "manager"
                        ? "bg-amber-50 text-amber-700 border-amber-100/60 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40"
                        : "bg-blue-50 text-blue-600 border-blue-100/60 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/40"
                  )}>
                    {user?.role}
                  </span>
                </div>
                <div className="truncate text-[10px] text-slate-400 dark:text-zinc-400 font-medium leading-none">{user?.email}</div>
              </div>
            )}

            {/* Custom Tooltip for profile when collapsed */}
            {desktopCollapsed && (
              <div className="absolute left-[calc(100%-1px)] top-0 bottom-0 pl-3 pr-5 flex items-center rounded-r-xl opacity-0 translate-x-[-2px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 pointer-events-none whitespace-nowrap z-50 text-sm font-semibold bg-slate-100/70 dark:bg-zinc-800/50 text-slate-900 dark:text-slate-100 border-slate-200/60 dark:border-white/[0.06] shadow-sm">
                {user?.name || "User"}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Sidebar Backdrop Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-200/60 dark:border-white/[0.06] bg-white/70 dark:bg-zinc-900/50 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button className="md:hidden h-9 w-9 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-zinc-900" onClick={() => setOpen((v) => !v)}>
              <Menu className="h-4 w-4" />
            </button>
            {/* Desktop collapse button */}
            <button
              className="hidden md:flex h-9 w-9 items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-zinc-900 cursor-pointer"
              onClick={toggleDesktopCollapse}
              title={desktopCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {desktopCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Active Task Time Tracker */}
            {currentTimer && (
              <div className="hidden md:flex items-center gap-3 px-3.5 py-1 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-900/60 rounded-full shadow-sm text-xs font-semibold select-none animate-pulse-slow">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                </span>
                <span className="text-amber-800 dark:text-amber-300 font-medium truncate max-w-[100px] sm:max-w-[160px] md:max-w-[240px]">
                  Tracking: {currentTimer.task?.title}
                </span>
                <span className="font-mono bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800 font-extrabold shadow-sm">
                  {formatSeconds(sprintRemaining)}
                </span>
                <button
                  onClick={stopTimer}
                  disabled={isTimerActionPending}
                  className="p-1 hover:bg-amber-200 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 rounded-full transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  title="Stop timer"
                >
                  {isTimerActionPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Square className="h-3 w-3 fill-amber-700 dark:fill-amber-400" />
                  )}
                </button>
              </div>
            )}

            {/* Check In / Out status */}
            {user && (
              <div className="flex items-center gap-2">
                {attendanceLoading ? (
                  <span className="text-xs text-slate-400 dark:text-slate-500 animate-pulse">Checking status...</span>
                ) : attendance?.status === "checked-in" ? (
                  <button
                    disabled={checkOut.isPending || loggingOut}
                    onClick={() => checkOut.mutate()}
                    className="flex items-center gap-2 h-8 px-5 bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-950/25 dark:to-red-950/25 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 hover:from-rose-100 hover:to-red-100 dark:hover:from-rose-900/40 dark:hover:to-red-900/40 active:scale-[0.97] rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:pointer-events-none shadow-sm shadow-rose-250/20"
                  >
                    {checkOut.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin text-rose-600 dark:text-rose-455" />
                    ) : (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                      </span>
                    )}
                    {checkOut.isPending ? "Checking Out..." : "Check Out"}
                  </button>
                ) : (
                  <button
                    disabled={checkIn.isPending || loggingOut}
                    onClick={() => checkIn.mutate()}
                    className="flex items-center gap-2 h-9 px-5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40 hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-900/40 dark:hover:to-teal-900/40 active:scale-[0.97] rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:pointer-events-none shadow-sm shadow-emerald-250/20"
                  >
                    {checkIn.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin text-emerald-700 dark:text-emerald-400" />
                    ) : (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    )}
                    {checkIn.isPending ? "Checking In..." : (attendance?.status === "checked-out" ? "Check In Again" : "Check In")}
                  </button>
                )}
              </div>
            )}

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="h-9 w-9 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800/80 rounded-xl transition-all duration-200 border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-zinc-900/50 shadow-sm flex items-center justify-center cursor-pointer"
              title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            {/* Profile Avatar icon in Topbar dropdown */}
            {user && (
              <div className="relative border-l border-slate-200 dark:border-white/[0.08] pl-3 flex items-center" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 text-white font-bold text-xs shadow-sm select-none transition-transform hover:scale-105 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
                  aria-expanded={profileOpen}
                  aria-haspopup="true"
                  title={`${user.name} (${user.role})`}
                >
                  {user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-12 mt-2 w-64 origin-top-right rounded-2xl bg-white/90 dark:bg-zinc-900/95 backdrop-blur-lg border border-slate-200/50 dark:border-white/[0.08] shadow-[0_10px_35px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.35)] focus:outline-none z-50 p-2 transition-all animate-dropdown-in">
                    <div className="px-3 py-2.5 border-b border-slate-100 dark:border-white/[0.06] mb-2 bg-slate-50/50 dark:bg-zinc-850/30 rounded-xl flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-brand-500 to-indigo-500 flex items-center justify-center text-white font-extrabold text-xs shadow-xs shrink-0 select-none">
                        {user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate leading-tight">{user.name}</span>
                          <span className={clsx(
                            "inline-flex items-center rounded-md px-1.5 py-0.2 text-[8px] font-extrabold uppercase tracking-wider border shrink-0 select-none",
                            user.role === "admin"
                              ? "bg-red-50 text-red-650 border-red-100/60 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/40"
                              : user.role === "manager"
                                ? "bg-amber-50 text-amber-700 border-amber-100/60 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40"
                                : "bg-blue-50 text-blue-600 border-blue-100/60 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/40"
                          )}>
                            {user.role}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate leading-tight mt-0.5">{user.email}</p>
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          router.push("/profile");
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-355 hover:bg-slate-50 dark:hover:bg-zinc-800/60 hover:translate-x-1 transition-all duration-200 text-left cursor-pointer"
                      >
                        <User className="h-4 w-4 text-brand-500" />
                        <span>Edit Profile</span>
                      </button>

                      <button
                        disabled={loggingOut}
                        onClick={async () => {
                          setProfileOpen(false);
                          setLoggingOut(true);
                          try {
                            await logout();
                            router.push("/login");
                          } catch (e) {
                            toast.error("Logout failed");
                          } finally {
                            setLoggingOut(false);
                          }
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-650 dark:text-rose-405 hover:bg-rose-50 dark:hover:bg-rose-950/25 hover:translate-x-1 transition-all duration-200 text-left cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                      >
                        {loggingOut ? (
                          <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
                        ) : (
                          <LogOut className="h-4 w-4 text-rose-500" />
                        )}
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Active Task Time Tracker - Mobile Banner */}
        {currentTimer && (
          <div className="md:hidden flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-b border-amber-100 dark:border-amber-900/40 backdrop-blur-md sticky top-16 z-20 text-xs font-semibold select-none">
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
              </span>
              <span className="text-amber-800 dark:text-amber-300 font-medium truncate">
                Tracking: {currentTimer.task?.title}
              </span>
            </div>
            <div className="flex items-center gap-3 ml-2 shrink-0">
              <span className="font-mono bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800 font-extrabold shadow-sm">
                {formatSeconds(sprintRemaining)}
              </span>
              <button
                onClick={stopTimer}
                disabled={isTimerActionPending}
                className="p-1.5 bg-amber-100 dark:bg-amber-950/50 hover:bg-amber-200 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-450 rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center border border-amber-200 dark:border-amber-800"
                title="Stop timer"
              >
                {isTimerActionPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Square className="h-2.5 w-2.5 fill-amber-700 dark:fill-amber-400" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Content Children */}
        <main className="flex-1 overflow-auto p-6 md:p-8 bg-slate-50/60 dark:bg-zinc-950/20">
          {children}
        </main>
      </div>
    </div>
  );
}
