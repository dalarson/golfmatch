import { Search, Users } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { PageIntro } from "../components/ui/PageIntro";
import { useAsyncData } from "../hooks/useAsyncData";
import { getLeaderboard } from "../services/leaderboard";

export function PlayersPage() {
  const [query, setQuery] = useState("");
  const load = useCallback(() => getLeaderboard(), []);
  const players = useAsyncData(load);
  const filteredPlayers = useMemo(() => {
    if (players.status !== "success") return [];
    const normalized = query.trim().toLocaleLowerCase();
    return normalized
      ? players.data.filter((player) =>
          (player.player_name ?? "").toLocaleLowerCase().includes(normalized),
        )
      : players.data;
  }, [players, query]);

  return (
    <>
      <PageIntro
        eyebrow="The field"
        title="Player directory"
        description="Browse every player and their current authoritative ELO standing."
      />
      {players.status === "loading" && (
        <LoadingState label="Loading players" rows={5} />
      )}
      {players.status === "error" && (
        <ErrorState
          title="Unable to load players"
          message="The player directory could not be loaded. Check your connection and try again."
          onRetry={players.retry}
        />
      )}
      {players.status === "success" && players.data.length === 0 && (
        <EmptyState
          title="No players yet"
          description="Players will appear here once they are added to the field."
        />
      )}
      {players.status === "success" && players.data.length > 0 && (
        <section aria-labelledby="players-title">
          <h2 id="players-title" className="sr-only">
            Players
          </h2>
          <label className="relative block">
            <span className="sr-only">Search players</span>
            <Search
              aria-hidden="true"
              size={19}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              className="control pl-11"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search players"
            />
          </label>
          {filteredPlayers.length ? (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {filteredPlayers.map((player) =>
                player.player_id ? (
                  <li key={player.player_id}>
                    <Link
                      className="card flex min-h-20 items-center gap-4 transition hover:-translate-y-0.5"
                      to={`/players/${player.player_id}`}
                    >
                      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-fairway-50 text-fairway-700">
                        <Users aria-hidden="true" size={20} />
                      </span>
                      <span className="min-w-0">
                        <strong className="block truncate">
                          {player.player_name ?? "Unnamed player"}
                        </strong>
                        <span className="mt-1 block text-sm text-slate-500">
                          Rank #{player.rank ?? "—"} · {player.elo_rating ?? 0} ELO
                        </span>
                      </span>
                    </Link>
                  </li>
                ) : null,
              )}
            </ul>
          ) : (
            <div className="mt-4">
              <EmptyState
                title="No matching players"
                description="Try a different name or clear the search."
              />
            </div>
          )}
        </section>
      )}
    </>
  );
}

