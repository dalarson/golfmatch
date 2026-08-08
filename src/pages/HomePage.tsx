import { useCallback } from "react";
import { Leaderboard } from "../components/leaderboard/Leaderboard";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { PageIntro } from "../components/ui/PageIntro";
import { useAsyncData } from "../hooks/useAsyncData";
import { getLeaderboard } from "../services/leaderboard";

export function HomePage() {
  const load = useCallback(() => getLeaderboard(), []);
  const leaderboard = useAsyncData(load);

  return (
    <>
      <PageIntro
        eyebrow="Current rankings"
        title="The field. Ranked."
        description="Live ELO standings and career records from every match played."
      />
      {leaderboard.status === "loading" && (
        <LoadingState label="Loading leaderboard" rows={6} />
      )}
      {leaderboard.status === "error" && (
        <ErrorState
          title="Unable to load rankings"
          message="The current standings could not be loaded. Check your connection and try again."
          onRetry={leaderboard.retry}
        />
      )}
      {leaderboard.status === "success" && leaderboard.data.length === 0 && (
        <EmptyState
          title="No rankings yet"
          description="Add players to start building the Fairway leaderboard."
        />
      )}
      {leaderboard.status === "success" && leaderboard.data.length > 0 && (
        <Leaderboard players={leaderboard.data} />
      )}
    </>
  );
}
