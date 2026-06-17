import { clsx } from "clsx";

export function LoadingSpinner({ size = "md", className }: { size?: "xs" | "sm" | "md" | "lg"; className?: string }) {
  const sizeClasses = {
    xs: "h-3.5 w-3.5 border-[1.5px]",
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-8 w-8 border-[3px]"
  };
  
  return (
    <div
      className={clsx(
        "rounded-full border-slate-200 border-t-brand-600 dark:border-zinc-800 dark:border-t-brand-500 animate-spin shrink-0",
        sizeClasses[size],
        className
      )}
    />
  );
}

export function LoadingPage({ message = "Loading Workspace..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 w-full">
      <div className="relative flex items-center justify-center">
        {/* Pulsing outer ring */}
        <div className="absolute h-12 w-12 rounded-full border border-brand-500/20 animate-ping opacity-75" />
        {/* Main Spinner */}
        <LoadingSpinner size="lg" className="relative z-10" />
      </div>
      <span className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mt-4 animate-pulse">
        {message}
      </span>
    </div>
  );
}
