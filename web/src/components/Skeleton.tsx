import { clsx } from "clsx";
import React from "react";
import { Users, GitCommit, Calendar } from "lucide-react";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "animate-pulse rounded-md bg-slate-200 dark:bg-zinc-800/80",
        className
      )}
    />
  );
}

export function SkeletonCircle({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "animate-pulse rounded-full bg-slate-200 dark:bg-zinc-800/80",
        className
      )}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="card-premium p-6 flex items-center justify-between border border-slate-200/50 dark:border-slate-800/60 bg-gradient-to-br from-slate-500/[0.01] to-indigo-500/[0.01]">
      <div className="space-y-3 flex-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-16" />
      </div>
      <SkeletonCircle className="h-12 w-12 rounded-2xl shrink-0" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="animate-fade-in">
      {/* Welcome Greeting Banner Skeleton */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
              Welcome back,
            </h1>
            <Skeleton className="h-8 w-36 md:h-9" />
          </div>
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center gap-2.5 bg-white dark:bg-zinc-900/50 dark:backdrop-blur-md border border-slate-200/60 dark:border-white/[0.06] px-4 py-2.5 rounded-xl shadow-sm w-fit">
          <Calendar className="h-4 w-4 text-slate-350 dark:text-slate-600" />
          <Skeleton className="h-3.5 w-32" />
        </div>
      </div>

      {/* Metric Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Main Sections Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Office & Projects */}
        <div className="lg:col-span-2 space-y-6">
          {/* Who's in the Office Skeleton */}
          <div className="card-premium p-6 flex flex-col h-fit">
            <div className="flex items-center justify-between mb-5 border-b border-slate-100 dark:border-white/[0.06] pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-405 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-350 dark:text-slate-600" />
                Who's in the Office
              </h3>
              <Skeleton className="h-6 w-32 rounded-xl" />
            </div>
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/85">
                  <div className="flex items-center gap-2.5 flex-1">
                    <SkeletonCircle className="h-8 w-8 rounded-xl shrink-0" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-2.5 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-14 rounded-lg shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Projects Status Distribution Skeleton */}
          <div className="card-premium p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-405 mb-5">Projects Status Distribution</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/20 flex flex-col items-center justify-center space-y-3">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-4 w-16 rounded-lg" />
                </div>
              ))}
            </div>
          </div>

          {/* Time & Task Completion Overview Skeleton */}
          <div className="card-premium p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-405">Total Hours Tracked</h3>
              <Skeleton className="h-3 w-48" />
              <div className="flex items-baseline gap-2 mt-3">
                <Skeleton className="h-10 w-16" />
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-10 w-12" />
                <Skeleton className="h-3 w-10" />
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-405">Task Completion Rate</h3>
              <Skeleton className="h-3 w-48" />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-12 rounded-lg" />
                </div>
                <Skeleton className="h-2.5 w-full rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Timeline Skeleton */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card-premium p-6 flex flex-col h-fit">
            <div className="flex items-center justify-between mb-5 border-b border-slate-100 dark:border-white/[0.06] pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-405 flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-slate-350 dark:text-slate-600" />
                Latest Commits
              </h3>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="relative border-l border-slate-100 dark:border-white/[0.06] pl-4 ml-2.5 space-y-6 py-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="relative space-y-2">
                  <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-zinc-800/80 border-2 border-white dark:border-zinc-900" />
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-2.5 w-14" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex gap-2 pt-1">
                    <Skeleton className="h-4 w-16 rounded" />
                    <Skeleton className="h-4 w-20 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
