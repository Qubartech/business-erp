import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { usersApi } from "@/services/api";
import { attendanceApi } from "@/services/featureApis";
import { useAuth } from "@/features/auth/AuthProvider";
import { formatDateTime } from "@/lib/format";
import { Calendar, ChevronLeft, ChevronRight, Clock, User, UserCheck, XCircle } from "lucide-react";
import type { User as UserType, AttendanceEntry } from "@/types";

type UserAttendanceRow = {
  user: UserType;
  entries: AttendanceEntry[];
};

export default function AttendancePage() {
  const { user: currentUser } = useAuth();
  const [viewMode, setViewMode] = useState<"daily" | "monthly">("daily");
  
  // Daily selector state
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toLocaleDateString("en-CA") // YYYY-MM-DD local
  );

  // Monthly selector state (YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toLocaleDateString("en-CA").slice(0, 7)
  );

  // Queries
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["users", "all"],
    queryFn: () => usersApi.list({ pageSize: 100 }),
  });

  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ["attendance", "list", selectedDate],
    queryFn: () => attendanceApi.list({ date: selectedDate, pageSize: 100 }),
    enabled: viewMode === "daily",
  });

  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ["attendance", "list-month", selectedMonth],
    queryFn: () => attendanceApi.list({ month: selectedMonth, pageSize: 1000 }),
    enabled: viewMode === "monthly",
  });

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

  // Days calculations for selected month
  const [year, month] = selectedMonth.split("-").map(Number);
  const totalDays = new Date(year, month, 0).getDate();
  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);

  // Process rows
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

  // Monthly stats calculations
  const getMonthlyStats = (userEntries: AttendanceEntry[]) => {
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
        if (!isFuture && !isWeekend) {
          absent++;
        }
      }
    }

    const hours = parseFloat((totalMins / 60).toFixed(1));
    return { present, absent, hours };
  };

  // Daily Table Columns
  const dailyCols: Column<UserAttendanceRow>[] = [
    {
      key: "user",
      header: "Team Member",
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1.5 rounded-lg text-slate-500">
            <User className="h-4 w-4" />
          </div>
          <div>
            <div className="font-semibold text-slate-800 text-sm">{r.user.name}</div>
            <div className="text-xs text-slate-400 font-medium">{r.user.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => {
        if (r.entries.length === 0) {
          return (
            <span className="badge bg-rose-50 text-rose-700 ring-rose-200/50 flex items-center gap-1 w-fit">
              <XCircle className="h-3.5 w-3.5" />
              Absent
            </span>
          );
        }
        const hasActive = r.entries.some((e) => !e.checkOut);
        if (hasActive) {
          return (
            <span className="badge bg-amber-50 text-amber-700 ring-amber-200/50 flex items-center gap-1 w-fit animate-pulse">
              <Clock className="h-3.5 w-3.5" />
              Checked In
            </span>
          );
        }
        return (
          <span className="badge bg-emerald-50 text-emerald-700 ring-emerald-200/50 flex items-center gap-1 w-fit">
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
          return <span className="text-slate-400 italic text-xs font-medium">Did not attend office on this day</span>;
        }
        return (
          <div className="space-y-1.5 py-0.5">
            {r.entries.map((entry, idx) => (
              <div key={entry.id} className="flex items-center gap-1.5 text-xs text-slate-600">
                {r.entries.length > 1 && (
                  <span className="font-bold text-slate-400 text-[10px] bg-slate-100 px-1 py-0.2 rounded font-mono">
                    #{idx + 1}
                  </span>
                )}
                <span className="font-semibold text-slate-700 font-mono">
                  {formatDateTime(entry.checkIn)}
                </span>
                <span className="text-slate-400">→</span>
                <span className="font-semibold text-slate-700 font-mono">
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
        if (r.entries.length === 0) return <span className="text-slate-400 font-medium">—</span>;
        return (
          <div className="space-y-1.5 py-0.5">
            {r.entries.map((entry) => {
              if (!entry.checkOut) return <span key={entry.id} className="text-xs text-amber-600 font-bold font-mono">Active</span>;
              const diffMs = new Date(entry.checkOut).getTime() - new Date(entry.checkIn).getTime();
              const mins = Math.max(0, Math.round(diffMs / 60000));
              const h = Math.floor(mins / 60);
              const m = mins % 60;
              return (
                <div key={entry.id} className="text-xs font-bold font-mono text-slate-600 bg-slate-50 border border-slate-150 px-1.5 py-0.5 rounded w-fit">
                  {h > 0 ? `${h}h ` : ""}{m}m
                </div>
              );
            })}
          </div>
        );
      },
    },
  ];

  // Monthly Table Columns
  const monthlyCols: Column<UserAttendanceRow>[] = [
    {
      key: "user",
      header: "Team Member",
      render: (r) => (
        <div className="flex items-center gap-2 pr-2">
          <div className="bg-slate-100 p-1.5 rounded-lg text-slate-500 shrink-0">
            <User className="h-4 w-4" />
          </div>
          <div>
            <div className="font-semibold text-slate-800 text-sm whitespace-nowrap">{r.user.name}</div>
            <div className="text-[10px] text-slate-400 font-medium">{r.user.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "summary",
      header: "Monthly Stats",
      render: (r) => {
        const stats = getMonthlyStats(r.entries);
        return (
          <div className="flex flex-col gap-1 text-[11px]">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                {stats.present}d present
              </span>
              <span className="font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded">
                {stats.absent}d absent
              </span>
            </div>
            <span className="font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded w-fit font-mono text-[10px]">
              {stats.hours} hrs worked
            </span>
          </div>
        );
      },
    },
    ...daysArray.map((dayNum) => ({
      key: `day-${dayNum}`,
      header: `${dayNum}`,
      headerClassName: "text-center min-w-[55px] text-[10px] font-bold p-1 bg-slate-50/50",
      className: "text-center font-mono min-w-[55px] border-l border-slate-100/80 p-1 text-[11px]",
      render: (r: UserAttendanceRow) => {
        const dayEntries = r.entries.filter((entry) => {
          const entryDate = new Date(entry.checkIn);
          return entryDate.getDate() === dayNum;
        });

        const dayOfWeek = new Date(year, month - 1, dayNum).getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        const targetDate = new Date(year, month - 1, dayNum);
        const todayAtMidnight = new Date();
        todayAtMidnight.setHours(0, 0, 0, 0);
        const isFuture = targetDate > todayAtMidnight;

        if (dayEntries.length === 0) {
          if (isFuture) {
            return <span className="text-slate-200">—</span>;
          }
          if (isWeekend) {
            return <span className="text-slate-300 font-semibold text-[9px]">W</span>;
          }
          return (
            <span className="text-rose-400 font-bold text-xs" title="Absent / Did not attend office">
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
        const formattedTime = hrs > 0 ? `${hrs}h${mins > 0 ? ` ${mins}m` : ""}` : `${mins}m`;

        if (hasActive) {
          return (
            <span
              className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1 rounded animate-pulse"
              title="Active check-in currently running"
            >
              Active
            </span>
          );
        }

        return (
          <span
            className="text-[10px] font-semibold text-emerald-700 bg-emerald-50/70 border border-emerald-100 px-1 py-0.5 rounded"
            title={dayEntries.map((e, idx) => `Check-in #${idx+1}: ${new Date(e.checkIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${e.checkOut ? new Date(e.checkOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Active'}`).join('\n')}
          >
            {formattedTime}
          </span>
        );
      },
    })),
  ];

  const isLoading = usersLoading || (viewMode === "daily" ? attendanceLoading : monthlyLoading);

  return (
    <>
      <PageHeader
        title="Attendance Logs"
        description="Daily team member office check-in and check-out logs"
        actions={
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200/60 shadow-inner">
            <button
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                viewMode === "daily"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              onClick={() => setViewMode("daily")}
            >
              Daily View
            </button>
            <button
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                viewMode === "monthly"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              onClick={() => setViewMode("monthly")}
            >
              Monthly View
            </button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Selector bars based on mode */}
        {viewMode === "daily" ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-xs border border-slate-200/80">
            <div className="flex items-center gap-2">
              <button className="btn-secondary !p-2" onClick={() => shiftDay(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="relative">
                <input
                  type="date"
                  className="input !py-1.5 !pl-8 !pr-3 font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 cursor-pointer rounded-lg border-slate-200"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
              <button className="btn-secondary !p-2" onClick={() => shiftDay(1)}>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="text-sm text-slate-500 font-medium">
              Showing logs for <span className="font-bold text-slate-700">{selectedDate}</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-xs border border-slate-200/80">
            <div className="flex items-center gap-2">
              <button className="btn-secondary !p-2" onClick={() => shiftMonth(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="relative">
                <input
                  type="month"
                  className="input !py-1.5 !pl-8 !pr-3 font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 cursor-pointer rounded-lg border-slate-200"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                />
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
              <button className="btn-secondary !p-2" onClick={() => shiftMonth(1)}>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="text-sm text-slate-500 font-medium">
              Showing monthly grid for <span className="font-bold text-slate-700">{selectedMonth}</span>
            </div>
          </div>
        )}

        <div className={viewMode === "monthly" ? "overflow-x-auto border border-slate-200/60 rounded-xl bg-white shadow-xs max-w-full" : ""}>
          <DataTable
            rows={rows}
            loading={isLoading}
            columns={viewMode === "daily" ? dailyCols : monthlyCols}
            rowKey={(r) => r.user.id}
          />
        </div>
      </div>
    </>
  );
}
