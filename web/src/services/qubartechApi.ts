import { api, unwrap, type ApiEnvelope } from "@/lib/api";
import type { QubartechTeamMember, QubartechProduct } from "@/types";

export type QubartechTeamMemberInput = {
  name: string;
  position: string;
  image?: string | null;
  facebook?: string | null;
  linkedin?: string | null;
  github?: string | null;
  portfolio?: string | null;
  x?: string | null;
  order?: number;
  isActive?: boolean;
};

export type QubartechProductInput = {
  name: string;
  slug: string;
  category?: string | null;
  description?: string | null;
  features?: string | null;
  icon?: string | null;
  color?: string | null;
  tags?: string | null;
  image?: string | null;
  link?: string | null;
  status?: string;
  privacyPolicy?: string | null;
  isActive?: boolean;
};

export const qubartechTeamApi = {
  list: () => unwrap<QubartechTeamMember[]>(api.get<ApiEnvelope<QubartechTeamMember[]>>("/qubartech/team")),
  create: (data: QubartechTeamMemberInput) => unwrap<QubartechTeamMember>(api.post<ApiEnvelope<QubartechTeamMember>>("/qubartech/team", data)),
  update: (id: string, data: Partial<QubartechTeamMemberInput>) => unwrap<QubartechTeamMember>(api.patch<ApiEnvelope<QubartechTeamMember>>(`/qubartech/team/${id}`, data)),
  remove: (id: string) => unwrap<{ id: string }>(api.delete<ApiEnvelope<{ id: string }>>(`/qubartech/team/${id}`)),
};

export const qubartechProductsApi = {
  list: () => unwrap<QubartechProduct[]>(api.get<ApiEnvelope<QubartechProduct[]>>("/qubartech/products")),
  create: (data: QubartechProductInput) => unwrap<QubartechProduct>(api.post<ApiEnvelope<QubartechProduct>>("/qubartech/products", data)),
  update: (id: string, data: Partial<QubartechProductInput>) => unwrap<QubartechProduct>(api.patch<ApiEnvelope<QubartechProduct>>(`/qubartech/products/${id}`, data)),
  remove: (id: string) => unwrap<{ id: string }>(api.delete<ApiEnvelope<{ id: string }>>(`/qubartech/products/${id}`)),
};
