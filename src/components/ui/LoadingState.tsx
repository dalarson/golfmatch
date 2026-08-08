export function LoadingState({
  label = "Loading",
  rows = 3,
}: {
  label?: string;
  rows?: number;
}) {
  return (
    <section className="card" aria-busy="true" aria-label={label}>
      <span className="sr-only">{label}</span>
      <div className="space-y-4">
        {Array.from({ length: rows }, (_, index) => (
          <div
            key={index}
            className="animate-pulse rounded-xl border bg-fairway-50 p-4"
          >
            <div className="h-4 w-2/3 rounded bg-fairway-100" />
            <div className="mt-3 h-3 w-1/3 rounded bg-fairway-100" />
          </div>
        ))}
      </div>
    </section>
  );
}
