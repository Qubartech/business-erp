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
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toLocaleDateString("en-CA") // YYYY-MM-DD local
  );

  // Queries
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["users", "all"],
    queryFn: () => usersApi.list({ pageSize: 100 }),
  });

  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ["attendance", "list", selectedDate],
    queryFn: () => attendanceApi.list({ date: selectedDate, pageSize: 100 }),
  });

  const shiftDay = (amount: number) => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + amount);
    setSelectedDate(d.toLocaleDateString("en-CA"));
  };

  // Process rows
  const displayUsers = (usersData?.items ?? []).filter((u) => {
    // If regular member, only show themselves
    if (currentUser?.role === "member") {
      return u.id === currentUser.id;
    }
    // Admin/Manager can see all active users (or users with entries even if inactive)
    const hasEntries = (attendanceData?.items ?? []).some((e) => e.userId === u.id);
    return u.isActive || hasEntries;
  });

  const rows: UserAttendanceRow[] = displayUsers.map((u) => {
    const entries = (attendanceData?.items ?? []).filter(
      (e) => e.userId === u.id || e.user?.id === u.id
    );
    // Sort entries chronologically (earliest check-in first)
    entries.sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());
    return {
      user: u,
      entries,
    };
  });

  const cols: Column<UserAttendanceRow>[] = [
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
                  {h > 0 ? `${h}h ` : ""}${m}m
                </div>
              );
            })}
          </div>
        );
      },
    },
  ];

  const isLoading = usersLoading || attendanceLoading;

  return (
    <>
      <PageHeader
        title="Attendance Logs"
        description="Daily team member office check-in and check-out logs"
      />

      <div className="space-y-6">
        {/* Date Picker bar */}
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

        <DataTable
          rows={rows}
          loading={isLoading}
          columns={cols}
          rowKey={(r) => r.user.id}
        />
      </div>
    </>
  );
}
