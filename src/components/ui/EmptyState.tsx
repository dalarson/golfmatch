import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section className="card py-10 text-center">
      <p className="eyebrow">{title}</p>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </section>
  );
}
