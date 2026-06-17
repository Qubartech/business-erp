import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { usersApi } from "@/services/api";
import { attendanceApi, leavesApi, holidaysApi } from "@/services/featureApis";
import { useAuth } from "@/features/auth/AuthProvider";
import { formatDateTime, formatDate } from "@/lib/format";
import { Calendar, ChevronLeft, ChevronRight, Clock, User, UserCheck, XCircle, Plus, Trash2, Check, X, Plane, Palmtree, AlertCircle, FileText, CheckCircle2, Loader2 } from "lucide-react";
import type { User as UserType, AttendanceEntry, Leave, Holiday, LeaveType, LeaveStatus } from "@/types";

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
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 dark:bg-zinc-800 p-1.5 rounded-lg text-slate-500 dark:text-zinc-400">
            <User className="h-4 w-4" />
          </div>
          <div>
            <div className="font-semibold text-slate-800 dark:text-zinc-100 text-sm">{r.user.name}</div>
            <div className="text-xs text-slate-400 dark:text-zinc-500 font-medium">{r.user.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => {
        if (r.entries.length === 0) {
          // Check approved leave status
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

          if (isLeaveToday) {
            return (
              <span className="badge bg-violet-50 text-violet-700 ring-violet-200/50 dark:bg-violet-950/30 dark:text-violet-400 dark:ring-violet-800/30 flex items-center gap-1 w-fit capitalize font-semibold">
                <Plane className="h-3.5 w-3.5" />
                {isLeaveToday.type} Leave
              </span>
            );
          }

          return (
            <span className="badge bg-rose-50 text-rose-700 ring-rose-200/50 dark:bg-rose-950/30 dark:text-rose-450 dark:ring-rose-800/30 flex items-center gap-1 w-fit font-semibold">
              <XCircle className="h-3.5 w-3.5" />
              Absent
            </span>
          );
        }
        const hasActive = r.entries.some((e) => !e.checkOut);
        if (hasActive) {
          return (
            <span className="badge bg-amber-50 text-amber-700 ring-amber-200/50 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-800/30 flex items-center gap-1 w-fit animate-pulse font-semibold">
              <Clock className="h-3.5 w-3.5" />
              Checked In
            </span>
          );
        }
        return (
          <span className="badge bg-emerald-50 text-emerald-700 ring-emerald-200/50 dark:bg-emerald-950/30 dark:text-emerald-450 dark:ring-emerald-800/30 flex items-center gap-1 w-fit font-semibold">
            <UserCheck className="h-3.5 w-3.5" />
            Present
          </span>
        );
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
              <div key={entry.id} className="flex items-center gap-1.5 text-xs text-slate-650 dark:text-zinc-400">
                {r.entries.length > 1 && (
                  <span className="font-bold text-slate-400 dark:text-zinc-500 text-[10px] bg-slate-100 dark:bg-zinc-800 px-1 py-0.2 rounded font-mono">
                    #{idx + 1}
                  </span>
                )}
                <span className="font-semibold text-slate-700 dark:text-zinc-350 font-mono">
                  {formatDateTime(entry.checkIn)}
                </span>
                <span className="text-slate-400 dark:text-zinc-550">→</span>
                <span className="font-semibold text-slate-700 dark:text-zinc-350 font-mono">
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
              if (!entry.checkOut) return <span key={entry.id} className="text-xs text-amber-600 dark:text-amber-500 font-bold font-mono">Active</span>;
              const diffMs = new Date(entry.checkOut).getTime() - new Date(entry.checkIn).getTime();
              const mins = Math.max(0, Math.round(diffMs / 60000));
              const h = Math.floor(mins / 60);
              const m = mins % 60;
              return (
                <div key={entry.id} className="text-xs font-bold font-mono text-slate-600 dark:text-zinc-400 bg-slate-55/60 dark:bg-zinc-900/60 border border-slate-200 dark:border-white/[0.04] px-1.5 py-0.5 rounded w-fit">
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
        <div className="flex items-center gap-2 pr-2">
          <div className="bg-slate-100 dark:bg-zinc-800 p-1.5 rounded-lg text-slate-500 dark:text-zinc-400 shrink-0">
            <User className="h-4 w-4" />
          </div>
          <div>
            <div className="font-semibold text-slate-800 dark:text-zinc-100 text-sm whitespace-nowrap">{r.user.name}</div>
            <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium whitespace-nowrap">{r.user.email}</div>
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
            return (
              <span
                className="text-[9px] font-extrabold uppercase tracking-wide text-violet-750 bg-violet-50 dark:text-violet-400 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-800/30 px-1 py-0.5 rounded cursor-help"
                title={`Leave: ${approvedLeave.type} Leave${approvedLeave.reason ? ` - "${approvedLeave.reason}"` : ""}`}
              >
                Leave
              </span>
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

  // Calculations for Leave limits/balances (Allowance default values: Sick: 10, Casual: 15, Annual: 20)
  const getLeaveStats = () => {
    const approvedMyLeaves = myLeaves.filter((l) => l.status === "approved");
    let sick = 0;
    let casual = 0;
    let annual = 0;
    let unpaid = 0;

    approvedMyLeaves.forEach((l) => {
      const s = new Date(l.startDate);
      const e = new Date(l.endDate);
      const diffDays = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (l.type === "sick") sick += diffDays;
      else if (l.type === "casual") casual += diffDays;
      else if (l.type === "annual") annual += diffDays;
      else if (l.type === "unpaid") unpaid += diffDays;
    });

    return { sick, casual, annual, unpaid };
  };

  const leaveStats = getLeaveStats();

  const handleRequestLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveStartDate || !leaveEndDate) {
      toast.error("Please enter start and end dates");
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
          <div className="flex bg-slate-100 dark:bg-zinc-900 p-1 rounded-lg border border-slate-200/60 dark:border-white/[0.06] shadow-sm">
            {(["logs", "leaves", "holidays"] as const).map((tab) => (
              <button
                key={tab}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all capitalize ${
                  activeTab === tab
                    ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "logs" ? "Attendance Logs" : tab === "leaves" ? "Leave Tracker" : "Holiday List"}
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-900/60 backdrop-blur-md p-4 rounded-xl shadow-xs border border-slate-200/80 dark:border-white/[0.06]">
              {/* Left Side Navigation */}
              {viewMode === "daily" ? (
                <div className="flex items-center gap-2">
                  <button className="btn-secondary !p-2" onClick={() => shiftDay(-1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="relative">
                    <input
                      type="date"
                      className="input !py-1.5 !pl-8 !pr-3 font-semibold text-slate-700 dark:text-zinc-250 bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer rounded-lg border-slate-200 dark:border-white/[0.04]"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                    <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                  </div>
                  <button className="btn-secondary !p-2" onClick={() => shiftDay(1)}>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button className="btn-secondary !p-2" onClick={() => shiftMonth(-1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="relative">
                    <input
                      type="month"
                      className="input !py-1.5 !pl-8 !pr-3 font-semibold text-slate-700 dark:text-zinc-250 bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer rounded-lg border-slate-200 dark:border-white/[0.04]"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                    />
                    <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                  </div>
                  <button className="btn-secondary !p-2" onClick={() => shiftMonth(1)}>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* View Toggle */}
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 dark:text-zinc-550 hidden md:inline font-medium">
                  {viewMode === "daily"
                    ? `Showing logs for ${getDayName(selectedDate)}, ${formatDate(selectedDate)}`
                    : `Showing monthly grid for ${selectedMonth}`}
                </span>

                <div className="flex bg-slate-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-slate-200/60 dark:border-white/[0.06]">
                  <button
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      viewMode === "daily"
                        ? "bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 shadow-xs"
                        : "text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                    }`}
                    onClick={() => setViewMode("daily")}
                  >
                    Daily
                  </button>
                  <button
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      viewMode === "monthly"
                        ? "bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 shadow-xs"
                        : "text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
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
              <div className="card p-5 space-y-4">
                <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-150 uppercase tracking-wide border-b border-slate-100 dark:border-white/[0.04] pb-2">
                  My Leave Balance
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50/50 dark:bg-zinc-900/40 border border-slate-100 dark:border-white/[0.04] rounded-xl p-3.5 text-center">
                    <span className="block text-xl font-extrabold text-slate-900 dark:text-zinc-50">{leaveStats.casual}/15</span>
                    <span className="text-[10px] uppercase font-bold text-slate-450 dark:text-zinc-500 tracking-wider">Casual Leaves</span>
                  </div>
                  <div className="bg-slate-50/50 dark:bg-zinc-900/40 border border-slate-100 dark:border-white/[0.04] rounded-xl p-3.5 text-center">
                    <span className="block text-xl font-extrabold text-slate-900 dark:text-zinc-50">{leaveStats.sick}/10</span>
                    <span className="text-[10px] uppercase font-bold text-slate-450 dark:text-zinc-500 tracking-wider">Sick Leaves</span>
                  </div>
                  <div className="bg-slate-50/50 dark:bg-zinc-900/40 border border-slate-100 dark:border-white/[0.04] rounded-xl p-3.5 text-center">
                    <span className="block text-xl font-extrabold text-slate-900 dark:text-zinc-50">{leaveStats.annual}/20</span>
                    <span className="text-[10px] uppercase font-bold text-slate-450 dark:text-zinc-500 tracking-wider">Annual Leaves</span>
                  </div>
                  <div className="bg-slate-50/50 dark:bg-zinc-900/40 border border-slate-100 dark:border-white/[0.04] rounded-xl p-3.5 text-center">
                    <span className="block text-xl font-extrabold text-slate-900 dark:text-zinc-50">{leaveStats.unpaid}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-450 dark:text-zinc-500 tracking-wider">Unpaid Days</span>
                  </div>
                </div>
              </div>

              {/* Leave Request Form */}
              <div className="card p-5">
                <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-150 uppercase tracking-wide border-b border-slate-100 dark:border-white/[0.04] pb-2 mb-4">
                  Request Time-Off
                </h3>
                <form onSubmit={handleRequestLeave} className="space-y-4">
                  <div>
                    <label className="label">Leave Type</label>
                    <select
                      className="input cursor-pointer font-medium"
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
                        className="input"
                        required
                        value={leaveStartDate}
                        onChange={(e) => setLeaveStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label">End Date</label>
                      <input
                        type="date"
                        className="input"
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
                  <button
                    type="submit"
                    disabled={createLeave.isPending}
                    className="btn-primary w-full py-2 flex items-center justify-center gap-1.5"
                  >
                    {createLeave.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Submit Leave Request
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: User lists & Admin Actions */}
            <div className="lg:col-span-2 space-y-6">
              {/* Admin Approval Queue */}
              {isAdminOrManager && pendingLeaves.length > 0 && (
                <div className="card p-5 border-amber-250/30 bg-amber-500/[0.01]">
                  <h3 className="font-bold text-sm text-amber-800 dark:text-amber-400 uppercase tracking-wide border-b border-amber-100 dark:border-amber-900/30 pb-2 mb-4 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4" />
                    Pending Leaves Approval Queue ({pendingLeaves.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingLeaves.map((leave) => {
                      const start = new Date(leave.startDate);
                      const end = new Date(leave.endDate);
                      const daysCount = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                      return (
                        <div
                          key={leave.id}
                          className="bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-white/[0.04] p-4 rounded-xl flex flex-col justify-between gap-3 shadow-xs relative"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-semibold text-sm text-slate-800 dark:text-zinc-100">{leave.user?.name}</h4>
                                <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">{leave.user?.email}</span>
                              </div>
                              <span className="badge uppercase tracking-wider text-[9px] px-1.5 bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 border-amber-250/30">
                                {leave.type}
                              </span>
                            </div>
                            
                            <div className="text-xs font-semibold text-slate-600 dark:text-zinc-400 mt-2 flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              {formatDate(leave.startDate)} — {formatDate(leave.endDate)}
                              <span className="text-slate-400 font-normal">({daysCount} {daysCount === 1 ? "day" : "days"})</span>
                            </div>

                            {leave.reason && (
                              <p className="text-xs text-slate-500 dark:text-zinc-500 italic mt-2 bg-slate-50 dark:bg-zinc-950/40 p-2 rounded border border-slate-100 dark:border-white/[0.02] break-words">
                                "{leave.reason}"
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 border-t border-slate-100 dark:border-white/[0.04] pt-3 mt-1">
                            <button
                              onClick={() => updateLeaveStatus.mutate({ id: leave.id, status: "approved" })}
                              disabled={updateLeaveStatus.isPending}
                              className="btn bg-emerald-600 hover:bg-emerald-700 text-white flex-1 py-1 text-xs font-semibold flex items-center justify-center gap-1"
                            >
                              <Check className="h-3 w-3" /> Approve
                            </button>
                            <button
                              onClick={() => updateLeaveStatus.mutate({ id: leave.id, status: "rejected" })}
                              disabled={updateLeaveStatus.isPending}
                              className="btn bg-rose-600 hover:bg-rose-700 text-white flex-1 py-1 text-xs font-semibold flex items-center justify-center gap-1"
                            >
                              <X className="h-3 w-3" /> Reject
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* My Requests (Non-Admin View or general summary) */}
              <div className="card p-5">
                <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-150 uppercase tracking-wide border-b border-slate-100 dark:border-white/[0.04] pb-2 mb-4">
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
                        const start = new Date(leave.startDate);
                        const end = new Date(leave.endDate);
                        const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                        
                        return (
                          <tr key={leave.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                            {isAdminOrManager && (
                              <td className="py-3 px-3 font-semibold text-slate-800 dark:text-zinc-200">
                                {leave.user?.name}
                              </td>
                            )}
                            <td className="py-3 px-3 capitalize font-medium text-slate-650 dark:text-zinc-400">
                              {leave.type}
                            </td>
                            <td className="py-3 px-3 font-medium text-slate-600 dark:text-zinc-400 whitespace-nowrap">
                              {formatDate(leave.startDate)} — {formatDate(leave.endDate)}
                              <span className="text-[10px] text-slate-450 dark:text-zinc-500 ml-1 font-semibold">({days}d)</span>
                            </td>
                            <td className="py-3 px-3 text-slate-500 dark:text-zinc-500 italic max-w-xs truncate" title={leave.reason || ""}>
                              {leave.reason || "—"}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`badge uppercase text-[9px] font-bold tracking-wider ${
                                  leave.status === "approved"
                                    ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-450 border-emerald-100"
                                    : leave.status === "rejected"
                                    ? "bg-rose-50 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400 border-rose-100"
                                    : "bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 border-amber-100"
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
                                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 font-semibold hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors"
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
                          <td colSpan={isAdminOrManager ? 6 : 5} className="py-8 text-center text-slate-400 dark:text-zinc-550 font-medium">
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
              <h3 className="font-bold text-base text-slate-800 dark:text-zinc-150">
                Public Holidays Calendar {new Date().getFullYear()}
              </h3>
              
              {isAdminOrManager && (
                <button
                  onClick={() => setHolidayModalOpen(true)}
                  className="btn-primary flex items-center gap-1.5 shadow-md shadow-brand-500/10 hover:translate-y-[-1px] active:translate-y-0 transition-all text-xs"
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
                    className="card-premium overflow-hidden p-5 flex flex-col justify-between border border-slate-200/60 dark:border-white/[0.06] bg-white dark:bg-zinc-900/60"
                  >
                    <div>
                      {/* Top Date Box */}
                      <div className="flex items-center gap-3">
                        <div className="bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 border border-brand-100 dark:border-brand-500/10 rounded-xl px-3 py-1.5 text-center shrink-0">
                          <span className="block text-lg font-black leading-none">{day}</span>
                          <span className="text-[10px] uppercase font-bold leading-none">{monthName}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-100 leading-tight">{holiday.name}</h4>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-550 font-semibold uppercase tracking-wider">{weekday}</span>
                        </div>
                      </div>

                      {/* Description */}
                      {holiday.description && (
                        <p className="text-xs text-slate-500 dark:text-zinc-500 mt-4 leading-relaxed bg-slate-50/50 dark:bg-zinc-950/30 p-2.5 rounded-lg border border-slate-100/50 dark:border-white/[0.02] break-words">
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
                          className="p-1 rounded text-slate-400 hover:text-red-500 dark:text-zinc-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
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
                <div className="col-span-full card py-16 text-center text-slate-400 dark:text-zinc-550 font-medium">
                  <Palmtree className="h-10 w-10 text-slate-300 dark:text-zinc-700 mx-auto mb-2" />
                  No holidays declared for this year.
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* HOLIDAY CREATE MODAL */}
      {holidayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 dark:bg-zinc-950/70 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setHolidayModalOpen(false)}
          />

          <div className="relative w-full max-w-md bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden transition-all duration-300 transform scale-100 z-10 p-6">
            <button
              onClick={() => setHolidayModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors z-20"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-bold text-base text-slate-900 dark:text-zinc-50 border-b border-slate-100 dark:border-white/[0.04] pb-2 mb-4">
              Add Public Holiday
            </h3>

            <form onSubmit={handleCreateHoliday} className="space-y-4">
              <div>
                <label className="label">Holiday Date</label>
                <input
                  type="date"
                  className="input"
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
                  className="btn-secondary text-xs px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createHoliday.isPending}
                  className="btn-primary text-xs px-4 flex items-center gap-1"
                >
                  {createHoliday.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Add Holiday
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
