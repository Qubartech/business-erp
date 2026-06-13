import { api, unwrap, type ApiEnvelope } from "@/lib/api";
import type { Paged, Project, ProjectStatus, User } from "@/types";

export type ListProjectsQuery = { search?: string; status?: ProjectStatus; page?: number; pageSize?: number };
export type ProjectInput = {
  name: string; description?: string; status: ProjectStatus;
  startDate?: string; endDate?: string; memberIds: string[];
};

export const projectsApi = {
  list: (q: ListProjectsQuery) => unwrap<Paged<Project>>(api.get<ApiEnvelope<Paged<Project>>>("/projects", { params: q })),
  get: (id: string) => unwrap<Project>(api.get<ApiEnvelope<Project>>(`/projects/${id}`)),
  create: (data: ProjectInput) => unwrap<Project>(api.post<ApiEnvelope<Project>>("/projects", data)),
  update: (id: string, data: Partial<ProjectInput>) => unwrap<Project>(api.patch<ApiEnvelope<Project>>(`/projects/${id}`, data)),
  archive: (id: string) => unwrap<Project>(api.post<ApiEnvelope<Project>>(`/projects/${id}/archive`)),
};

export const usersApi = {
  list: (q: { search?: string; page?: number; pageSize?: number }) =>
    unwrap<Paged<User>>(api.get<ApiEnvelope<Paged<User>>>("/users", { params: q })),
  get: (id: string) => unwrap<User>(api.get<ApiEnvelope<User>>(`/users/${id}`)),
  create: (data: { name: string; email: string; password: string; role: User["role"]; isActive: boolean }) =>
    unwrap<User>(api.post<ApiEnvelope<User>>("/users", data)),
  update: (id: string, data: Partial<{ name: string; email: string; password: string; role: User["role"]; isActive: boolean }>) =>
    unwrap<User>(api.patch<ApiEnvelope<User>>(`/users/${id}`, data)),
  setActive: (id: string, isActive: boolean) =>
    unwrap<User>(api.post<ApiEnvelope<User>>(`/users/${id}/active`, { isActive })),
};
