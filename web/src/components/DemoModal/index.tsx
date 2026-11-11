import { useEffect, useRef, type ReactNode } from "react";

type DemoModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
};

export function DemoModal({
  open,
  title,
  description,
  onClose,
  children,
}: DemoModalProps) {
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
      onClose={onClose}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          onClose();
        }
      }}
      aria-label={title}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-border-default bg-surface p-0 text-text-primary shadow-2xl backdrop:bg-black/75"
    >
      <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border-default bg-surface px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <h2 className="text-xl font-bold leading-snug">{title}</h2>

          {description && (
            <p className="mt-1 text-sm text-text-secondary">{description}</p>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar janela"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-default bg-page text-xl text-text-primary transition-colors hover:border-primary"
        >
          ×
        </button>
      </div>

      <div className="p-5 sm:p-6">{children}</div>

      <div className="border-t border-border-default bg-surface px-5 py-4 sm:px-6">
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-hover sm:w-auto"
        >
          Fechar
        </button>
      </div>
    </dialog>
  );
}
