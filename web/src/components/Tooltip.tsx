import React from "react";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function Tooltip({ content, children, position = "top", className = "" }: TooltipProps) {
  const boxPositionClasses = {
    top: "tooltip-box-top",
    bottom: "tooltip-box-bottom",
    left: "tooltip-box-left",
    right: "tooltip-box-right",
  }[position];

  const arrowClasses = {
    top: "tooltip-arrow-top border-r border-b",
    bottom: "tooltip-arrow-bottom border-t border-l",
    left: "tooltip-arrow-left border-t border-r",
    right: "tooltip-arrow-right border-b border-l",
  }[position];

  return (
    <div className={`tooltip-container ${className}`}>
      {children}
      <div className={`tooltip-box ${boxPositionClasses}`}>
        <div className="relative bg-slate-950/95 dark:bg-zinc-900/98 backdrop-blur-md text-white dark:text-slate-100 text-[11px] px-2.5 py-1.5 rounded-lg shadow-xl border border-white/10 dark:border-white/[0.08] whitespace-nowrap font-medium leading-normal">
          {content}
          <div className={`tooltip-arrow bg-slate-950/95 dark:bg-zinc-900/98 border-white/10 dark:border-white/[0.08] ${arrowClasses}`} />
        </div>
      </div>
    </div>
  );
}
