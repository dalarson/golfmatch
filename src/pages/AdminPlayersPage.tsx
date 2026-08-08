import { Pencil, Plus, Users } from "lucide-react";
import { useCallback, useRef, useState, type FormEvent } from "react";
import { z } from "zod";
import { Dialog } from "../components/ui/Dialog";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { PageIntro } from "../components/ui/PageIntro";
import { useAsyncData } from "../hooks/useAsyncData";
import { getLeaderboard } from "../services/leaderboard";
import { createPlayer, updatePlayer } from "../services/players";
import type { LeaderboardEntry } from "../services/schemas";
import { getServiceErrorMessage } from "../services/shared";

const playerSchema = z.object({
  name: z.string().trim().min(1, "Enter a player name.").max(100, "Use 100 characters or fewer."),
});

function PlayerDialog({
  player,
  onClose,
  onSaved,
}: {
  player: LeaderboardEntry | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [name, setName] = useState(player?.player_name ?? "");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionLock = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionLock.current) return;
    const parsed = playerSchema.safeParse({ name });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid player name.");
      return;
    }

    submissionLock.current = true;
    setIsSubmitting(true);
    setError("");
    try {
      if (player?.player_id) {
        await updatePlayer(player.player_id, parsed.data.name);
        onSaved(`${parsed.data.name} was updated.`);
      } else {
        await createPlayer(parsed.data.name);
        onSaved(`${parsed.data.name} was added.`);
      }
    } catch (submissionError) {
      setError(getServiceErrorMessage(submissionError, "Unable to save the player."));
      setIsSubmitting(false);
      submissionLock.current = false;
    }
  }

  return (
    <Dialog
      title={player ? "Edit player" : "Add player"}
      description={
        player
          ? "Update the display name used throughout match history."
          : "New players start at the configured initial ELO."
      }
      onClose={onClose}
      isPending={isSubmitting}
    >
      <form aria-busy={isSubmitting} onSubmit={(event) => void handleSubmit(event)}>
        <label className="text-sm font-bold" htmlFor="player-name">
          Display name
        </label>
        <input
          autoFocus
          id="player-name"
          className="control mt-2"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setError("");
          }}
          maxLength={100}
          disabled={isSubmitting}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "player-name-error" : undefined}
        />
        {error && <p id="player-name-error" className="mt-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button className="button-secondary" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button className="button-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save player"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

export function AdminPlayersPage() {
  const load = useCallback(() => getLeaderboard(), []);
  const players = useAsyncData(load);
  const [editingPlayer, setEditingPlayer] = useState<LeaderboardEntry | null | undefined>();
  const [feedback, setFeedback] = useState("");

  function handleSaved(message: string) {
    setEditingPlayer(undefined);
    setFeedback(message);
    players.retry();
  }

  return (
    <>
      <PageIntro
        eyebrow="Administration"
        title="Players"
        description="Add players or update display names. Historical players cannot be deleted."
        action={
          <button className="button-primary" type="button" onClick={() => setEditingPlayer(null)}>
            <Plus aria-hidden="true" size={18} />
            Add player
          </button>
        }
      />
      {feedback && <p className="mb-4 rounded-xl bg-fairway-50 px-4 py-3 text-sm font-semibold text-fairway-800" role="status">{feedback}</p>}
      {players.status === "loading" && <LoadingState label="Loading players" rows={5} />}
      {players.status === "error" && (
        <ErrorState title="Unable to load players" message="Player management data could not be loaded." onRetry={players.retry} />
      )}
      {players.status === "success" && players.data.length === 0 && (
        <EmptyState title="No players yet" description="Add the first player to start building the field." />
      )}
      {players.status === "success" && players.data.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {players.data.map((player) => (
            <li key={player.player_id} className="card flex min-w-0 items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-fairway-50 text-fairway-700">
                <Users aria-hidden="true" size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <strong className="block truncate">{player.player_name ?? "Unnamed player"}</strong>
                <span className="mt-1 block text-xs text-slate-500">
                  {player.elo_rating ?? 0} ELO · {player.wins ?? 0}-{player.losses ?? 0}-{player.pushes ?? 0}
                </span>
              </div>
              <button
                type="button"
                className="grid size-11 shrink-0 place-items-center rounded-xl border text-fairway-800 hover:bg-fairway-50"
                onClick={() => setEditingPlayer(player)}
                aria-label={`Edit ${player.player_name ?? "player"}`}
              >
                <Pencil aria-hidden="true" size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {editingPlayer !== undefined && (
        <PlayerDialog player={editingPlayer} onClose={() => setEditingPlayer(undefined)} onSaved={handleSaved} />
      )}
    </>
  );
}
