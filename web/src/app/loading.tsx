import React from "react";

export default function Loading() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-50/60 dark:bg-zinc-950/60 backdrop-blur-md z-50 h-screen w-screen transition-all duration-300">
      <div className="relative flex flex-col items-center">
        {/* Glowing backdrop reflection */}
        <div className="absolute h-24 w-24 rounded-full bg-brand-500/10 dark:bg-brand-500/5 blur-xl animate-pulse" />
        
        {/* Spinning & pulsing dual outer rings */}
        <div className="absolute h-16 w-16 rounded-full border-t-2 border-r-2 border-brand-600 dark:border-brand-500 animate-spin" />
        <div className="absolute h-20 w-20 rounded-full border-b-2 border-l-2 border-indigo-500/30 dark:border-indigo-400/20 animate-spin [animation-duration:3s]" />
        
        {/* Glowing center orb */}
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 shadow-lg shadow-brand-500/30 flex items-center justify-center relative z-10 animate-pulse">
          <div className="h-2 w-2 rounded-full bg-white animate-ping" />
        </div>
      </div>
      
      {/* Premium text with modern tracking and micro-animation */}
      <div className="mt-8 flex flex-col items-center space-y-1.5 select-none">
        <span className="text-xs font-black uppercase tracking-[0.2em] bg-gradient-to-r from-brand-600 to-indigo-500 dark:from-brand-400 dark:to-indigo-400 bg-clip-text text-transparent animate-pulse">
          Qubartech ERP
        </span>
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          Syncing Workspace...
        </span>
      </div>
    </div>
  );
}
