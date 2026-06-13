import { Modal } from "./Modal";

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
            className={danger ? "btn-danger" : "btn-primary"}
            onClick={onConfirm}
            disabled={loading}
          >{loading ? "Working…" : confirmLabel}</button>
        </>
      }
    >
      {description && <p className="text-sm text-slate-600">{description}</p>}
    </Modal>
  );
}
