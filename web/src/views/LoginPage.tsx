"use client";

import React, { useState, useEffect, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/lib/toast";
import { useAuth } from "@/features/auth/AuthProvider";
import { Loader2, Mail, Lock, Eye, EyeOff, Building2 } from "lucide-react";

export default function LoginPage() {
  const { user, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [user, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email.trim(), password);
      const to = searchParams?.get("from") ?? "/";
      router.replace(to);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  if (user) return null;

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950 overflow-hidden p-4 transition-colors duration-200">
      {/* Dynamic Animated Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-200/40 dark:bg-brand-900/15 blur-[120px] animate-float-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-200/30 dark:bg-purple-900/10 blur-[120px] animate-float-delay" />
      <div className="absolute top-[30%] right-[10%] w-[35%] h-[35%] rounded-full bg-blue-100/40 dark:bg-blue-900/15 blur-[100px] animate-float-slow" />

      {/* Main Glassmorphic Container */}
      <div className="w-full max-w-md glass-panel rounded-2xl p-8 shadow-2xl relative z-10 text-slate-800 dark:text-slate-100">

        {/* Header Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-xl shadow-brand-500/20">
            <Building2 className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Welcome back</h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-zinc-400">Sign in to your Qubartech ERP account</p>
        </div>

        {/* Login Form */}
        <form onSubmit={onSubmit} className="space-y-5">
          {/* Email input field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Mail className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
              </div>
              <input
                className="block w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white/80 dark:bg-zinc-900/40 dark:backdrop-blur-sm pl-11 pr-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-zinc-550 focus:border-brand-500 dark:focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200"
                placeholder="email@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password input field */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Password</label>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); toast.info("Contact administrator to reset password."); }}
                className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-350 transition-colors duration-200 font-medium"
              >
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Lock className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
              </div>
              <input
                className="block w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white/80 dark:bg-zinc-900/40 dark:backdrop-blur-sm pl-11 pr-10 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-zinc-550 focus:border-brand-500 dark:focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200"
                placeholder="••••••••"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-350 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Remember me toggle */}
          <div className="flex items-center justify-between py-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                className="rounded border-slate-300 dark:border-white/[0.08] bg-white/80 dark:bg-zinc-900 text-brand-600 focus:ring-brand-500/20 focus:ring-offset-2 h-4 w-4"
              />
              <span className="text-xs text-slate-600 dark:text-zinc-400">Keep me logged in</span>
            </label>
          </div>

          {/* Submit button */}
          <button
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:from-brand-500 hover:to-indigo-500 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200 shadow-lg shadow-brand-600/10 disabled:opacity-50 disabled:pointer-events-none"
            disabled={busy}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin text-white" />}
            {busy ? "Signing in…" : "Sign in to Dashboard"}
          </button>
        </form>

      </div>
    </div>
  );
}
