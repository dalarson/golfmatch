import {
  ChevronLeft,
  ChevronRight,
  Flag,
  Minus,
  Trophy,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { formatMatchDate } from "../../lib/utils";
import type { PlayerHistoryPage } from "../../services/statistics";

function formatScore(match: PlayerHistoryPage["matches"][number]) {
  if (match.score_type === "PUSH") return "PUSH";
  if (match.score_type === "UP") return `${match.score_value}UP`;
  return `${match.score_value}&${match.holes_remaining}`;
}

export function PlayerMatchHistory({
  history,
  page,
  pageSize,
  onPageChange,
}: {
  history: PlayerHistoryPage;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(history.total / pageSize));

  return (
    <section aria-labelledby="player-history-title">
      <div className="mb-3 px-1">
        <p className="eyebrow">Unfiltered archive</p>
        <div className="flex items-end justify-between gap-3">
          <h2 id="player-history-title" className="mt-1 text-xl font-extrabold">
            Recent matches
          </h2>
          <span className="text-sm font-semibold text-slate-500">
            {history.total} total
          </span>
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Match history remains unfiltered because the history view does not expose
          partner or opponent dimensions.
        </p>
      </div>
      {history.matches.length === 0 ? (
        <div className="card text-sm leading-6 text-slate-600">
          No matches have been recorded for this player yet.
        </div>
      ) : (
        <ol className="grid gap-3 lg:grid-cols-2">
          {history.matches.map((match) => {
            const ResultIcon =
              match.player_result === "WIN"
                ? Trophy
                : match.player_result === "LOSS"
                  ? X
                  : Minus;
            return (
              <li key={match.match_id}>
                <Link
                  to={`/matches/${match.match_id}`}
                  className="card group block transition hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <time
                        className="text-xs font-bold uppercase tracking-wider text-fairway-700"
                        dateTime={match.date}
                      >
                        {formatMatchDate(match.date)}
                      </time>
                      <p className="mt-1 flex items-center gap-2 truncate text-sm text-slate-600">
                        <Flag aria-hidden="true" size={15} />
                        {match.course_name} · {match.holes} holes · {match.team_size}v
                        {match.team_size}
                      </p>
                    </div>
                    <span className="rounded-xl bg-fairway-50 px-3 py-2 text-sm font-extrabold text-fairway-900">
                      {formatScore(match)}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3 border-t pt-4">
                    <span className="flex items-center gap-2 text-sm font-extrabold">
                      <ResultIcon aria-hidden="true" size={17} />
                      {match.player_result}
                    </span>
                    <span className="text-sm font-bold tabular-nums text-slate-600">
                      {match.elo_before} → {match.elo_after} (
                      {match.elo_change > 0 ? "+" : ""}
                      {match.elo_change})
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
      {history.total > pageSize && (
        <nav
          className="mt-5 flex items-center justify-between gap-3"
          aria-label="Player match history pagination"
        >
          <button
            type="button"
            className="button-secondary"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft aria-hidden="true" size={18} />
            Previous
          </button>
          <span className="text-sm font-semibold text-slate-600">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="button-secondary"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
            <ChevronRight aria-hidden="true" size={18} />
          </button>
        </nav>
      )}
    </section>
  );
}
