import React from "react";
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

export function LoadingPage({ message = "Loading...", fullScreen = false }: { message?: string; fullScreen?: boolean }) {
  return (
    <div className={clsx(
      "flex flex-col items-center justify-center transition-all duration-500",
      fullScreen 
        ? "fixed inset-0 bg-slate-50/70 dark:bg-zinc-950/80 backdrop-blur-md z-50 h-screen w-screen" 
        : "min-h-[30vh] w-full py-10"
    )}>
      <div className="relative flex items-center justify-center h-24 w-24">
        {/* Premium multi-layered glow */}
        <div className="absolute inset-0 rounded-full bg-brand-500/10 dark:bg-brand-500/5 blur-xl animate-pulse" />
        <div className="absolute h-16 w-16 rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-md animate-pulse [animation-delay:0.5s]" />
        
        {/* Sleek outer rotating dashed border */}
        <div className="absolute inset-2 rounded-full border border-dashed border-brand-500/30 dark:border-brand-400/25 animate-spin [animation-duration:8s]" />
        
        {/* Concentric rotating arcs */}
        <div className="absolute inset-3 rounded-full border-2 border-transparent border-t-brand-600 dark:border-t-brand-500 animate-spin [animation-duration:1.2s]" />
        <div className="absolute inset-4 rounded-full border border-transparent border-b-indigo-500 dark:border-b-indigo-400 animate-spin [animation-duration:1.8s] [animation-direction:reverse]" />
        
        {/* Premium center capsule */}
        <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 shadow-lg shadow-brand-500/20 flex items-center justify-center relative z-10">
          <div className="h-2.5 w-2.5 rounded-full bg-white animate-ping [animation-duration:1.5s]" />
        </div>
      </div>
      
      {/* Sleek micro-animated text */}
      <div className="mt-5 flex flex-col items-center space-y-1 select-none">
        <span className="text-[10px] font-black uppercase tracking-[0.25em] bg-gradient-to-r from-brand-600 to-indigo-500 dark:from-brand-400 dark:to-indigo-400 bg-clip-text text-transparent">
          Qubartech ERP
        </span>
        <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-widest animate-pulse">
          {message}
        </span>
      </div>
    </div>
  );
}
