import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";

export type ApiEnvelope<T> =
  | { success: true; message: string; data: T }
  | { success: false; message: string; errors?: Record<string, string[]> };

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "/api";

export const api = axios.create({ baseURL: API_BASE });

let accessToken: string | null = null;
let refreshToken: string | null = null;
let onAuthCleared: (() => void) | null = null;

export const tokens = {
  get access() { return accessToken; },
  get refresh() { return refreshToken; },
  set(access: string | null, refresh: string | null) {
    accessToken = access;
    refreshToken = refresh;
    if (refresh) localStorage.setItem("erp.refresh", refresh);
    else localStorage.removeItem("erp.refresh");
  },
  loadRefreshFromStorage() {
    refreshToken = localStorage.getItem("erp.refresh");
    return refreshToken;
  },
  onCleared(cb: () => void) { onAuthCleared = cb; },
  clear() {
    accessToken = null;
    refreshToken = null;
    localStorage.removeItem("erp.refresh");
    onAuthCleared?.();
  },
};

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) config.headers.set("Authorization", `Bearer ${accessToken}`);
  return config;
});

let refreshing: Promise<string | null> | null = null;
async function tryRefresh(): Promise<string | null> {
  if (!refreshToken) return null;
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const res = await axios.post<ApiEnvelope<{ accessToken: string; refreshToken: string }>>(
        `${API_BASE}/auth/refresh`, { refreshToken },
      );
      if (res.data.success) {
        tokens.set(res.data.data.accessToken, res.data.data.refreshToken);
        return res.data.data.accessToken;
      }
      tokens.clear();
      return null;
    } catch {
      tokens.clear();
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

api.interceptors.response.use(
  (r) => r,
  async (err: AxiosError<ApiEnvelope<unknown>>) => {
    const original = err.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (err.response?.status === 401 && original && !original._retry && !original.url?.includes("/auth/")) {
      original._retry = true;
      const newToken = await tryRefresh();
      if (newToken) {
        original.headers.set("Authorization", `Bearer ${newToken}`);
        return api.request(original);
      }
    }
    const data = err.response?.data;
    if (data && data.success === false && err.response?.status !== 401) {
      if (data.errors && Object.keys(data.errors).length > 0) {
        const detailMsg = Object.entries(data.errors as Record<string, string[]>)
          .map(([field, msgs]) => `${field}: ${msgs.join(", ")}`)
          .join(" | ");
        toast.error(`${data.message}: ${detailMsg}`);
      } else {
        toast.error(data.message ?? "Request failed");
      }
    }
    return Promise.reject(err);
  },
);

export async function unwrap<T>(p: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  try {
    const res = await p;
    if (!res.data.success) {
      const data = res.data;
      if (data.errors && Object.keys(data.errors).length > 0) {
        const detailMsg = Object.entries(data.errors as Record<string, string[]>)
          .map(([field, msgs]) => `${field}: ${msgs.join(", ")}`)
          .join(" | ");
        throw new Error(`${data.message}: ${detailMsg}`);
      }
      throw new Error(data.message);
    }
    return res.data.data;
  } catch (err: any) {
    if (err.response?.data) {
      const data = err.response.data;
      if (data.success === false) {
        if (data.errors && Object.keys(data.errors).length > 0) {
          const detailMsg = Object.entries(data.errors as Record<string, string[]>)
            .map(([field, msgs]) => `${field}: ${msgs.join(", ")}`)
            .join(" | ");
          throw new Error(`${data.message}: ${detailMsg}`);
        }
        if (data.message) {
          throw new Error(data.message);
        }
      }
    }
    throw err;
  }
}
