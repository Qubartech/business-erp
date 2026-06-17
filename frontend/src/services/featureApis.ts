import { api, unwrap, type ApiEnvelope } from "@/lib/api";
import type { Commit, Document, Note, Paged, Setting, Task, TaskPriority, TaskStatus, TimeEntry, AttendanceEntry } from "@/types";

export type ListTasksQuery = {
  projectId?: string; status?: TaskStatus; priority?: TaskPriority;
  assignedTo?: string; search?: string;
  page?: number; pageSize?: number;
};
export type TaskInput = {
  projectId: string; title: string; description?: string;
  status: TaskStatus; priority: TaskPriority;
  assignedTo?: string | null; dueDate?: string | null;
};

export const tasksApi = {
  list: (q: ListTasksQuery) => unwrap<Paged<Task>>(api.get<ApiEnvelope<Paged<Task>>>("/tasks", { params: q })),
  get: (id: string) => unwrap<Task>(api.get<ApiEnvelope<Task>>(`/tasks/${id}`)),
  create: (data: TaskInput) => unwrap<Task>(api.post<ApiEnvelope<Task>>("/tasks", data)),
  update: (id: string, data: Partial<TaskInput>) => unwrap<Task>(api.patch<ApiEnvelope<Task>>(`/tasks/${id}`, data)),
  remove: (id: string) => unwrap<{ id: string }>(api.delete<ApiEnvelope<{ id: string }>>(`/tasks/${id}`)),
};

export const notesApi = {
  list: (q: { search?: string; page?: number; pageSize?: number }) =>
    unwrap<Paged<Note>>(api.get<ApiEnvelope<Paged<Note>>>("/notes", { params: q })),
  get: (id: string) => unwrap<Note>(api.get<ApiEnvelope<Note>>(`/notes/${id}`)),
  create: (data: { title: string; content: string }) => unwrap<Note>(api.post<ApiEnvelope<Note>>("/notes", data)),
  update: (id: string, data: { title?: string; content?: string }) => unwrap<Note>(api.patch<ApiEnvelope<Note>>(`/notes/${id}`, data)),
  remove: (id: string) => unwrap<{ id: string }>(api.delete<ApiEnvelope<{ id: string }>>(`/notes/${id}`)),
};

export const timeApi = {
  list: (q: { taskId?: string; userId?: string; page?: number; pageSize?: number }) =>
    unwrap<Paged<TimeEntry>>(api.get<ApiEnvelope<Paged<TimeEntry>>>("/time-entries", { params: q })),
  current: () => unwrap<TimeEntry | null>(api.get<ApiEnvelope<TimeEntry | null>>("/time-entries/current")),
  start: (taskId: string) => unwrap<TimeEntry>(api.post<ApiEnvelope<TimeEntry>>("/time-entries/start", { taskId })),
  stop: (entryId: string, endTime?: string) => unwrap<TimeEntry>(api.post<ApiEnvelope<TimeEntry>>("/time-entries/stop", { entryId, endTime })),
  manual: (data: { taskId: string; startTime: string; endTime: string }) =>
    unwrap<TimeEntry>(api.post<ApiEnvelope<TimeEntry>>("/time-entries/manual", data)),
  update: (id: string, data: { startTime: string; endTime: string; taskId?: string }) =>
    unwrap<TimeEntry>(api.patch<ApiEnvelope<TimeEntry>>(`/time-entries/${id}`, data)),
  remove: (id: string) => unwrap<{ id: string }>(api.delete<ApiEnvelope<{ id: string }>>(`/time-entries/${id}`)),
};

export const documentsApi = {
  list: (q: { search?: string; projectId?: string; category?: string; page?: number; pageSize?: number }) =>
    unwrap<Paged<Document>>(api.get<ApiEnvelope<Paged<Document>>>("/documents", { params: q })),
  upload: (formData: FormData) => unwrap<Document>(api.post<ApiEnvelope<Document>>("/documents", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })),
  download: (id: string) => unwrap<{ url: string; document: Document }>(
    api.get<ApiEnvelope<{ url: string; document: Document }>>(`/documents/${id}/download`),
  ),
  remove: (id: string) => unwrap<{ id: string }>(api.delete<ApiEnvelope<{ id: string }>>(`/documents/${id}`)),
};

export const settingsApi = {
  list: () => unwrap<{ items: Setting[] }>(api.get<ApiEnvelope<{ items: Setting[] }>>("/settings")),
  upsert: (data: { key: string; value: string }) => unwrap<Setting>(api.put<ApiEnvelope<Setting>>("/settings", data)),
  remove: (key: string) => unwrap<{ key: string }>(api.delete<ApiEnvelope<{ key: string }>>(`/settings/${encodeURIComponent(key)}`)),
};

export type DashboardSummary = {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  teamMembers: number;
  projectsByStatus: Record<string, number>;
  totalMinutes: number;
  latestCommits: Commit[];
  activeAttendance: AttendanceEntry[];
};

export const dashboardApi = {
  summary: () => unwrap<DashboardSummary>(api.get<ApiEnvelope<DashboardSummary>>("/dashboard/summary")),
};

export const attendanceApi = {
  status: () =>
    unwrap<{ status: "checked-in" | "checked-out" | "none"; activeEntry: AttendanceEntry | null }>(
      api.get<ApiEnvelope<{ status: "checked-in" | "checked-out" | "none"; activeEntry: AttendanceEntry | null }>>("/attendance/today")
    ),
  checkIn: () => unwrap<AttendanceEntry>(api.post<ApiEnvelope<AttendanceEntry>>("/attendance/check-in")),
  checkOut: () => unwrap<AttendanceEntry>(api.post<ApiEnvelope<AttendanceEntry>>("/attendance/check-out")),
  list: (q?: { userId?: string; date?: string; month?: string; page?: number; pageSize?: number }) =>
    unwrap<Paged<AttendanceEntry>>(api.get<ApiEnvelope<Paged<AttendanceEntry>>>("/attendance", { params: q })),
};

export const personalApiKeyApi = {
  get: () => unwrap<{ apiKey: string | null }>(api.get<ApiEnvelope<{ apiKey: string | null }>>("/auth/me/api-key")),
  generate: () => unwrap<{ apiKey: string }>(api.post<ApiEnvelope<{ apiKey: string }>>("/auth/me/api-key")),
  revoke: () => unwrap<null>(api.delete<ApiEnvelope<null>>("/auth/me/api-key")),
};

