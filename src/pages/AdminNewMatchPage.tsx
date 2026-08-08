import { format } from "date-fns";
import { useCallback, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MatchForm } from "../components/admin/MatchForm";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { PageIntro } from "../components/ui/PageIntro";
import { useAsyncData } from "../hooks/useAsyncData";
import { getCourses } from "../services/courses";
import { recordMatch, type MatchInput } from "../services/matches";
import { getPlayers } from "../services/players";
import { getServiceErrorMessage } from "../services/shared";

export function AdminNewMatchPage() {
  const navigate = useNavigate();
  const load = useCallback(async () => {
    const [players, courses] = await Promise.all([getPlayers(), getCourses()]);
    return { players, courses };
  }, []);
  const options = useAsyncData(load);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const submissionLock = useRef(false);

  async function handleSubmit(value: MatchInput) {
    if (submissionLock.current) return;
    submissionLock.current = true;
    setIsSubmitting(true);
    setSubmissionError("");
    try {
      const matchId = await recordMatch(value);
      void navigate(`/matches/${matchId}`, {
        replace: true,
        state: { message: "Match recorded. Ratings were recalculated successfully." },
      });
    } catch (error) {
      setSubmissionError(getServiceErrorMessage(error, "Unable to record the match."));
      setIsSubmitting(false);
      submissionLock.current = false;
    }
  }

  return (
    <>
      <PageIntro
        eyebrow="Administration"
        title="Log a match"
        description="Record a complete result in four quick steps. The database saves the match and ratings atomically."
      />
      {options.status === "loading" && <LoadingState label="Preparing match entry" rows={4} />}
      {options.status === "error" && (
        <ErrorState title="Unable to prepare match entry" message="Players and courses could not be loaded." onRetry={options.retry} />
      )}
      {options.status === "success" && (options.data.players.length < 2 || options.data.courses.length === 0) && (
        <EmptyState
          title="Match entry needs setup"
          description={
            options.data.courses.length === 0
              ? "Add at least one course before recording a match."
              : "Add at least two players before recording a match."
          }
          action={
            <Link className="button-primary" to={options.data.courses.length === 0 ? "/admin/courses" : "/admin/players"}>
              Complete setup
            </Link>
          }
        />
      )}
      {options.status === "success" && options.data.players.length >= 2 && options.data.courses.length > 0 && (
        <MatchForm
          initialValue={{
            date: format(new Date(), "yyyy-MM-dd"),
            courseId: options.data.courses[0]?.id ?? "",
            holes: 18,
            teamSize: 1,
            scoreType: "UP",
            scoreValue: 1,
            holesRemaining: null,
            team1PlayerIds: [],
            team2PlayerIds: [],
            team1Result: "WIN",
            team2Result: "LOSS",
          }}
          players={options.data.players}
          courses={options.data.courses}
          submitLabel="Save match"
          isSubmitting={isSubmitting}
          submissionError={submissionError}
          onSubmit={(value) => void handleSubmit(value)}
        />
      )}
    </>
  );
}
