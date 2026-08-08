import { Activity, Gauge, Percent, Trophy } from "lucide-react";
import { cn } from "../../lib/utils";
import type { PlayerStats as PlayerStatsData } from "../../services/statistics";

const cards = [
  { key: "matches", label: "Matches", icon: Activity },
  { key: "win_percentage", label: "Win rate", icon: Percent },
  { key: "elo_change", label: "ELO change", icon: Gauge },
] as const;

export function PlayerStats({
  stats,
  isFiltered,
}: {
  stats: PlayerStatsData;
  isFiltered: boolean;
}) {
  return (
    <section aria-labelledby="player-stats-title">
      <div className="mb-3 flex items-end justify-between gap-3 px-1">
        <div>
          <p className="eyebrow">{isFiltered ? "Filtered performance" : "Career performance"}</p>
          <h2 id="player-stats-title" className="mt-1 text-xl font-extrabold">
            {stats.wins}W · {stats.losses}L · {stats.pushes}P
          </h2>
        </div>
        <Trophy aria-hidden="true" className="text-trophy-500" size={22} />
      </div>
      <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-3">
        {cards.map(({ key, label, icon: Icon }) => {
          const value =
            key === "win_percentage"
              ? `${stats[key].toFixed(1)}%`
              : key === "elo_change"
                ? `${stats[key] > 0 ? "+" : ""}${stats[key]}`
                : stats[key];
          return (
            <div className="card min-w-0 p-4" key={key}>
              <Icon aria-hidden="true" className="text-fairway-700" size={18} />
              <strong
                className={cn(
                  "mt-3 block truncate text-2xl font-extrabold tabular-nums",
                  key === "elo_change" && stats[key] > 0 && "text-fairway-700",
                  key === "elo_change" && stats[key] < 0 && "text-red-700",
                )}
              >
                {value}
              </strong>
              <span className="mt-1 block text-[0.65rem] font-bold uppercase tracking-wider text-slate-500">
                {label}
              </span>
            </div>
          );
        })}
      </div>
      {stats.matches === 0 && (
        <p className="mt-3 rounded-xl border bg-white px-4 py-3 text-sm text-slate-600">
          No matches meet this filter combination.
        </p>
      )}
    </section>
  );
}
