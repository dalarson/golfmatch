import { ChevronRight, Flag, Minus, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { teamNames } from "../../lib/matches";
import { formatMatchDate } from "../../lib/utils";
import type { MatchSummary } from "../../services/matches";

function ResultIcon({ result }: { result: MatchSummary["team_1_result"] }) {
  if (result === "WIN") {
    return <Trophy aria-hidden="true" size={16} className="text-trophy-500" />;
  }
  if (result === "PUSH") {
    return <Minus aria-hidden="true" size={16} className="text-slate-500" />;
  }
  return null;
}

export function MatchCard({ match }: { match: MatchSummary }) {
  if (!match.match_id) return null;

  return (
    <li>
      <Link
        to={`/matches/${match.match_id}`}
        className="group block min-h-11 rounded-card bg-white p-4 shadow-card transition hover:-translate-y-0.5 sm:p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <time
              className="text-xs font-bold uppercase tracking-wider text-fairway-700"
              dateTime={match.date ?? undefined}
            >
              {match.date ? formatMatchDate(match.date) : "Date unavailable"}
            </time>
            <p className="mt-1 flex items-center gap-2 truncate text-sm font-semibold text-slate-600">
              <Flag aria-hidden="true" size={15} />
              {match.course_name ?? "Course unavailable"} ·{" "}
              {match.holes ?? "—"} holes ·{" "}
              {match.team_size ? `${match.team_size}v${match.team_size}` : "Format unavailable"}
            </p>
          </div>
          <ChevronRight
            aria-hidden="true"
            className="shrink-0 text-slate-400 transition group-hover:translate-x-0.5"
            size={20}
          />
        </div>
        <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2">
          <p className="flex min-w-0 items-center gap-2 font-bold">
            <ResultIcon result={match.team_1_result} />
            <span className="truncate">{teamNames(match.team_1_players)}</span>
          </p>
          <span className="row-span-2 self-center rounded-xl bg-fairway-50 px-3 py-2 text-center text-sm font-extrabold text-fairway-900">
            <span className="block">{match.score ?? "Score unavailable"}</span>
            <span className="mt-0.5 block text-[0.6rem] uppercase tracking-wider text-fairway-700">
              {match.team_1_result === "PUSH"
                ? "Push"
                : match.team_1_result === "WIN"
                  ? "Team 1 win"
                  : match.team_2_result === "WIN"
                    ? "Team 2 win"
                    : "Result unavailable"}
            </span>
          </span>
          <p className="flex min-w-0 items-center gap-2 font-bold">
            <ResultIcon result={match.team_2_result} />
            <span className="truncate">{teamNames(match.team_2_players)}</span>
          </p>
        </div>
      </Link>
    </li>
  );
}
