import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, tokens, unwrap, type ApiEnvelope } from "@/lib/api";
import type { User } from "@/types";

type AuthState = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    const stored = tokens.loadRefreshFromStorage();
    if (!stored) { setUser(null); setLoading(false); return; }
    try {
      const refreshRes = await api.post<ApiEnvelope<{ accessToken: string; refreshToken: string }>>("/auth/refresh", { refreshToken: stored });
      if (!refreshRes.data.success) throw new Error("refresh failed");
      tokens.set(refreshRes.data.data.accessToken, refreshRes.data.data.refreshToken);
      const me = await unwrap(api.get<ApiEnvelope<User>>("/auth/me"));
      setUser(me);
    } catch {
      tokens.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void bootstrap(); }, [bootstrap]);
  useEffect(() => { tokens.onCleared(() => setUser(null)); }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<ApiEnvelope<{ accessToken: string; refreshToken: string; user: User }>>("/auth/login", { email, password });
    if (!res.data.success) throw new Error(res.data.message);
    tokens.set(res.data.data.accessToken, res.data.data.refreshToken);
    setUser(res.data.data.user);
  }, []);

  const logout = useCallback(async () => {
    const rt = tokens.refresh;
    try { if (rt) await api.post("/auth/logout", { refreshToken: rt }); } catch { /* ignore */ }
    tokens.clear();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
