import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Modal } from "@/components/Modal";
import { usersApi } from "@/services/api";
import { attendanceApi, leavesApi, holidaysApi } from "@/services/featureApis";
import { useAuth } from "@/features/auth/AuthProvider";
import { formatDateTime, formatDate } from "@/lib/format";
import { Calendar, ChevronLeft, ChevronRight, Clock, User, UserCheck, XCircle, Plus, Trash2, Check, X, Plane, Palmtree, AlertCircle, FileText, CheckCircle2, Loader2 } from "lucide-react";
import type { User as UserType, AttendanceEntry, Leave, Holiday, LeaveType, LeaveStatus } from "@/types";

const getLeaveAbbreviation = (type: LeaveType): string => {
  switch (type) {
    case "casual":
      return "CL";
    case "annual":
      return "AL";
    case "sick":
      return "SL";
    case "unpaid":
      return "UL";
    default:
      return "L";
  }
};

const getAvatarColor = (name: string) => {
  const colors = [
    "bg-indigo-500 text-white",
    "bg-emerald-500 text-white",
    "bg-sky-500 text-white",
    "bg-amber-500 text-white",
    "bg-rose-500 text-white",
    "bg-violet-500 text-white",
    "bg-pink-500 text-white",
    "bg-teal-500 text-white",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

type UserAttendanceRow = {
  user: UserType;
  entries: AttendanceEntry[];
};

export default function AttendancePage() {
  const qc = useQueryClient();
  const { user: currentUser } = useAuth();
  const isAdminOrManager = currentUser?.role === "admin" || currentUser?.role === "manager";

  // Tab State
  const [activeTab, setActiveTab] = useState<"logs" | "leaves" | "holidays">("logs");

  // Attendance Log states
  const [viewMode, setViewMode] = useState<"daily" | "monthly">("daily");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toLocaleDateString("en-CA"));
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toLocaleDateString("en-CA").slice(0, 7));

  // Leave Form states
  const [leaveType, setLeaveType] = useState<LeaveType>("casual");
  const [leaveStartDate, setLeaveStartDate] = useState<string>("");
  const [leaveEndDate, setLeaveEndDate] = useState<string>("");
  const [leaveReason, setLeaveReason] = useState<string>("");
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);

  // Holiday Form states
  const [holidayModalOpen, setHolidayModalOpen] = useState(false);
  const [holidayDate, setHolidayDate] = useState<string>("");
  const [holidayName, setHolidayName] = useState<string>("");
  const [holidayDesc, setHolidayDesc] = useState<string>("");

  // Queries
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["users", "all"],
    queryFn: () => usersApi.list({ pageSize: 100 }),
  });

  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ["attendance", "list", selectedDate],
    queryFn: () => attendanceApi.list({ date: selectedDate, pageSize: 100 }),
    enabled: activeTab === "logs" && viewMode === "daily",
  });

  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ["attendance", "list-month", selectedMonth],
    queryFn: () => attendanceApi.list({ month: selectedMonth, pageSize: 1000 }),
    enabled: activeTab === "logs" && viewMode === "monthly",
  });

  const { data: leavesData, isLoading: leavesLoading } = useQuery({
    queryKey: ["leaves", "all"],
    queryFn: () => leavesApi.list(),
  });

  const { data: holidaysData, isLoading: holidaysLoading } = useQuery({
    queryKey: ["holidays", "all"],
    queryFn: () => holidaysApi.list(),
  });

  // Mutations
  const createLeave = useMutation({
    mutationFn: (data: { type: LeaveType; startDate: string; endDate: string; reason?: string | null }) =>
      leavesApi.create(data),
    onSuccess: () => {
      toast.success("Leave request submitted successfully");
      qc.invalidateQueries({ queryKey: ["leaves"] });
      setLeaveStartDate("");
      setLeaveEndDate("");
      setLeaveReason("");
      setLeaveModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to request leave");
    },
  });

  const updateLeaveStatus = useMutation({
    mutationFn: (variables: { id: string; status: LeaveStatus }) =>
      leavesApi.update(variables.id, { status: variables.status }),
    onSuccess: (_, variables) => {
      toast.success(`Leave request ${variables.status}`);
      qc.invalidateQueries({ queryKey: ["leaves"] });
      qc.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: () => {
      toast.error("Failed to update leave request");
    },
  });

  const cancelLeaveRequest = useMutation({
    mutationFn: (id: string) => leavesApi.remove(id),
    onSuccess: () => {
      toast.success("Leave request canceled successfully");
      qc.invalidateQueries({ queryKey: ["leaves"] });
    },
    onError: () => {
      toast.error("Failed to cancel leave request");
    },
  });

  const createHoliday = useMutation({
    mutationFn: (data: { date: string; name: string; description?: string | null }) =>
      holidaysApi.create(data),
    onSuccess: () => {
      toast.success("Holiday created successfully");
      qc.invalidateQueries({ queryKey: ["holidays"] });
      qc.invalidateQueries({ queryKey: ["attendance"] });
      setHolidayModalOpen(false);
      setHolidayDate("");
      setHolidayName("");
      setHolidayDesc("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create holiday");
    },
  });

  const removeHoliday = useMutation({
    mutationFn: (id: string) => holidaysApi.remove(id),
    onSuccess: () => {
      toast.success("Holiday removed successfully");
      qc.invalidateQueries({ queryKey: ["holidays"] });
      qc.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: () => {
      toast.error("Failed to delete holiday");
    },
  });

  // Calendar navigations
  const shiftDay = (amount: number) => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + amount);
    setSelectedDate(d.toLocaleDateString("en-CA"));
  };

  const shiftMonth = (amount: number) => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + amount, 1);
    setSelectedMonth(d.toLocaleDateString("en-CA").slice(0, 7));
  };

  const getDayName = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "long" });
  };

  // Monthly grid setup
  const [year, month] = selectedMonth.split("-").map(Number);
  const totalDays = new Date(year, month, 0).getDate();
  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);

  // Rows configuration
  const displayUsers = (usersData?.items ?? []).filter((u) => {
    if (currentUser?.role === "member") {
      return u.id === currentUser.id;
    }
    const activeData = viewMode === "daily" ? attendanceData : monthlyData;
    const hasEntries = (activeData?.items ?? []).some((e) => e.userId === u.id);
    return u.isActive || hasEntries;
  });

  const currentMonthEntries = viewMode === "daily" ? (attendanceData?.items ?? []) : (monthlyData?.items ?? []);

  const rows: UserAttendanceRow[] = displayUsers.map((u) => {
    const entries = currentMonthEntries.filter(
      (e) => e.userId === u.id || e.user?.id === u.id
    );
    return {
      user: u,
      entries,
    };
  });

  // Monthly statistics calculations with Holiday & Leave overrides
  const getMonthlyStats = (userId: string, userEntries: AttendanceEntry[]) => {
    let present = 0;
    let absent = 0;
    let totalMins = 0;

    const todayAtMidnight = new Date();
    todayAtMidnight.setHours(0, 0, 0, 0);

    for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
      const targetDate = new Date(year, month - 1, dayNum);
      const isFuture = targetDate > todayAtMidnight;
      const dayOfWeek = targetDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const dayEntries = userEntries.filter((entry) => {
        const entryDate = new Date(entry.checkIn);
        return entryDate.getDate() === dayNum;
      });

      // Holiday check
      const isDayHoliday = (holidaysData?.items ?? []).some((h) => {
        const hDate = new Date(h.date);
        return hDate.getFullYear() === year &&
               hDate.getMonth() === (month - 1) &&
               hDate.getDate() === dayNum;
      });

      // Approved leave check
      const isDayLeave = (leavesData?.items ?? []).some((l) => {
        if (l.status !== "approved" || l.userId !== userId) return false;
        const sDate = new Date(l.startDate);
        const eDate = new Date(l.endDate);
        const checkDate = new Date(year, month - 1, dayNum);
        checkDate.setHours(0, 0, 0, 0);
        sDate.setHours(0, 0, 0, 0);
        eDate.setHours(0, 0, 0, 0);
        return checkDate >= sDate && checkDate <= eDate;
      });

      if (dayEntries.length > 0) {
        present++;
        dayEntries.forEach((entry) => {
          if (!entry.checkOut) {
            const diffMs = new Date().getTime() - new Date(entry.checkIn).getTime();
            totalMins += Math.max(0, Math.round(diffMs / 60000));
          } else {
            const diffMs = new Date(entry.checkOut).getTime() - new Date(entry.checkIn).getTime();
            totalMins += Math.max(0, Math.round(diffMs / 60000));
          }
        });
      } else {
        // Do not mark as absent if it is a weekend, holiday, or approved leave day
        if (!isFuture && !isWeekend && !isDayHoliday && !isDayLeave) {
          absent++;
        }
      }
    }

    const hours = parseFloat((totalMins / 60).toFixed(1));
    return { present, absent, hours };
  };

  // Public Holiday check on selected date
  const holidayToday = (holidaysData?.items ?? []).find((h) => {
    const hDate = new Date(h.date);
    const checkDate = new Date(selectedDate + "T00:00:00");
    return hDate.getFullYear() === checkDate.getFullYear() &&
           hDate.getMonth() === checkDate.getMonth() &&
           hDate.getDate() === checkDate.getDate();
  });

  // Daily View Columns
  const dailyCols: Column<UserAttendanceRow>[] = [
    {
      key: "user",
      header: "Team Member",
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs ${getAvatarColor(r.user.name)}`}>
            {getInitials(r.user.name)}
          </div>
          <div>
            <div className="font-bold text-slate-850 dark:text-zinc-100 text-sm leading-tight">{r.user.name}</div>
            <div className="text-xs text-slate-400 dark:text-zinc-500 font-semibold">{r.user.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => {
        const isLeaveToday = (leavesData?.items ?? []).find((l) => {
          if (l.status !== "approved" || l.userId !== r.user.id) return false;
          const sDate = new Date(l.startDate);
          const eDate = new Date(l.endDate);
          const checkDate = new Date(selectedDate + "T00:00:00");
          checkDate.setHours(0, 0, 0, 0);
          sDate.setHours(0, 0, 0, 0);
          eDate.setHours(0, 0, 0, 0);
          return checkDate >= sDate && checkDate <= eDate;
        });

        if (r.entries.length === 0) {
          if (isLeaveToday) {
            return (
              <span className="badge bg-violet-50 text-violet-750 ring-violet-100/50 dark:bg-violet-950/30 dark:text-violet-400 dark:ring-violet-900/30 flex items-center gap-1 w-fit font-bold shadow-2xs">
                <Plane className="h-3.5 w-3.5" />
                {getLeaveAbbreviation(isLeaveToday.type)} Leave
              </span>
            );
          }

          return (
            <span className="badge bg-rose-50 text-rose-700 ring-rose-100/50 dark:bg-rose-950/30 dark:text-rose-450 dark:ring-rose-900/30 flex items-center gap-1 w-fit font-bold shadow-2xs">
              <XCircle className="h-3.5 w-3.5" />
              Absent
            </span>
          );
        }
        const hasActive = r.entries.some((e) => !e.checkOut);
        const statusBadge = hasActive ? (
          <span className="badge bg-amber-55/60 text-amber-700 ring-amber-200/55 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-900/30 flex items-center gap-1 w-fit animate-pulse font-bold shadow-2xs">
            <Clock className="h-3.5 w-3.5" />
            Checked In
          </span>
        ) : (
          <span className="badge bg-emerald-50 text-emerald-700 ring-emerald-100/50 dark:bg-emerald-950/20 dark:text-emerald-450 dark:ring-emerald-900/30 flex items-center gap-1 w-fit font-bold shadow-2xs">
            <UserCheck className="h-3.5 w-3.5" />
            Present
          </span>
        );

        if (isLeaveToday) {
          return (
            <div className="flex flex-col gap-1">
              {statusBadge}
              <span className="badge bg-violet-50 text-violet-750 ring-violet-100/50 dark:bg-violet-950/20 dark:text-violet-400 dark:ring-violet-900/30 flex items-center gap-1 w-fit text-[10px] font-bold">
                <Plane className="h-3 w-3" />
                Leave: {getLeaveAbbreviation(isLeaveToday.type)}
              </span>
            </div>
          );
        }

        return statusBadge;
      },
    },
    {
      key: "times",
      header: "Check In / Out Times",
      render: (r) => {
        if (r.entries.length === 0) {
          const isLeaveToday = (leavesData?.items ?? []).some((l) => {
            if (l.status !== "approved" || l.userId !== r.user.id) return false;
            const sDate = new Date(l.startDate);
            const eDate = new Date(l.endDate);
            const checkDate = new Date(selectedDate + "T00:00:00");
            checkDate.setHours(0, 0, 0, 0);
            sDate.setHours(0, 0, 0, 0);
            eDate.setHours(0, 0, 0, 0);
            return checkDate >= sDate && checkDate <= eDate;
          });
          return (
            <span className="text-slate-400 dark:text-zinc-500 italic text-xs font-medium">
              {isLeaveToday ? "Approved time-off" : "Did not attend office on this day"}
            </span>
          );
        }
        return (
          <div className="space-y-1.5 py-0.5">
            {r.entries.map((entry, idx) => (
              <div key={entry.id} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-zinc-400">
                {r.entries.length > 1 && (
                  <span className="font-bold text-slate-400 dark:text-zinc-500 text-[10px] bg-slate-100 dark:bg-zinc-800 px-1 py-0.2 rounded font-mono">
                    #{idx + 1}
                  </span>
                )}
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded">
                  {formatDateTime(entry.checkIn)}
                </span>
                <span className="text-slate-400 dark:text-zinc-500">→</span>
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded">
                  {entry.checkOut ? formatDateTime(entry.checkOut) : "Active Check-In"}
                </span>
              </div>
            ))}
          </div>
        );
      },
    },
    {
      key: "duration",
      header: "Duration",
      render: (r) => {
        if (r.entries.length === 0) return <span className="text-slate-400 dark:text-zinc-500 font-medium">—</span>;
        return (
          <div className="space-y-1.5 py-0.5">
            {r.entries.map((entry) => {
              if (!entry.checkOut) return <span key={entry.id} className="text-xs text-amber-600 dark:text-amber-500 font-bold font-mono animate-pulse">Active</span>;
              const diffMs = new Date(entry.checkOut).getTime() - new Date(entry.checkIn).getTime();
              const mins = Math.max(0, Math.round(diffMs / 60000));
              const h = Math.floor(mins / 60);
              const m = mins % 60;
              return (
                <div key={entry.id} className="badge bg-slate-100 dark:bg-zinc-800/80 text-slate-700 dark:text-slate-350 ring-slate-200/50 dark:ring-white/[0.04] font-semibold text-xs font-mono">
                  {h > 0 ? `${h}h ` : ""}{m}m
                </div>
              );
            })}
          </div>
        );
      },
    },
  ];

  // Monthly View Columns with holiday and leave cell renderers
  const monthlyCols: Column<UserAttendanceRow>[] = [
    {
      key: "user",
      header: "Team Member",
      render: (r) => (
        <div className="flex items-center gap-2.5 pr-2">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs ${getAvatarColor(r.user.name)}`}>
            {getInitials(r.user.name)}
          </div>
          <div>
            <div className="font-bold text-slate-850 dark:text-zinc-100 text-sm whitespace-nowrap">{r.user.name}</div>
            <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold whitespace-nowrap">{r.user.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "summary",
      header: "Monthly Stats",
      render: (r) => {
        const stats = getMonthlyStats(r.user.id, r.entries);
        return (
          <div className="flex flex-col gap-1 text-[11px] pr-3">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-450 px-1.5 py-0.2 rounded">
                {stats.present}d present
              </span>
              <span className="font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400 px-1.5 py-0.2 rounded">
                {stats.absent}d absent
              </span>
            </div>
            <span className="font-bold text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.2 rounded w-fit font-mono text-[10px]">
              {stats.hours} hrs worked
            </span>
          </div>
        );
      },
    },
    ...daysArray.map((dayNum) => {
      const dateObj = new Date(year, month - 1, dayNum);
      const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
      return {
        key: `day-${dayNum}`,
        header: (
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-bold text-slate-800 dark:text-zinc-200 leading-none">{dayNum}</span>
            <span className="text-[8px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-tight mt-0.5">{dayName}</span>
          </div>
        ),
        headerClassName: "text-center min-w-[55px] p-1 bg-slate-50/50 dark:bg-zinc-900/10",
        className: "text-center font-mono min-w-[55px] border-l border-slate-100/80 dark:border-white/[0.04] p-1 text-[11px]",
        render: (r: UserAttendanceRow) => {
          const dayEntries = r.entries.filter((entry) => {
            const entryDate = new Date(entry.checkIn);
            return entryDate.getDate() === dayNum;
          });

          // Check Holiday
          const dayHoliday = (holidaysData?.items ?? []).find((h) => {
            const hDate = new Date(h.date);
            return hDate.getFullYear() === year &&
                   hDate.getMonth() === (month - 1) &&
                   hDate.getDate() === dayNum;
          });

          if (dayHoliday) {
            return (
              <span
                className="text-[9px] font-extrabold uppercase tracking-wide text-sky-700 bg-sky-50 dark:text-sky-400 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-800/30 px-1 py-0.5 rounded cursor-help"
                title={`Holiday: ${dayHoliday.name}${dayHoliday.description ? ` (${dayHoliday.description})` : ""}`}
              >
                Holy
              </span>
            );
          }

          // Check Approved Leave
          const approvedLeave = (leavesData?.items ?? []).find((l) => {
            if (l.status !== "approved" || l.userId !== r.user.id) return false;
            const sDate = new Date(l.startDate);
            const eDate = new Date(l.endDate);
            const checkDate = new Date(year, month - 1, dayNum);
            checkDate.setHours(0, 0, 0, 0);
            sDate.setHours(0, 0, 0, 0);
            eDate.setHours(0, 0, 0, 0);
            return checkDate >= sDate && checkDate <= eDate;
          });

          if (approvedLeave) {
            const leaveAbbrev = getLeaveAbbreviation(approvedLeave.type);
            let totalMins = 0;
            let hasActive = false;
            let workedString = "";

            if (dayEntries.length > 0) {
              dayEntries.forEach((entry) => {
                if (!entry.checkOut) {
                  hasActive = true;
                  const diffMs = new Date().getTime() - new Date(entry.checkIn).getTime();
                  totalMins += Math.max(0, Math.round(diffMs / 60000));
                } else {
                  const diffMs = new Date(entry.checkOut).getTime() - new Date(entry.checkIn).getTime();
                  totalMins += Math.max(0, Math.round(diffMs / 60000));
                }
              });

              const hrs = Math.floor(totalMins / 60);
              const mins = totalMins % 60;
              const formattedTime = hrs > 0 ? `${hrs}h${mins > 0 ? `${mins}m` : ""}` : `${mins}m`;
              workedString = hasActive ? "Active" : formattedTime;
            }

            return (
              <div className="flex flex-col items-center justify-center gap-1">
                <span
                  className="text-[9px] font-extrabold tracking-wide text-violet-750 bg-violet-50 dark:text-violet-400 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-800/30 px-1 py-0.5 rounded cursor-help"
                  title={`Leave: ${approvedLeave.type} Leave${approvedLeave.reason ? ` - "${approvedLeave.reason}"` : ""}`}
                >
                  {leaveAbbrev}
                </span>
                {dayEntries.length > 0 && (
                  <span
                    className={`text-[8px] font-bold px-1 py-0.2 rounded border ${
                      hasActive
                        ? "text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30 animate-pulse"
                        : "text-emerald-700 bg-emerald-50/70 dark:text-emerald-450 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30"
                    }`}
                    title={`Worked on leave day: ${workedString}`}
                  >
                    {workedString}
                  </span>
                )}
              </div>
            );
          }

          const dayOfWeek = dateObj.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

          const targetDate = dateObj;
          const todayAtMidnight = new Date();
          todayAtMidnight.setHours(0, 0, 0, 0);
          const isFuture = targetDate > todayAtMidnight;

          if (dayEntries.length === 0) {
            if (isFuture) {
              return <span className="text-slate-200 dark:text-zinc-800">—</span>;
            }
            if (isWeekend) {
              return <span className="text-slate-350 dark:text-zinc-600 font-semibold text-[9px]">WE</span>;
            }
            return (
              <span className="text-rose-400 dark:text-rose-500/80 font-bold text-xs" title="Absent / Did not attend office">
                ✕
              </span>
            );
          }

          let totalMins = 0;
          let hasActive = false;
          dayEntries.forEach((entry) => {
            if (!entry.checkOut) {
              hasActive = true;
              const diffMs = new Date().getTime() - new Date(entry.checkIn).getTime();
              totalMins += Math.max(0, Math.round(diffMs / 60000));
            } else {
              const diffMs = new Date(entry.checkOut).getTime() - new Date(entry.checkIn).getTime();
              totalMins += Math.max(0, Math.round(diffMs / 60000));
            }
          });

          const hrs = Math.floor(totalMins / 60);
          const mins = totalMins % 60;
          const formattedTime = hrs > 0 ? `${hrs}h${mins > 0 ? `${mins}m` : ""}` : `${mins}m`;

          if (hasActive) {
            return (
              <span
                className="text-[9px] font-bold text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 px-1 rounded animate-pulse"
                title="Active check-in currently running"
              >
                Active
              </span>
            );
          }

          return (
            <span
              className="text-[10px] font-semibold text-emerald-700 bg-emerald-50/70 dark:text-emerald-450 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 px-1 py-0.5 rounded cursor-pointer"
              title={dayEntries.map((e, idx) => `Check-in #${idx+1}: ${new Date(e.checkIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${e.checkOut ? new Date(e.checkOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Active'}`).join('\n')}
            >
              {formattedTime}
            </span>
          );
        },
      };
    }),
  ];

  // Helper values for Leave Tracker Dashboard
  const myLeaves = (leavesData?.items ?? []).filter((l) => l.userId === currentUser?.id);
  const pendingLeaves = (leavesData?.items ?? []).filter((l) => l.status === "pending");
  const leaveHistory = (leavesData?.items ?? []).filter((l) => l.status !== "pending");
  
  // Helper to calculate leave days excluding weekends and public holidays
  const calculateLeaveDays = (startDateStr: string, endDateStr: string) => {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    
    const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endMidnight = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    
    let workingDays = 0;
    const current = new Date(startMidnight);
    
    const holidays = holidaysData?.items ?? [];
    
    while (current <= endMidnight) {
      const dayOfWeek = current.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 0 = Sunday, 6 = Saturday
      
      const isHoliday = holidays.some((h) => {
        const hDate = new Date(h.date);
        return hDate.getFullYear() === current.getFullYear() &&
               hDate.getMonth() === current.getMonth() &&
               hDate.getDate() === current.getDate();
      });
      
      if (!isWeekend && !isHoliday) {
        workingDays++;
      }
      
      current.setDate(current.getDate() + 1);
    }
    
    return workingDays;
  };

  // Calculations for Leave limits/balances (Allowance default values: Sick: 10, Casual: 15, Annual: 20)
  const getLeaveStats = () => {
    const approvedMyLeaves = myLeaves.filter((l) => l.status === "approved");
    let sick = 0;
    let casual = 0;
    let annual = 0;
    let unpaid = 0;

    approvedMyLeaves.forEach((l) => {
      const diffDays = calculateLeaveDays(l.startDate, l.endDate);
      if (l.type === "sick") sick += diffDays;
      else if (l.type === "casual") casual += diffDays;
      else if (l.type === "annual") annual += diffDays;
      else if (l.type === "unpaid") unpaid += diffDays;
    });

    return { sick, casual, annual, unpaid };
  };

  const leaveStats = getLeaveStats();

  const handleRequestLeave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!leaveStartDate || !leaveEndDate) {
      toast.error("Please enter start and end dates");
      return;
    }

    const start = new Date(leaveStartDate);
    const end = new Date(leaveEndDate);
    if (start > end) {
      toast.error("Start date must be before or equal to end date");
      return;
    }

    // Overlap validation check
    const hasOverlap = myLeaves.some((l) => {
      if (l.status === "rejected") return false;
      const existingStart = new Date(l.startDate);
      const existingEnd = new Date(l.endDate);
      const newStart = new Date(leaveStartDate);
      const newEnd = new Date(leaveEndDate);
      existingStart.setHours(0, 0, 0, 0);
      existingEnd.setHours(0, 0, 0, 0);
      newStart.setHours(0, 0, 0, 0);
      newEnd.setHours(0, 0, 0, 0);
      return existingStart <= newEnd && existingEnd >= newStart;
    });

    if (hasOverlap) {
      toast.error("You already have an approved or pending leave request that overlaps with this date range.");
      return;
    }

    createLeave.mutate({
      type: leaveType,
      startDate: leaveStartDate,
      endDate: leaveEndDate,
      reason: leaveReason,
    });
  };

  const handleCreateHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayDate || !holidayName) {
      toast.error("Please fill in holiday date and name");
      return;
    }
    createHoliday.mutate({
      date: holidayDate,
      name: holidayName,
      description: holidayDesc,
    });
  };

  const pageIsLoading = usersLoading || (activeTab === "logs" && (viewMode === "daily" ? attendanceLoading : monthlyLoading)) || leavesLoading || holidaysLoading;

  return (
    <>
      <PageHeader
        title="Time & Attendance"
        description="Monitor office logs, submit leave requests, and manage public holidays."
        actions={
          <div className="flex bg-slate-100 dark:bg-zinc-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-white/[0.08] shadow-xs">
            {(["logs", "leaves", "holidays"] as const).map((tab) => (
              <button
                key={tab}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  activeTab === tab
                    ? "bg-white dark:bg-zinc-700 text-slate-850 dark:text-slate-100 shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "logs" && <Clock className="h-3.5 w-3.5" />}
                {tab === "leaves" && <Plane className="h-3.5 w-3.5" />}
                {tab === "holidays" && <Palmtree className="h-3.5 w-3.5" />}
                <span>{tab === "logs" ? "Attendance Logs" : tab === "leaves" ? "Leave Tracker" : "Holiday List"}</span>
              </button>
            ))}
          </div>
        }
      />

      {/* TABS CONTAINER */}
      <div className="space-y-6">
        
        {/* TAB 1: ATTENDANCE LOGS */}
        {activeTab === "logs" && (
          <>
            <div className="card-premium p-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-900 shadow-xs border border-slate-200/80 dark:border-white/[0.06]">
              {/* Left Side Navigation */}
              {viewMode === "daily" ? (
                <div className="flex items-center gap-2">
                  <button className="btn-secondary !p-2 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 transform transition-all duration-200" onClick={() => shiftDay(-1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="relative">
                    <input
                      type="date"
                      className="input !py-1.5 !pl-8 !pr-3 font-semibold text-slate-700 dark:text-zinc-200 bg-slate-50 dark:bg-zinc-900/40 hover:bg-slate-100 dark:hover:bg-zinc-800/50 cursor-pointer rounded-lg border-slate-200 dark:border-white/[0.08]"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                    <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                  </div>
                  <button className="btn-secondary !p-2 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 transform transition-all duration-200" onClick={() => shiftDay(1)}>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button className="btn-secondary !p-2 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 transform transition-all duration-200" onClick={() => shiftMonth(-1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="relative">
                    <input
                      type="month"
                      className="input !py-1.5 !pl-8 !pr-3 font-semibold text-slate-700 dark:text-zinc-200 bg-slate-50 dark:bg-zinc-900/40 hover:bg-slate-100 dark:hover:bg-zinc-800/50 cursor-pointer rounded-lg border-slate-200 dark:border-white/[0.08]"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                    />
                    <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                  </div>
                  <button className="btn-secondary !p-2 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 transform transition-all duration-200" onClick={() => shiftMonth(1)}>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* View Toggle */}
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-xs text-slate-500 dark:text-zinc-400 hidden md:inline font-semibold">
                  {viewMode === "daily"
                    ? `Showing logs for ${getDayName(selectedDate)}, ${formatDate(selectedDate)}`
                    : `Showing monthly grid for ${selectedMonth}`}
                </span>

                <div className="flex bg-slate-100 dark:bg-zinc-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-white/[0.08] shadow-xs shrink-0">
                  <button
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      viewMode === "daily"
                        ? "bg-white dark:bg-zinc-700 text-slate-800 dark:text-slate-100 shadow-xs font-bold"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                    }`}
                    onClick={() => setViewMode("daily")}
                  >
                    Daily
                  </button>
                  <button
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      viewMode === "monthly"
                        ? "bg-white dark:bg-zinc-700 text-slate-800 dark:text-slate-100 shadow-xs font-bold"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                    }`}
                    onClick={() => setViewMode("monthly")}
                  >
                    Monthly Grid
                  </button>
                </div>
              </div>
            </div>

            {/* Holiday Warning Banner */}
            {viewMode === "daily" && holidayToday && (
              <div className="bg-sky-50/60 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/35 p-4 rounded-xl flex items-center gap-3 text-sky-850 dark:text-sky-350 shadow-inner">
                <span className="p-2 bg-sky-100 dark:bg-sky-900/40 rounded-lg text-sky-600 dark:text-sky-400 shrink-0">
                  <Palmtree className="h-5 w-5" />
                </span>
                <div>
                  <div className="font-bold text-sm">Public Holiday: {holidayToday.name}</div>
                  {holidayToday.description && (
                    <div className="text-xs text-sky-600 dark:text-sky-400/80 mt-0.5">{holidayToday.description}</div>
                  )}
                </div>
              </div>
            )}

            <DataTable
              rows={rows}
              loading={pageIsLoading}
              columns={viewMode === "daily" ? dailyCols : monthlyCols}
              rowKey={(r) => r.user.id}
              className={viewMode === "monthly" ? "overflow-x-auto max-w-full" : ""}
              tableClassName={viewMode === "monthly" ? "min-w-[1400px] md:min-w-[1600px] lg:min-w-[1800px]" : ""}
            />
          </>
        )}

        {/* TAB 2: LEAVE TRACKER */}
        {activeTab === "leaves" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Left Column: Form & Limits */}
            <div className="lg:col-span-1 space-y-6">
              {/* Leave Balances */}
              <div className="card-premium p-5 space-y-4">
                <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-150 uppercase tracking-wide border-b border-slate-100 dark:border-white/[0.04] pb-3 flex items-center gap-2">
                  <Plane className="h-4.5 w-4.5 text-brand-600 dark:text-brand-400" />
                  My Leave Balance
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50/40 dark:bg-zinc-900/30 border border-slate-200/50 dark:border-white/[0.04] rounded-xl p-3.5 text-center relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500" />
                    <span className="block text-xl font-extrabold text-slate-900 dark:text-zinc-50">{leaveStats.casual}/15</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 tracking-wider">Casual (CL)</span>
                  </div>
                  <div className="bg-slate-50/40 dark:bg-zinc-900/30 border border-slate-200/50 dark:border-white/[0.04] rounded-xl p-3.5 text-center relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
                    <span className="block text-xl font-extrabold text-slate-900 dark:text-zinc-50">{leaveStats.sick}/10</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 tracking-wider">Sick (SL)</span>
                  </div>
                  <div className="bg-slate-50/40 dark:bg-zinc-900/30 border border-slate-200/50 dark:border-white/[0.04] rounded-xl p-3.5 text-center relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-sky-500" />
                    <span className="block text-xl font-extrabold text-slate-900 dark:text-zinc-50">{leaveStats.annual}/20</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 tracking-wider">Annual (AL)</span>
                  </div>
                  <div className="bg-slate-50/40 dark:bg-zinc-900/30 border border-slate-200/50 dark:border-white/[0.04] rounded-xl p-3.5 text-center relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />
                    <span className="block text-xl font-extrabold text-slate-900 dark:text-zinc-50">{leaveStats.unpaid}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 tracking-wider">Unpaid (UL)</span>
                  </div>
                </div>
              </div>

              {/* Request Time-Off Trigger Button */}
              <button
                onClick={() => setLeaveModalOpen(true)}
                className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 shadow-glow-brand hover:-translate-y-0.5 active:translate-y-0 transform transition-all duration-200 cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Request Time-Off
              </button>
            </div>

            {/* Right Column: User lists & Admin Actions */}
            <div className="lg:col-span-2 space-y-6">
              {/* Admin Approval Queue */}
              {isAdminOrManager && pendingLeaves.length > 0 && (
                <div className="card-premium p-5 border-amber-200/30 dark:border-amber-900/30 bg-gradient-to-r from-amber-500/[0.02] to-transparent">
                  <h3 className="font-bold text-sm text-amber-800 dark:text-amber-400 uppercase tracking-wide border-b border-amber-100/50 dark:border-amber-900/30 pb-3 mb-4 flex items-center gap-2">
                    <span className="p-1 bg-amber-50 dark:bg-amber-500/15 rounded text-amber-600 dark:text-amber-400 animate-pulse">
                      <AlertCircle className="h-4.5 w-4.5" />
                    </span>
                    Pending Leaves Approval Queue ({pendingLeaves.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingLeaves.map((leave) => {
                      const daysCount = calculateLeaveDays(leave.startDate, leave.endDate);
                      return (
                        <div
                          key={leave.id}
                          className="bg-white/80 dark:bg-zinc-900/70 border border-slate-200/60 dark:border-white/[0.04] p-4 rounded-xl flex flex-col justify-between gap-3 shadow-sm relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-bl-full pointer-events-none" />
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs ${getAvatarColor(leave.user?.name || "")}`}>
                                  {getInitials(leave.user?.name || "")}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-bold text-sm text-slate-850 dark:text-zinc-100 truncate">{leave.user?.name}</h4>
                                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold truncate block">{leave.user?.email}</span>
                                </div>
                              </div>
                              <span className="badge uppercase tracking-wider text-[9px] px-2 py-0.5 bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200/30 shrink-0 font-bold shadow-2xs">
                                {leave.type}
                              </span>
                            </div>
                            
                            <div className="text-xs font-semibold text-slate-600 dark:text-zinc-400 mt-3 flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              <span className="bg-slate-50 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-slate-650 dark:text-slate-350">{formatDate(leave.startDate)} — {formatDate(leave.endDate)}</span>
                              <span className="text-slate-400 dark:text-zinc-500 font-semibold">({daysCount} {daysCount === 1 ? "day" : "days"})</span>
                            </div>

                            {leave.reason && (
                              <p className="text-xs text-slate-500 dark:text-zinc-500 italic mt-2.5 bg-slate-50 dark:bg-zinc-950/40 p-2.5 rounded-lg border border-slate-100/60 dark:border-white/[0.02] break-words">
                                "{leave.reason}"
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 border-t border-slate-100 dark:border-white/[0.04] pt-3 mt-1">
                            <button
                              onClick={() => updateLeaveStatus.mutate({ id: leave.id, status: "approved" })}
                              disabled={updateLeaveStatus.isPending}
                              className="btn bg-emerald-600 hover:bg-emerald-700 text-white flex-1 py-1.5 text-xs font-bold flex items-center justify-center gap-1 shadow-sm shadow-emerald-500/10 transition-all cursor-pointer rounded-lg"
                            >
                              <Check className="h-3.5 w-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => updateLeaveStatus.mutate({ id: leave.id, status: "rejected" })}
                              disabled={updateLeaveStatus.isPending}
                              className="btn bg-rose-600 hover:bg-rose-700 text-white flex-1 py-1.5 text-xs font-bold flex items-center justify-center gap-1 shadow-sm shadow-rose-500/10 transition-all cursor-pointer rounded-lg"
                            >
                              <X className="h-3.5 w-3.5" /> Reject
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* My Requests (Non-Admin View or general summary) */}
              <div className="card-premium p-5">
                <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-150 uppercase tracking-wide border-b border-slate-100 dark:border-white/[0.04] pb-3 mb-4 flex items-center gap-2">
                  <FileText className="h-4.5 w-4.5 text-brand-650 dark:text-brand-400" />
                  {isAdminOrManager ? "Leaves Log Database" : "My Leave History"}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-white/[0.06] text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-bold">
                        {isAdminOrManager && <th className="py-2.5 px-3">Team Member</th>}
                        <th className="py-2.5 px-3">Leave Type</th>
                        <th className="py-2.5 px-3">Date Period</th>
                        <th className="py-2.5 px-3">Reason</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                      {(isAdminOrManager ? [...pendingLeaves, ...leaveHistory] : myLeaves).map((leave) => {
                        const days = calculateLeaveDays(leave.startDate, leave.endDate);
                        
                        return (
                          <tr key={leave.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                            {isAdminOrManager && (
                              <td className="py-3 px-3 font-semibold text-slate-850 dark:text-zinc-200">
                                <div className="flex items-center gap-2">
                                  <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 ${getAvatarColor(leave.user?.name || "")}`}>
                                    {getInitials(leave.user?.name || "")}
                                  </div>
                                  <span>{leave.user?.name}</span>
                                </div>
                              </td>
                            )}
                            <td className="py-3 px-3 capitalize font-semibold text-slate-600 dark:text-zinc-400">
                              <span className={`badge uppercase text-[9px] font-bold ${
                                leave.type === "sick"
                                  ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 ring-emerald-100"
                                  : leave.type === "casual"
                                  ? "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 ring-indigo-100"
                                  : leave.type === "annual"
                                  ? "bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 ring-sky-100"
                                  : "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 ring-amber-100"
                              }`}>
                                {leave.type}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-600 dark:text-zinc-400 whitespace-nowrap">
                              {formatDate(leave.startDate)} — {formatDate(leave.endDate)}
                              <span className="text-[10px] text-slate-400 dark:text-zinc-500 ml-1 font-bold">({days}d)</span>
                            </td>
                            <td className="py-3 px-3 text-slate-500 dark:text-zinc-500 italic max-w-xs truncate" title={leave.reason || ""}>
                              {leave.reason || "—"}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`badge uppercase text-[9px] font-bold tracking-wider ${
                                  leave.status === "approved"
                                    ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-450 ring-emerald-100/50"
                                    : leave.status === "rejected"
                                    ? "bg-rose-50 text-rose-800 dark:bg-rose-950/20 dark:text-rose-450 ring-rose-100/50"
                                    : "bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 ring-amber-100/50"
                                }`}
                              >
                                {leave.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              {leave.status === "pending" && (leave.userId === currentUser?.id || isAdminOrManager) && (
                                <button
                                  onClick={() => {
                                    if (confirm("Are you sure you want to cancel this leave request?")) {
                                      cancelLeaveRequest.mutate(leave.id);
                                    }
                                  }}
                                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 font-bold hover:bg-red-50/60 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                                  title="Cancel Leave Request"
                                >
                                  Cancel
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {(isAdminOrManager ? [...pendingLeaves, ...leaveHistory] : myLeaves).length === 0 && (
                        <tr>
                          <td colSpan={isAdminOrManager ? 6 : 5} className="py-8 text-center text-slate-400 dark:text-zinc-500 font-medium">
                            No leave requests recorded.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: HOLIDAYS MANAGEMENT */}
        {activeTab === "holidays" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-800 dark:text-zinc-150 flex items-center gap-2">
                <Palmtree className="h-5 w-5 text-brand-650 dark:text-brand-400" />
                Public Holidays Calendar {new Date().getFullYear()}
              </h3>
              
              {isAdminOrManager && (
                <button
                  onClick={() => setHolidayModalOpen(true)}
                  className="btn-primary flex items-center gap-1.5 shadow-glow-brand hover:-translate-y-0.5 active:translate-y-0 transform transition-all duration-200 cursor-pointer text-xs"
                >
                  <Plus className="h-4 w-4" /> Add Public Holiday
                </button>
              )}
            </div>
                  
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {(holidaysData?.items ?? []).map((holiday) => {
                const date = new Date(holiday.date);
                const day = date.getDate();
                const monthName = date.toLocaleDateString("en-US", { month: "short" });
                const weekday = date.toLocaleDateString("en-US", { weekday: "long" });

                return (
                  <div
                    key={holiday.id}
                    className="card-premium overflow-hidden p-5 flex flex-col justify-between border border-slate-200/60 dark:border-white/[0.06] bg-white dark:bg-zinc-900/60 hover:-translate-y-1 hover:shadow-md transition-all duration-300 relative group"
                  >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-brand-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
                    <div>
                      {/* Top Date Box */}
                      <div className="flex items-center gap-3">
                        <div className="bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 border border-brand-100 dark:border-brand-500/10 rounded-xl px-3 py-1.5 text-center shrink-0 animate-float-slow">
                          <span className="block text-lg font-black leading-none">{day}</span>
                          <span className="text-[10px] uppercase font-bold leading-none">{monthName}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-100 leading-tight">{holiday.name}</h4>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-wider">{weekday}</span>
                        </div>
                      </div>

                      {/* Description */}
                      {holiday.description && (
                        <p className="text-xs text-slate-555 dark:text-zinc-500 mt-4 leading-relaxed bg-slate-50/50 dark:bg-zinc-955/30 p-2.5 rounded-lg border border-slate-100/50 dark:border-white/[0.02] break-words">
                          {holiday.description}
                        </p>
                      )}
                    </div>

                    {/* Bottom Admin Control */}
                    {isAdminOrManager && (
                      <div className="flex justify-end mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.04]">
                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to remove this holiday?")) {
                              removeHoliday.mutate(holiday.id);
                            }
                          }}
                          className="p-1 rounded text-slate-400 hover:text-red-500 dark:text-zinc-650 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
                          title="Delete Holiday"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {(holidaysData?.items ?? []).length === 0 && (
                <div className="col-span-full card py-16 text-center text-slate-400 dark:text-zinc-500 font-medium">
                  <Palmtree className="h-10 w-10 text-slate-300 dark:text-zinc-700 mx-auto mb-2" />
                  No holidays declared for this year.
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* HOLIDAY CREATE MODAL */}
      <Modal
        open={holidayModalOpen}
        onClose={() => setHolidayModalOpen(false)}
        title={
          <>
            <Palmtree className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            <span>Add Public Holiday</span>
          </>
        }
      >
        <form onSubmit={handleCreateHoliday} className="space-y-4">
          <div>
            <label className="label">Holiday Date</label>
            <input
              type="date"
              className="input cursor-pointer"
              required
              value={holidayDate}
              onChange={(e) => setHolidayDate(e.target.value)}
            />
          </div>
          
          <div>
            <label className="label">Holiday Name</label>
            <input
              type="text"
              placeholder="e.g. Christmas, New Year"
              className="input"
              required
              value={holidayName}
              onChange={(e) => setHolidayName(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Description (Optional)</label>
            <textarea
              placeholder="e.g. National office closure"
              rows={2}
              className="input resize-none"
              value={holidayDesc}
              onChange={(e) => setHolidayDesc(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-white/[0.06] pt-4 mt-2">
            <button
              type="button"
              onClick={() => setHolidayModalOpen(false)}
              className="btn-secondary text-xs px-4 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createHoliday.isPending}
              className="btn-primary text-xs px-4 flex items-center gap-1.5 shadow-glow-brand hover:-translate-y-0.5 active:translate-y-0 transform transition-all duration-200 cursor-pointer"
            >
              {createHoliday.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              Add Holiday
            </button>
          </div>
        </form>
      </Modal>

      {/* LEAVE REQUEST MODAL */}
      <Modal
        open={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
        title={
          <>
            <Plane className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            <span>Request Time-Off</span>
          </>
        }
      >
        <form onSubmit={(e) => handleRequestLeave(e)} className="space-y-4">
          <div>
            <label className="label">Leave Type</label>
            <select
              className="input cursor-pointer font-semibold"
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as LeaveType)}
            >
              <option value="casual">Casual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="annual">Annual Leave</option>
              <option value="unpaid">Unpaid Leave</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start Date</label>
              <input
                type="date"
                className="input cursor-pointer"
                required
                value={leaveStartDate}
                onChange={(e) => setLeaveStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="label">End Date</label>
              <input
                type="date"
                className="input cursor-pointer"
                required
                value={leaveEndDate}
                onChange={(e) => setLeaveEndDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">Reason / Notes</label>
            <textarea
              placeholder="Explain your request details..."
              rows={3}
              className="input resize-none"
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-white/[0.06] pt-4 mt-2">
            <button
              type="button"
              onClick={() => setLeaveModalOpen(false)}
              className="btn-secondary text-xs px-4 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLeave.isPending}
              className="btn-primary text-xs px-4 flex items-center gap-1.5 shadow-glow-brand hover:-translate-y-0.5 active:translate-y-0 transform transition-all duration-200 cursor-pointer"
            >
              {createLeave.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Submit Leave Request
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
