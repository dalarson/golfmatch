import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

export function Dialog({
  title,
  description,
  children,
  onClose,
}: {
  title: string;
  description: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-card bg-white p-0 text-ink shadow-2xl backdrop:bg-fairway-950/65"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
        <div>
          <h2 id={titleId} className="text-xl font-extrabold text-fairway-950">{title}</h2>
          <p id={descriptionId} className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <button
          type="button"
          className="grid size-11 shrink-0 place-items-center rounded-xl text-slate-500 hover:bg-slate-100"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X aria-hidden="true" size={20} />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </dialog>
  );
}
