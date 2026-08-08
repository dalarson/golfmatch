import { ChevronLeft, ChevronRight, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Dialog } from "../components/ui/Dialog";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { PageIntro } from "../components/ui/PageIntro";
import { useAsyncData } from "../hooks/useAsyncData";
import { teamNames } from "../lib/matches";
import { formatMatchDate } from "../lib/utils";
import { deleteMatch, getMatchHistoryPage, type MatchSummary } from "../services/matches";
import { getServiceErrorMessage } from "../services/shared";

const PAGE_SIZE = 8;

function DeleteMatchDialog({
  match,
  onClose,
  onDeleted,
}: {
  match: MatchSummary;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const deletionLock = useRef(false);

  async function handleDelete() {
    if (!match.match_id || deletionLock.current) return;
    deletionLock.current = true;
    setIsDeleting(true);
    setError("");
    try {
      await deleteMatch(match.match_id);
      onDeleted();
    } catch (deletionError) {
      setError(getServiceErrorMessage(deletionError, "Unable to delete the match."));
      setIsDeleting(false);
      deletionLock.current = false;
    }
  }

  return (
    <Dialog
      title="Delete match?"
      description="This action cannot be undone."
      onClose={onClose}
      isPending={isDeleting}
    >
      <div aria-busy={isDeleting}>
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-800">
          Deleting this historical match will rebuild all player ratings from the remaining match history.
        </p>
        <p className="mt-4 text-sm text-slate-600">
          {match.date ? formatMatchDate(match.date, "MMMM d, yyyy") : "Unknown date"} · {teamNames(match.team_1_players)} vs {teamNames(match.team_2_players)}
        </p>
        {error && <p className="mt-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button className="button-secondary" type="button" onClick={onClose} disabled={isDeleting}>Cancel</button>
          <button className="button bg-red-700 text-white hover:bg-red-800" type="button" onClick={() => void handleDelete()} disabled={isDeleting}>
            <Trash2 aria-hidden="true" size={18} />
            {isDeleting ? "Deleting & recalculating…" : "Delete & recalculate"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

export function AdminMatchesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedPage = Number(searchParams.get("page"));
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const load = useCallback(() => getMatchHistoryPage(page, PAGE_SIZE), [page]);
  const history = useAsyncData(load);
  const [deletingMatch, setDeletingMatch] = useState<MatchSummary | null>(null);
  const [feedback, setFeedback] = useState("");

  function goToPage(nextPage: number) {
    setSearchParams(nextPage === 1 ? {} : { page: String(nextPage) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDeleted() {
    setDeletingMatch(null);
    setFeedback("Match deleted. Historical ratings were rebuilt.");
    if (history.status === "success" && history.data.matches.length === 1 && page > 1) {
      goToPage(page - 1);
    } else {
      history.retry();
    }
  }

  const totalPages = history.status === "success" ? Math.max(1, Math.ceil(history.data.total / PAGE_SIZE)) : 1;

  useEffect(() => {
    if (history.status === "success" && history.data.total > 0 && page > totalPages) {
      setSearchParams(totalPages === 1 ? {} : { page: String(totalPages) }, { replace: true });
    }
  }, [history, page, setSearchParams, totalPages]);

  return (
    <>
      <PageIntro
        eyebrow="Administration"
        title="Matches"
        description="Review recent results, correct historical entries, or remove a match with an automatic rating rebuild."
        action={<Link className="button-primary" to="/admin/matches/new"><Plus aria-hidden="true" size={18} />Log match</Link>}
      />
      {feedback && <p className="mb-4 rounded-xl bg-fairway-50 px-4 py-3 text-sm font-semibold text-fairway-800" role="status">{feedback}</p>}
      {history.status === "loading" && <LoadingState label="Loading matches" rows={5} />}
      {history.status === "error" && <ErrorState title="Unable to load matches" message="Match management data could not be loaded." onRetry={history.retry} />}
      {history.status === "success" && history.data.total === 0 && (
        <EmptyState title="No matches yet" description="Log the first match to begin the result history." action={<Link className="button-primary" to="/admin/matches/new">Log match</Link>} />
      )}
      {history.status === "success" && history.data.matches.length > 0 && (
        <>
          <div className="mb-3 flex justify-between px-1 text-sm font-semibold text-slate-500">
            <span>Recent results</span><span>{history.data.total} total</span>
          </div>
          <ul className="grid gap-3 lg:grid-cols-2">
            {history.data.matches.map((match) => (
              <li key={match.match_id} className="card min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <time className="eyebrow" dateTime={match.date ?? undefined}>{match.date ? formatMatchDate(match.date) : "Date unavailable"}</time>
                    <h2 className="mt-2 truncate font-extrabold">{teamNames(match.team_1_players)} vs {teamNames(match.team_2_players)}</h2>
                    <p className="mt-1 truncate text-sm text-slate-600">{match.course_name} · {match.holes} holes · {match.score}</p>
                  </div>
                  <span className="rounded-lg bg-fairway-50 px-2 py-1 text-xs font-extrabold text-fairway-800">
                    {match.team_1_result === "PUSH" ? "PUSH" : match.team_1_result === "WIN" ? "T1 WIN" : "T2 WIN"}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-4">
                  <Link className="button-secondary min-w-0 px-2" to={`/matches/${match.match_id}`}>
                    <ExternalLink aria-hidden="true" size={16} /><span className="sr-only sm:not-sr-only">View</span>
                  </Link>
                  <Link className="button-secondary min-w-0 px-2" to={`/admin/matches/${match.match_id}/edit`}>
                    <Pencil aria-hidden="true" size={16} /><span className="sr-only sm:not-sr-only">Edit</span>
                  </Link>
                  <button className="button min-w-0 border border-red-200 bg-white px-2 text-red-700 hover:bg-red-50" type="button" onClick={() => setDeletingMatch(match)}>
                    <Trash2 aria-hidden="true" size={16} /><span className="sr-only sm:not-sr-only">Delete</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <nav className="mt-6 flex items-center justify-between gap-3" aria-label="Admin match pagination">
            <button className="button-secondary px-3 sm:px-5" type="button" disabled={page <= 1} onClick={() => goToPage(page - 1)}><ChevronLeft aria-hidden="true" size={18} />Previous</button>
            <span className="text-sm font-semibold text-slate-600">Page {page} of {totalPages}</span>
            <button className="button-secondary px-3 sm:px-5" type="button" disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>Next<ChevronRight aria-hidden="true" size={18} /></button>
          </nav>
        </>
      )}
      {deletingMatch && <DeleteMatchDialog match={deletingMatch} onClose={() => setDeletingMatch(null)} onDeleted={handleDeleted} />}
    </>
  );
}
