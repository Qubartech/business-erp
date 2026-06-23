import React from "react";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full transition-all duration-300">
      <div className="relative flex items-center justify-center h-20 w-20">
        {/* Glowing backdrop reflection */}
        <div className="absolute h-20 w-20 rounded-full bg-brand-500/10 dark:bg-brand-500/5 blur-xl animate-pulse" />
        
        {/* Spinning & pulsing dual outer rings */}
        <div className="absolute h-12 w-12 rounded-full border-t-2 border-r-2 border-brand-600 dark:border-brand-500 animate-spin" />
        <div className="absolute h-16 w-16 rounded-full border-b-2 border-l-2 border-indigo-500/30 dark:border-indigo-400/20 animate-spin [animation-duration:2.5s]" />
        
        {/* Center icon */}
        <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 shadow-md shadow-brand-500/20 flex items-center justify-center relative z-10 animate-pulse">
          <Loader2 className="h-4 w-4 text-white animate-spin [animation-duration:3s]" />
        </div>
      </div>
      
      {/* Loading text */}
      <div className="mt-6 flex flex-col items-center space-y-1 select-none">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-gradient-to-r from-brand-600 to-indigo-500 dark:from-brand-400 dark:to-indigo-400 bg-clip-text text-transparent">
          Qubartech ERP
        </span>
        <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest animate-pulse">
          Loading page...
        </span>
      </div>
    </div>
  );
}
