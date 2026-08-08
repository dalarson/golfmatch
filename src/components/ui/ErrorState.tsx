import { CircleAlert } from "lucide-react";

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <section className="card border border-red-100" role="alert">
      <CircleAlert className="text-red-700" aria-hidden="true" />
      <h2 className="mt-3 text-lg font-bold">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-600">{message}</p>
      {onRetry && (
        <button className="button-secondary mt-5" type="button" onClick={onRetry}>
          Try again
        </button>
      )}
    </section>
  );
}
