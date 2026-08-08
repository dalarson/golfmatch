import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { MatchCard } from "../components/matches/MatchCard";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { PageIntro } from "../components/ui/PageIntro";
import { useAsyncData } from "../hooks/useAsyncData";
import { getMatchHistoryPage } from "../services/matches";

const PAGE_SIZE = 10;

export function MatchesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedPage = Number(searchParams.get("page"));
  const page =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const load = useCallback(
    () => getMatchHistoryPage(page, PAGE_SIZE),
    [page],
  );
  const history = useAsyncData(load);

  function goToPage(nextPage: number) {
    setSearchParams(nextPage === 1 ? {} : { page: String(nextPage) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const totalPages =
    history.status === "success"
      ? Math.max(1, Math.ceil(history.data.total / PAGE_SIZE))
      : 1;

  return (
    <>
      <PageIntro
        eyebrow="Results archive"
        title="Match history"
        description="Every recorded match, ordered newest first with server-side pagination."
      />
      {history.status === "loading" && (
        <LoadingState label="Loading match history" rows={5} />
      )}
      {history.status === "error" && (
        <ErrorState
          title="Unable to load matches"
          message="Match history could not be loaded. Check your connection and try again."
          onRetry={history.retry}
        />
      )}
      {history.status === "success" && history.data.matches.length === 0 && (
        <EmptyState
          title={page === 1 ? "No matches yet" : "No matches on this page"}
          description={
            page === 1
              ? "Once the first match is logged, the result will appear here."
              : "Return to an earlier page to continue browsing match history."
          }
          action={
            page > 1 ? (
              <button
                type="button"
                className="button-secondary"
                onClick={() => goToPage(1)}
              >
                Return to first page
              </button>
            ) : undefined
          }
        />
      )}
      {history.status === "success" && history.data.matches.length > 0 && (
        <section aria-labelledby="matches-title">
          <div className="mb-3 flex items-end justify-between px-1">
            <h2 id="matches-title" className="text-xl font-extrabold">
              Recent results
            </h2>
            <span className="text-sm font-semibold text-slate-500">
              {history.data.total} total
            </span>
          </div>
          <ol className="grid gap-3 lg:grid-cols-2">
            {history.data.matches.map((match, index) => (
              <MatchCard
                key={match.match_id ?? `match-${index}`}
                match={match}
              />
            ))}
          </ol>
          <nav
            className="mt-6 flex items-center justify-between gap-3"
            aria-label="Match history pagination"
          >
            <button
              type="button"
              className="button-secondary"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
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
              onClick={() => goToPage(page + 1)}
            >
              Next
              <ChevronRight aria-hidden="true" size={18} />
            </button>
          </nav>
        </section>
      )}
    </>
  );
}

