import { useEffect, useRef } from "react";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        if (!loading) onCancel();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-border-default bg-surface p-0 text-text-primary shadow-2xl backdrop:bg-black/60"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-description"
    >
      <div className="p-6">
        <h2 id="confirm-modal-title" className="text-lg font-bold">
          {title}
        </h2>

        <p
          id="confirm-modal-description"
          className="mt-3 whitespace-pre-line text-sm text-text-secondary"
        >
          {message}
        </p>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="min-h-10 rounded-lg border border-border-default px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="min-h-10 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {loading ? "Salvando..." : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
