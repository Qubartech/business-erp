import { Modal } from "./Modal";
import { Loader2 } from "lucide-react";

export function ConfirmDialog({
  open, title = "Are you sure?", description, confirmLabel = "Confirm", danger,
  onCancel, onConfirm, loading,
}: {
  open: boolean; title?: string; description?: string; confirmLabel?: string; danger?: boolean;
  onCancel: () => void; onConfirm: () => void; loading?: boolean;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title}
      footer={
        <>
          <button className="btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
          <button
            className={danger ? "btn-danger flex items-center justify-center gap-1.5" : "btn-primary flex items-center justify-center gap-1.5"}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin text-current" />}
            {loading ? "Working…" : confirmLabel}
          </button>
        </>
      }
    >
      {description && <p className="text-sm text-slate-600">{description}</p>}
    </Modal>
  );
}
