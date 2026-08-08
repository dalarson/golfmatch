import { ChevronRight, Medal } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";
import type { ViewRow } from "../../types/database";

type LeaderboardEntry = ViewRow<"leaderboard">;

function value(value: number | null) {
  return value ?? 0;
}

function LeaderboardRow({ player }: { player: LeaderboardEntry }) {
  const rank = player.rank ?? 0;
  const isPodium = rank > 0 && rank <= 3;
  const podiumStyles = {
    1: "border-trophy-400 bg-trophy-100/70",
    2: "border-slate-300 bg-slate-50",
    3: "border-amber-700/30 bg-amber-50/60",
  } as const;

  if (!player.player_id) return null;

  return (
    <li>
      <Link
        to={`/players/${player.player_id}`}
        className={cn(
          "group grid min-h-20 grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border bg-white px-3 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-card sm:grid-cols-[3rem_minmax(0,1fr)_8rem_6rem_2rem] sm:px-5",
          isPodium && podiumStyles[rank as 1 | 2 | 3],
        )}
        aria-label={`${player.player_name ?? "Player"}, rank ${rank || "unavailable"}, ${value(player.elo_rating)} ELO`}
      >
        <span
          className={cn(
            "grid size-9 place-items-center rounded-full bg-fairway-50 text-sm font-extrabold text-fairway-800",
            isPodium && "bg-white/80",
          )}
        >
          {isPodium ? (
            <Medal
              aria-hidden="true"
              size={21}
              className={cn(
                rank === 1 && "text-trophy-500",
                rank === 2 && "text-slate-500",
                rank === 3 && "text-amber-700",
              )}
            />
          ) : (
            rank || "—"
          )}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-bold text-fairway-950">
            {player.player_name ?? "Unnamed player"}
          </span>
          <span className="mt-1 block text-xs font-medium text-slate-500 sm:hidden">
            {value(player.wins)}W · {value(player.losses)}L ·{" "}
            {value(player.pushes)}P · {value(player.matches)} played ·{" "}
            {value(player.win_percentage).toFixed(1)}%
          </span>
        </span>
        <span className="text-right">
          <strong className="block text-xl font-extrabold tabular-nums text-fairway-950">
            {value(player.elo_rating)}
          </strong>
          <span className="block text-[0.65rem] font-bold uppercase tracking-wider text-slate-500">
            ELO
          </span>
        </span>
        <span className="hidden text-sm font-semibold tabular-nums text-slate-600 sm:block">
          {value(player.wins)}-{value(player.losses)}-{value(player.pushes)}
          <span className="block text-xs font-normal text-slate-500">
            {value(player.matches)} matches
          </span>
        </span>
        <span className="hidden text-right sm:block">
          <strong className="block tabular-nums text-fairway-800">
            {value(player.win_percentage).toFixed(1)}%
          </strong>
          <span className="text-xs text-slate-500">win rate</span>
        </span>
        <ChevronRight
          aria-hidden="true"
          className="hidden text-slate-400 transition group-hover:translate-x-0.5 sm:block"
          size={20}
        />
      </Link>
    </li>
  );
}

export function Leaderboard({ players }: { players: LeaderboardEntry[] }) {
  return (
    <section aria-labelledby="leaderboard-title">
      <div className="mb-3 flex items-end justify-between px-1">
        <div>
          <p className="eyebrow">Live standings</p>
          <h2 id="leaderboard-title" className="mt-1 text-xl font-extrabold">
            Current rankings
          </h2>
        </div>
        <span className="text-sm font-semibold text-slate-500">
          {players.length} {players.length === 1 ? "player" : "players"}
        </span>
      </div>
      <div className="mb-2 hidden grid-cols-[3rem_minmax(0,1fr)_8rem_6rem_2rem] gap-3 px-5 text-xs font-bold uppercase tracking-wider text-slate-500 sm:grid">
        <span>Rank</span>
        <span>Player</span>
        <span className="text-right">ELO</span>
        <span>Record</span>
        <span className="text-right">Win %</span>
      </div>
      <ol className="space-y-2">
        {players.map((player, index) => (
          <LeaderboardRow
            key={player.player_id ?? `leaderboard-${index}`}
            player={player}
          />
        ))}
      </ol>
    </section>
  );
}
