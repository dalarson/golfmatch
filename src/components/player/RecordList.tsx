import type { ReactNode } from "react";

export interface RecordListItem {
  id: string;
  name: string;
  matches: number;
  wins: number;
  losses: number;
  pushes: number;
  winPercentage: number;
  detail?: ReactNode;
}

export function RecordList({
  items,
  emptyMessage,
}: {
  items: RecordListItem[];
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return <p className="mt-4 text-sm leading-6 text-slate-600">{emptyMessage}</p>;
  }

  return (
    <ul className="mt-4 divide-y">
      {items.map((item) => (
        <li className="py-4 first:pt-0 last:pb-0" key={item.id}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <strong className="block truncate">{item.name}</strong>
              <span className="mt-1 block text-xs font-semibold text-slate-500">
                {item.matches} {item.matches === 1 ? "match" : "matches"}
              </span>
            </div>
            <strong className="shrink-0 text-sm tabular-nums text-fairway-800">
              {item.winPercentage.toFixed(1)}%
            </strong>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-bold tabular-nums">
              {item.wins}W · {item.losses}L · {item.pushes}P
            </span>
            {item.detail}
          </div>
        </li>
      ))}
    </ul>
  );
}
