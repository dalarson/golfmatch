import { ArrowLeft, Flag, Minus, Trophy } from "lucide-react";
import { useCallback } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { useAsyncData } from "../hooks/useAsyncData";
import { teamNames } from "../lib/matches";
import { cn, formatMatchDate } from "../lib/utils";
import {
  getMatch,
  getMatchRatings,
  type MatchRating,
  type MatchSummary,
} from "../services/matches";

function RatingLine({
  player,
  rating,
}: {
  player: MatchSummary["team_1_players"][number];
  rating: MatchRating | undefined;
}) {
  return (
    <li className="flex items-center justify-between gap-3 border-t py-3 first:border-t-0">
      <span className="font-semibold">{player.name}</span>
      {rating ? (
        <span className="text-right text-sm tabular-nums text-slate-600">
          {rating.ratingBefore} → {rating.ratingAfter}{" "}
          <strong
            className={cn(
              rating.ratingChange > 0 && "text-fairway-700",
              rating.ratingChange < 0 && "text-red-700",
            )}
          >
            ({rating.ratingChange > 0 ? "+" : ""}
            {rating.ratingChange})
          </strong>
        </span>
      ) : (
        <span className="text-sm text-slate-500">Rating unavailable</span>
      )}
    </li>
  );
}

function TeamPanel({
  label,
  players,
  result,
  ratings,
}: {
  label: string;
  players: MatchSummary["team_1_players"];
  result: MatchSummary["team_1_result"];
  ratings: MatchRating[];
}) {
  return (
    <section
      className={cn(
        "rounded-card border bg-white p-5",
        result === "WIN" && "border-trophy-400 bg-trophy-100/40",
      )}
      aria-label={label}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">{label}</p>
          <h2 className="mt-2 text-xl font-extrabold">{teamNames(players)}</h2>
        </div>
        <span
          className={cn(
            "inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-extrabold",
            result === "WIN" && "bg-trophy-100 text-trophy-700",
            result === "LOSS" && "bg-slate-100 text-slate-600",
            result === "PUSH" && "bg-fairway-50 text-fairway-700",
          )}
        >
          {result === "WIN" && <Trophy aria-hidden="true" size={15} />}
          {result === "PUSH" && <Minus aria-hidden="true" size={15} />}
          {result ?? "Result unavailable"}
        </span>
      </div>
      <ul className="mt-4">
        {players.map((player) => (
          <RatingLine
            key={player.id}
            player={player}
            rating={ratings.find((rating) => rating.playerId === player.id)}
          />
        ))}
      </ul>
    </section>
  );
}

export function MatchDetailPage() {
  const { matchId } = useParams();
  const location = useLocation();
  const navigationState = location.state as { message?: string } | null;
  const load = useCallback(async () => {
    if (!matchId) return { match: null, ratings: [] };
    const [match, ratings] = await Promise.all([
      getMatch(matchId),
      getMatchRatings(matchId),
    ]);
    return { match, ratings };
  }, [matchId]);
  const detail = useAsyncData(load);

  if (detail.status === "loading") {
    return <LoadingState label="Loading match details" rows={4} />;
  }
  if (detail.status === "error") {
    return (
      <ErrorState
        title="Unable to load this match"
        message="The match details could not be loaded. Check your connection and try again."
        onRetry={detail.retry}
      />
    );
  }
  if (!detail.data.match) {
    return (
      <EmptyState
        title="Match not found"
        description="This match may have been removed or the link may be incorrect."
        action={
          <Link className="button-secondary" to="/matches">
            Back to match history
          </Link>
        }
      />
    );
  }

  const match = detail.data.match;
  return (
    <>
      {navigationState?.message && (
        <p className="mb-4 rounded-xl bg-fairway-50 px-4 py-3 text-sm font-semibold text-fairway-800" role="status">
          {navigationState.message}
        </p>
      )}
      <Link
        to="/matches"
        className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-bold text-fairway-800"
      >
        <ArrowLeft aria-hidden="true" size={18} />
        Match history
      </Link>
      <header className="overflow-hidden rounded-card bg-fairway-900 p-5 text-white shadow-card sm:p-8">
        <div className="flex items-center gap-2 text-trophy-400">
          <Flag aria-hidden="true" size={18} />
          <p className="text-xs font-bold uppercase tracking-[0.18em]">
            {match.course_name ?? "Course unavailable"}
          </p>
        </div>
        <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">
          {match.score ?? "Score unavailable"}
        </h1>
        <p className="mt-3 text-sm text-fairway-100">
          {match.date ? formatMatchDate(match.date, "MMMM d, yyyy") : "Date unavailable"}
          {" · "}
          {match.holes ?? "—"} holes
          {" · "}
          {match.team_size
            ? `${match.team_size}v${match.team_size}`
            : "Format unavailable"}
        </p>
        <p className="mt-6 text-lg font-bold">
          {match.team_1_result === "PUSH"
            ? "Match pushed"
            : match.team_1_result === "WIN"
              ? `${teamNames(match.team_1_players)} won`
              : match.team_2_result === "WIN"
                ? `${teamNames(match.team_2_players)} won`
                : "Result unavailable"}
        </p>
      </header>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <TeamPanel
          label="Team 1"
          players={match.team_1_players}
          result={match.team_1_result}
          ratings={detail.data.ratings}
        />
        <TeamPanel
          label="Team 2"
          players={match.team_2_players}
          result={match.team_2_result}
          ratings={detail.data.ratings}
        />
      </div>
      <p className="mt-4 text-center text-xs text-slate-500">
        Player ratings show ELO before → after (change).
      </p>
    </>
  );
}
