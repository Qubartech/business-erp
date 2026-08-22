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
  shortName?: string | null;
  tagline?: string | null;
  badge?: string | null;
  isNonProfit?: boolean;
  category?: string | null;
  description?: string | null;
  features?: string | null;
  icon?: string | null;
  color?: string | null;
  coverGradient?: string | null;
  tags?: string | null;
  image?: string | null;
  link?: string | null;
  githubUrl?: string | null;
  techStack?: string | null;
  mission?: string | null;
  stats?: string | null;
  detailsContent?: string | null;
  status?: string;
  privacyPolicy?: string | null;
  isActive?: boolean;
  hasProjectManagement?: boolean;
  hasDetails?: boolean;
  hasPrivacy?: boolean;
};

export const qubartechTeamApi = {
  list: () => unwrap<QubartechTeamMember[]>(api.get<ApiEnvelope<QubartechTeamMember[]>>("/qubartech/team")),
  create: (data: QubartechTeamMemberInput) => unwrap<QubartechTeamMember>(api.post<ApiEnvelope<QubartechTeamMember>>("/qubartech/team", data)),
  update: (id: string, data: Partial<QubartechTeamMemberInput>) => unwrap<QubartechTeamMember>(api.patch<ApiEnvelope<QubartechTeamMember>>(`/qubartech/team/${id}`, data)),
  remove: (id: string) => unwrap<{ id: string }>(api.delete<ApiEnvelope<{ id: string }>>(`/qubartech/team/${id}`)),
  uploadImage: (file: File, oldUrl?: string | null) => {
    const fd = new FormData();
    fd.append("file", file);
    if (oldUrl) fd.append("oldUrl", oldUrl);
    return unwrap<{ url: string }>(api.post<ApiEnvelope<{ url: string }>>("/qubartech/team/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    }));
  },
  reorder: (orders: { id: string; order: number }[]) =>
    unwrap<{ success: boolean }>(api.post<ApiEnvelope<{ success: boolean }>>("/qubartech/team/reorder", { orders })),
};

export const qubartechProductsApi = {
  list: () => unwrap<QubartechProduct[]>(api.get<ApiEnvelope<QubartechProduct[]>>("/qubartech/products")),
  getByIdOrSlug: (idOrSlug: string) => unwrap<QubartechProduct>(api.get<ApiEnvelope<QubartechProduct>>(`/qubartech/products/${idOrSlug}`)),
  create: (data: QubartechProductInput) => unwrap<QubartechProduct>(api.post<ApiEnvelope<QubartechProduct>>("/qubartech/products", data)),
  update: (id: string, data: Partial<QubartechProductInput>) => unwrap<QubartechProduct>(api.patch<ApiEnvelope<QubartechProduct>>(`/qubartech/products/${id}`, data)),
  remove: (id: string) => unwrap<{ id: string }>(api.delete<ApiEnvelope<{ id: string }>>(`/qubartech/products/${id}`)),
};
