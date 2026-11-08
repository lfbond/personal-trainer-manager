import { useEffect, useId, type ReactNode } from "react";

interface WorkoutModalProps {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  maxWidth?: "md" | "lg" | "xl";
  busy?: boolean;
}

const widths = {
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
};

export function WorkoutModal({
  open,
  title,
  description,
  children,
  onClose,
  footer,
  maxWidth = "lg",
  busy = false,
}: WorkoutModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, busy]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={`flex max-h-[calc(100dvh-1.5rem)] w-full ${widths[maxWidth]} flex-col overflow-hidden rounded-2xl border border-border-default bg-surface shadow-2xl sm:max-h-[calc(100dvh-3rem)]`}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border-default px-5 py-4">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-xl font-semibold text-text-primary"
            >
              {title}
            </h2>

            {description && (
              <p
                id={descriptionId}
                className="mt-1 text-sm text-text-secondary"
              >
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Fechar janela"
            className="shrink-0 rounded-lg border border-border-default px-3 py-1.5 text-text-secondary transition hover:bg-page disabled:opacity-50"
          >
            ✕
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
          {children}
        </div>

        {footer && (
          <footer className="shrink-0 border-t border-border-default bg-surface px-5 py-4">
            {footer}
          </footer>
        )}
      </section>
    </div>
  );
}
