import React from "react";

export function ProjectsListSkeleton() {
  return (
    <div className="space-y-6 w-full">
      {/* Page Header Skeleton */}
      <div className="flex items-center justify-between pb-5 border-b border-slate-200/50 dark:border-white/[0.04]">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-slate-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
          <div className="h-4 w-72 bg-slate-200 dark:bg-zinc-850 rounded animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-slate-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
      </div>

      {/* Metrics Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-white/[0.06] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.15)] flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-slate-200 dark:bg-zinc-850 animate-pulse shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-20 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" />
              <div className="h-6 w-12 bg-slate-200 dark:bg-zinc-750 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filters Bar Skeleton */}
      <div className="rounded-2xl p-4 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-white/[0.06] shadow-xs space-y-4">
        <div className="h-4 w-36 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-slate-100 dark:bg-zinc-850 border border-slate-200/50 dark:border-white/[0.04] animate-pulse" />
          ))}
        </div>
      </div>

      {/* View Toggle Bar Skeleton */}
      <div className="flex items-center justify-between gap-3">
        <div className="h-9 w-48 bg-slate-200 dark:bg-zinc-855 rounded-lg animate-pulse" />
        <div className="h-6 w-24 bg-slate-100 dark:bg-zinc-855 rounded-md animate-pulse" />
      </div>

      {/* Board View Columns Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, colIndex) => (
          <div key={colIndex} className="rounded-2xl p-4 bg-slate-50/40 dark:bg-zinc-900/30 border border-slate-200/60 dark:border-white/[0.04] min-h-[400px] space-y-4">
            {/* Column Header Skeleton */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/50 dark:border-white/[0.04]">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-slate-350 dark:bg-zinc-750 animate-pulse" />
                <div className="h-4 w-32 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" />
              </div>
              <div className="h-5 w-8 bg-slate-200 dark:bg-zinc-805 rounded-full animate-pulse" />
            </div>
            
            {/* Column Cards Skeleton */}
            {[...Array(2)].map((_, cardIndex) => (
              <div key={cardIndex} className="relative rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-white/[0.06] p-4 space-y-3 shadow-xs">
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-slate-200 dark:bg-zinc-800 animate-pulse" />
                <div className="flex items-start justify-between gap-4">
                  <div className="h-4 w-40 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" />
                  <div className="h-5 w-14 bg-slate-150 dark:bg-zinc-850 rounded-full animate-pulse" />
                </div>
                <div className="space-y-1.5 pt-1">
                  <div className="h-3 w-full bg-slate-150 dark:bg-zinc-850 rounded animate-pulse" />
                  <div className="h-3 w-5/6 bg-slate-150 dark:bg-zinc-850 rounded animate-pulse" />
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/[0.06]">
                  <div className="h-5 w-16 bg-slate-150 dark:bg-zinc-850 rounded-full animate-pulse" />
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-10 bg-slate-150 dark:bg-zinc-850 rounded animate-pulse" />
                    <div className="h-4 w-10 bg-slate-150 dark:bg-zinc-850 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProjectDetailSkeleton() {
  return (
    <div className="space-y-6 w-full">
      {/* Page Header Skeleton */}
      <div className="flex items-center justify-between pb-5 border-b border-slate-200/50 dark:border-white/[0.04]">
        <div className="space-y-2 flex-1 mr-4">
          <div className="h-8 w-64 bg-slate-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
          <div className="h-4 w-full max-w-xl bg-slate-200 dark:bg-zinc-850 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 w-24 bg-slate-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>

      {/* Info Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-white/[0.06] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.15)] flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-slate-200 dark:bg-zinc-850 animate-pulse shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-16 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" />
              <div className="h-5 w-24 bg-slate-200 dark:bg-zinc-750 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Tasks Header Section Skeleton */}
      <div className="flex items-center justify-between mt-6">
        <div className="h-6 w-20 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" />
        <div className="h-10 w-24 bg-slate-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
      </div>

      {/* View Toggle Bar Skeleton */}
      <div className="flex items-center justify-between gap-3">
        <div className="h-9 w-48 bg-slate-200 dark:bg-zinc-850 rounded-lg animate-pulse" />
        <div className="h-6 w-24 bg-slate-100 dark:bg-zinc-850 rounded-md animate-pulse" />
      </div>

      {/* Kanban Board Columns Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, colIndex) => (
          <div key={colIndex} className="rounded-2xl p-4 bg-slate-50/40 dark:bg-zinc-900/30 border border-slate-200/60 dark:border-white/[0.04] min-h-[400px] space-y-4">
            {/* Column Header Skeleton */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/50 dark:border-white/[0.04]">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-slate-350 dark:bg-zinc-750 animate-pulse" />
                <div className="h-4 w-16 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" />
              </div>
              <div className="h-5 w-8 bg-slate-200 dark:bg-zinc-805 rounded-full animate-pulse" />
            </div>

            {/* Column Task Cards Skeleton */}
            {[...Array(colIndex % 2 === 0 ? 2 : 1)].map((_, cardIndex) => (
              <div key={cardIndex} className="relative rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-white/[0.06] p-4 space-y-3 shadow-xs">
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-slate-200 dark:bg-zinc-800 animate-pulse" />
                <div className="h-3 w-16 bg-slate-200 dark:bg-zinc-850 rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" />
                <div className="flex gap-2">
                  <div className="h-5 w-12 bg-slate-150 dark:bg-zinc-850 rounded-full animate-pulse" />
                  <div className="h-5 w-16 bg-slate-150 dark:bg-zinc-850 rounded-full animate-pulse" />
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/[0.06]">
                  <div className="flex items-center gap-1.5">
                    <div className="h-5 w-5 rounded-full bg-slate-200 dark:bg-zinc-800 animate-pulse" />
                    <div className="h-3 w-10 bg-slate-150 dark:bg-zinc-850 rounded animate-pulse" />
                  </div>
                  <div className="h-6 w-14 bg-slate-200 dark:bg-zinc-800 rounded-md animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TasksListSkeleton({ viewMode }: { viewMode: "list" | "kanban" }) {
  if (viewMode === "list") {
    return (
      <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
        {/* Table Header Skeleton */}
        <div className="grid grid-cols-6 gap-4 p-4 border-b border-slate-200/60 dark:border-white/[0.06] bg-slate-50/50 dark:bg-zinc-900/50">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-4 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" />
          ))}
        </div>
        {/* Table Rows Skeleton */}
        {[...Array(5)].map((_, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-6 gap-4 p-4 border-b border-slate-100 dark:border-white/[0.04] items-center">
            <div className="h-4 w-4/5 bg-slate-200 dark:bg-zinc-850 rounded animate-pulse" />
            <div className="h-5 w-24 bg-slate-150 dark:bg-zinc-850 rounded-full animate-pulse" />
            <div className="h-5 w-16 bg-slate-150 dark:bg-zinc-850 rounded-full animate-pulse" />
            <div className="h-5 w-20 bg-slate-150 dark:bg-zinc-850 rounded-full animate-pulse" />
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-slate-200 dark:bg-zinc-800 animate-pulse" />
              <div className="h-3 w-16 bg-slate-150 dark:bg-zinc-850 rounded animate-pulse" />
            </div>
            <div className="h-4 w-20 bg-slate-150 dark:bg-zinc-850 rounded animate-pulse justify-self-end" />
          </div>
        ))}
      </div>
    );
  }

  // Kanban view
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
      {[...Array(4)].map((_, colIndex) => (
        <div key={colIndex} className="flex flex-col rounded-2xl p-4 bg-slate-50/40 dark:bg-zinc-900/30 border border-slate-200/60 dark:border-white/[0.04] min-h-[600px] space-y-4">
          {/* Column Header Skeleton */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/50 dark:border-white/[0.04]">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-slate-350 dark:bg-zinc-750 animate-pulse" />
              <div className="h-4 w-20 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" />
            </div>
            <div className="h-5 w-8 bg-slate-200 dark:bg-zinc-805 rounded-full animate-pulse" />
          </div>

          {/* Column Task Cards Skeleton */}
          {[...Array(colIndex === 0 ? 3 : colIndex === 1 ? 2 : colIndex === 2 ? 1 : 0)].map((_, cardIndex) => (
            <div key={cardIndex} className="relative rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-white/[0.06] p-4 space-y-3 shadow-xs">
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-slate-200 dark:bg-zinc-800 animate-pulse" />
              <div className="h-3 w-16 bg-slate-200 dark:bg-zinc-850 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" />
              <div className="flex gap-2">
                <div className="h-5 w-12 bg-slate-150 dark:bg-zinc-850 rounded-full animate-pulse" />
                <div className="h-5 w-16 bg-slate-150 dark:bg-zinc-850 rounded-full animate-pulse" />
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/[0.06]">
                <div className="flex items-center gap-1.5">
                  <div className="h-5 w-5 rounded-full bg-slate-200 dark:bg-zinc-800 animate-pulse" />
                  <div className="h-3 w-12 bg-slate-150 dark:bg-zinc-850 rounded animate-pulse" />
                </div>
                <div className="h-6 w-14 bg-slate-200 dark:bg-zinc-800 rounded-md animate-pulse" />
              </div>
            </div>
          ))}
          {colIndex === 3 && (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-zinc-850 rounded-2xl p-6 text-slate-400 dark:text-slate-600 text-xs italic text-center h-28">
              Drag tasks here
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function NotesListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Pinned section header skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" />
        <div className="h-3.5 w-20 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" />
      </div>

      {/* Note cards grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="relative rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-white/[0.06] p-5 flex flex-col justify-between h-48 shadow-xs"
          >
            {/* Left strip skeleton */}
            <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-slate-200 dark:bg-zinc-850 animate-pulse rounded-l-2xl" />

            <div className="space-y-3">
              {/* Note card header: Title */}
              <div className="flex justify-between items-start gap-4">
                <div className="h-4 w-36 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" />
                {i < 2 && (
                  <div className="h-3.5 w-3.5 bg-slate-255 dark:bg-zinc-800 rounded animate-pulse" />
                )}
              </div>

              {/* Note card content lines */}
              <div className="space-y-2 pt-1">
                <div className="h-3 w-full bg-slate-150 dark:bg-zinc-850 rounded animate-pulse" />
                <div className="h-3 w-11/12 bg-slate-150 dark:bg-zinc-850 rounded animate-pulse" />
                <div className="h-3 w-3/4 bg-slate-150 dark:bg-zinc-850 rounded animate-pulse" />
              </div>
            </div>

            {/* Note card footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/[0.04] mt-4">
              <div className="h-5 w-12 bg-slate-150 dark:bg-zinc-850 rounded-full animate-pulse" />
              <div className="h-3.5 w-16 bg-slate-150 dark:bg-zinc-850 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TimePageSkeleton() {
  return (
    <div className="space-y-6 w-full">
      {/* Active running timer bar skeleton */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-white/[0.06] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-4 border-slate-200 dark:border-zinc-800 animate-pulse">
        <div className="space-y-2 flex-1">
          <div className="h-3.5 w-32 bg-slate-200 dark:bg-zinc-800 rounded" />
          <div className="h-5 w-64 bg-slate-200 dark:bg-zinc-750 rounded" />
          <div className="h-3 w-40 bg-slate-155 dark:bg-zinc-850 rounded" />
        </div>
        <div className="h-9 w-28 bg-slate-200 dark:bg-zinc-800 rounded-lg shrink-0" />
      </div>

      {/* Tab Selectors Skeleton */}
      <div className="flex bg-slate-100 dark:bg-zinc-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-white/[0.08] w-72 h-8 animate-pulse" />

      {/* Timeline Date Picker bar skeleton */}
      <div className="rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-white/[0.06] animate-pulse">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-slate-200 dark:bg-zinc-800 rounded-lg" />
          <div className="h-8 w-36 bg-slate-200 dark:bg-zinc-800 rounded-lg" />
          <div className="h-8 w-8 bg-slate-200 dark:bg-zinc-800 rounded-lg" />
        </div>
        <div className="h-6 w-32 bg-slate-200 dark:bg-zinc-800 rounded-lg" />
      </div>

      {/* Daily User Log Summary Grid Skeleton */}
      <div className="rounded-2xl p-5 border border-slate-200/80 dark:border-white/[0.06] bg-white dark:bg-zinc-900 space-y-4">
        <div className="h-4 w-40 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 rounded-xl border border-slate-200/60 dark:border-white/[0.05] bg-slate-50/40 dark:bg-zinc-900/30 flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-zinc-850" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-24 bg-slate-200 dark:bg-zinc-750 rounded" />
                  <div className="h-3 w-16 bg-slate-150 dark:bg-zinc-850 rounded" />
                </div>
              </div>
              <div className="space-y-1.5 flex flex-col items-end">
                <div className="h-5 w-16 bg-slate-200 dark:bg-zinc-800 rounded-full" />
                <div className="h-3 w-12 bg-slate-150 dark:bg-zinc-850 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline View Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col space-y-3">
          <div className="h-3 w-32 bg-slate-200 dark:bg-zinc-800 rounded pl-16 animate-pulse" />
          <div className="h-[400px] border border-slate-200 dark:border-white/[0.06] rounded-2xl bg-white dark:bg-zinc-900 relative p-4 space-y-6 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex gap-4 items-start border-t border-slate-100 dark:border-white/[0.04] pt-4 first:border-0 first:pt-0">
                <div className="h-3 w-10 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" />
                <div className="flex-1 h-12 bg-slate-50 dark:bg-zinc-900/40 border border-slate-150 dark:border-white/[0.04] rounded-xl animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-4">
          <div className="rounded-2xl p-5 border border-slate-200/80 dark:border-white/[0.06] bg-slate-50/30 dark:bg-zinc-900/20 space-y-3 animate-pulse">
            <div className="h-4 w-36 bg-slate-200 dark:bg-zinc-800 rounded" />
            <div className="space-y-2">
              <div className="h-3 w-full bg-slate-200 dark:bg-zinc-800 rounded" />
              <div className="h-3 w-11/12 bg-slate-200 dark:bg-zinc-800 rounded" />
              <div className="h-3 w-10/12 bg-slate-200 dark:bg-zinc-800 rounded" />
              <div className="h-3 w-3/4 bg-slate-200 dark:bg-zinc-800 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AttendancePageSkeleton() {
  return (
    <div className="space-y-6 w-full">
      {/* Search & Actions Bar Skeleton */}
      <div className="rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-white/[0.06] animate-pulse">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-slate-200 dark:bg-zinc-800 rounded-lg" />
          <div className="h-8 w-36 bg-slate-200 dark:bg-zinc-800 rounded-lg" />
          <div className="h-8 w-8 bg-slate-200 dark:bg-zinc-800 rounded-lg" />
        </div>
        <div className="h-8 w-44 bg-slate-200 dark:bg-zinc-800/80 rounded-lg" />
      </div>

      {/* Table Skeleton */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-white/[0.06] overflow-hidden">
        <div className="border-b border-slate-100 dark:border-white/[0.04] p-4 bg-slate-50/50 dark:bg-zinc-900/20 grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-3.5 w-24 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" />
          ))}
        </div>
        <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
          {[...Array(5)].map((_, rowIdx) => (
            <div key={rowIdx} className="p-4 grid grid-cols-4 gap-4 items-center">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-zinc-850 animate-pulse shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-3 w-28 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" />
                  <div className="h-2.5 w-36 bg-slate-150 dark:bg-zinc-850 rounded animate-pulse" />
                </div>
              </div>
              <div>
                <div className="h-5 w-20 bg-slate-200 dark:bg-zinc-850 rounded-full animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="h-3.5 w-32 bg-slate-150 dark:bg-zinc-850 rounded animate-pulse" />
              </div>
              <div>
                <div className="h-5 w-16 bg-slate-150 dark:bg-zinc-850 rounded-full animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DocumentsPageSkeleton() {
  return (
    <div className="space-y-6 w-full">
      {/* Filters bar */}
      <div className="h-10 w-60 bg-slate-200 dark:bg-zinc-800 rounded-lg animate-pulse" />

      {/* Table Skeleton */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-white/[0.06] overflow-hidden">
        <div className="border-b border-slate-100 dark:border-white/[0.04] p-4 bg-slate-50/50 dark:bg-zinc-900/20 grid grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`h-3.5 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse ${i === 5 ? "w-16 ml-auto" : "w-24"}`} />
          ))}
        </div>
        <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
          {[...Array(5)].map((_, rowIdx) => (
            <div key={rowIdx} className="p-4 grid grid-cols-6 gap-4 items-center">
              <div className="h-3.5 w-36 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" />
              <div className="h-3 w-28 bg-slate-150 dark:bg-zinc-850 rounded animate-pulse" />
              <div className="h-3 w-20 bg-slate-150 dark:bg-zinc-850 rounded animate-pulse" />
              <div className="h-3 w-24 bg-slate-150 dark:bg-zinc-850 rounded animate-pulse" />
              <div className="h-3 w-24 bg-slate-150 dark:bg-zinc-850 rounded animate-pulse" />
              <div className="flex gap-2 justify-end">
                <div className="h-8 w-20 bg-slate-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
                <div className="h-8 w-16 bg-slate-155 dark:bg-zinc-850 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function UsersListPageSkeleton() {
  return (
    <div className="space-y-6 w-full">
      {/* Search Input Skeleton */}
      <div className="h-10 w-full md:max-w-sm bg-slate-200 dark:bg-zinc-800 rounded-lg animate-pulse" />

      {/* Table Skeleton */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-white/[0.06] overflow-hidden">
        <div className="border-b border-slate-100 dark:border-white/[0.04] p-4 bg-slate-50/50 dark:bg-zinc-900/20 grid grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`h-3.5 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse ${i === 5 ? "w-16 ml-auto" : "w-24"}`} />
          ))}
        </div>
        <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
          {[...Array(5)].map((_, rowIdx) => (
            <div key={rowIdx} className="p-4 grid grid-cols-6 gap-4 items-center">
              <div className="h-3.5 w-32 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" />
              <div className="h-3 w-40 bg-slate-150 dark:bg-zinc-850 rounded animate-pulse" />
              <div className="h-5 w-16 bg-slate-200 dark:bg-zinc-850 rounded-full animate-pulse" />
              <div className="h-5 w-16 bg-slate-150 dark:bg-zinc-850 rounded-full animate-pulse" />
              <div className="h-3 w-24 bg-slate-150 dark:bg-zinc-850 rounded animate-pulse" />
              <div className="flex gap-2 justify-end">
                <div className="h-8 w-16 bg-slate-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
                <div className="h-8 w-20 bg-slate-155 dark:bg-zinc-850 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SettingsPageSkeleton() {
  return (
    <div className="space-y-6 w-full">
      {/* Key-Value Form Card Skeleton */}
      <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white dark:bg-zinc-900 p-5 grid grid-cols-1 sm:grid-cols-[200px_1fr_auto] gap-3 items-end animate-pulse">
        <div className="space-y-2">
          <div className="h-3 w-10 bg-slate-200 dark:bg-zinc-800 rounded" />
          <div className="h-10 w-full bg-slate-150 dark:bg-zinc-850 rounded-lg" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-12 bg-slate-200 dark:bg-zinc-800 rounded" />
          <div className="h-10 w-full bg-slate-155 dark:bg-zinc-850 rounded-lg" />
        </div>
        <div className="h-10 w-20 bg-slate-200 dark:bg-zinc-800 rounded-lg" />
      </div>

      {/* Table Skeleton */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-white/[0.06] overflow-hidden">
        <div className="border-b border-slate-100 dark:border-white/[0.04] p-4 bg-slate-50/50 dark:bg-zinc-900/20 grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`h-3.5 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse ${i === 2 ? "w-16 ml-auto" : "w-24"}`} />
          ))}
        </div>
        <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
          {[...Array(3)].map((_, rowIdx) => (
            <div key={rowIdx} className="p-4 grid grid-cols-3 gap-4 items-center">
              <div className="h-3.5 w-24 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse font-mono" />
              <div className="h-3.5 w-48 bg-slate-150 dark:bg-zinc-850 rounded animate-pulse" />
              <div className="flex gap-2 justify-end">
                <div className="h-8 w-16 bg-slate-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
                <div className="h-8 w-16 bg-slate-150 dark:bg-zinc-850 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* GitHub Integration card skeleton */}
      <div className="rounded-2xl p-6 border border-slate-200/60 dark:border-white/[0.06] bg-slate-50/50 dark:bg-zinc-900/30 space-y-4 animate-pulse">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 bg-slate-200 dark:bg-zinc-800 rounded" />
          <div className="h-4 w-48 bg-slate-200 dark:bg-zinc-750 rounded" />
        </div>
        <div className="h-3.5 w-3/4 bg-slate-200 dark:bg-zinc-800 rounded" />
        <div className="space-y-2">
          <div className="h-3 w-16 bg-slate-150 dark:bg-zinc-850 rounded" />
          <div className="flex gap-2 max-w-xl">
            <div className="h-10 flex-1 bg-slate-155 dark:bg-zinc-850 rounded-lg" />
            <div className="h-10 w-16 bg-slate-200 dark:bg-zinc-800 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}



