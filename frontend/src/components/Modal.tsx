import type { ReactNode } from "react";
import { X } from "lucide-react";

export function Modal({ open, onClose, title, children, footer }: {
  open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-slate-950/60 p-4" onClick={onClose}>
      <div className="card w-full max-w-lg p-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4 py-3">
          <div className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">{title}</div>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-550 hover:text-slate-600 dark:hover:text-slate-300"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4">{children}</div>
        {footer && <div className="border-t border-slate-200 dark:border-slate-800 px-4 py-3 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
