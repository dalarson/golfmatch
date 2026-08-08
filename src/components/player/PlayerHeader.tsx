import { ArrowDownRight, ArrowLeft, ArrowUpRight, Minus } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";
import type { PlayerOverview } from "../../services/statistics";

export function PlayerHeader({
  player,
  rank,
}: {
  player: PlayerOverview;
  rank: number | null;
}) {
  const movement = player.elo_change_last_5;

  return (
    <>
      <Link
        to="/"
        className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-bold text-fairway-800"
      >
        <ArrowLeft aria-hidden="true" size={18} />
        Leaderboard
      </Link>
      <header className="overflow-hidden rounded-card bg-fairway-900 p-5 text-white shadow-card sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-trophy-400">
          {rank ? `Rank #${rank}` : "Player profile"}
        </p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="text-3xl font-extrabold sm:text-5xl">{player.name}</h1>
            <p className="mt-4 flex items-baseline gap-2">
              <strong className="text-4xl font-extrabold tabular-nums sm:text-5xl">
                {player.current_elo}
              </strong>
              <span className="text-sm font-bold uppercase tracking-wider text-fairway-100">
                ELO
              </span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <span className="text-fairway-100">Peak ELO</span>
            <strong className="text-right tabular-nums">{player.peak_elo}</strong>
            <span className="text-fairway-100">Last 5</span>
            <strong
              className={cn(
                "flex items-center justify-end gap-1 tabular-nums",
                movement > 0 && "text-emerald-300",
                movement < 0 && "text-red-300",
                movement === 0 && "text-fairway-100",
              )}
            >
              {movement > 0 ? (
                <ArrowUpRight aria-hidden="true" size={16} />
              ) : movement < 0 ? (
                <ArrowDownRight aria-hidden="true" size={16} />
              ) : (
                <Minus aria-hidden="true" size={16} />
              )}
              {movement > 0 ? "+" : ""}
              {movement}
            </strong>
          </div>
        </div>
        <div className="mt-7 border-t border-white/15 pt-5">
          <p className="text-lg font-extrabold tabular-nums">
            {player.wins}W · {player.losses}L · {player.pushes}P
          </p>
          <p className="mt-1 text-xs font-bold uppercase tracking-wider text-fairway-100">
            {player.matches} {player.matches === 1 ? "match" : "matches"} ·{" "}
            {player.win_percentage.toFixed(1)}% win rate
          </p>
        </div>
      </header>
    </>
  );
}
