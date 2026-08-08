import { AlertTriangle } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { MatchForm } from "../components/admin/MatchForm";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { PageIntro } from "../components/ui/PageIntro";
import { useAsyncData } from "../hooks/useAsyncData";
import { getCourses } from "../services/courses";
import { getEditableMatch, updateMatch, type MatchInput } from "../services/matches";
import { getPlayers } from "../services/players";
import { getServiceErrorMessage } from "../services/shared";

export function AdminEditMatchPage() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const load = useCallback(async () => {
    if (!matchId) return { match: null, players: [], courses: [] };
    const [match, players, courses] = await Promise.all([
      getEditableMatch(matchId),
      getPlayers(),
      getCourses(),
    ]);
    return { match, players, courses };
  }, [matchId]);
  const data = useAsyncData(load);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const submissionLock = useRef(false);

  async function handleSubmit(value: MatchInput) {
    if (!matchId || submissionLock.current) return;
    submissionLock.current = true;
    setIsSubmitting(true);
    setSubmissionError("");
    try {
      const updatedId = await updateMatch(matchId, value);
      void navigate(`/matches/${updatedId}`, {
        replace: true,
        state: { message: "Match updated. Historical ratings were rebuilt successfully." },
      });
    } catch (error) {
      setSubmissionError(getServiceErrorMessage(error, "Unable to update the match."));
      setIsSubmitting(false);
      submissionLock.current = false;
    }
  }

  if (data.status === "loading") return <LoadingState label="Loading match for editing" rows={5} />;
  if (data.status === "error") {
    return <ErrorState title="Unable to load this match" message="The authoritative match structure could not be loaded." onRetry={data.retry} />;
  }
  if (!data.data.match) {
    return (
      <EmptyState
        title="Match not found"
        description="This match may have been deleted."
        action={<Link className="button-secondary" to="/admin/matches">Back to match management</Link>}
      />
    );
  }

  return (
    <>
      <PageIntro
        eyebrow="Administration"
        title="Edit match"
        description="All supported fields can be changed before the complete match payload is saved."
      />
      <div className="mx-auto mb-5 flex max-w-2xl items-start gap-3 rounded-card border border-amber-300 bg-amber-50 p-4 text-amber-950">
        <AlertTriangle className="mt-0.5 shrink-0" aria-hidden="true" size={20} />
        <p className="text-sm leading-6">
          Changing a historical match rebuilds ELO for this match and every subsequent match.
        </p>
      </div>
      <MatchForm
        initialValue={data.data.match.input}
        players={data.data.players}
        courses={data.data.courses}
        submitLabel="Update & recalculate"
        isSubmitting={isSubmitting}
        submissionError={submissionError}
        onSubmit={(value) => void handleSubmit(value)}
      />
    </>
  );
}
