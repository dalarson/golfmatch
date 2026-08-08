import { useCallback, useEffect, useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { CourseRecords } from "../components/player/CourseRecords";
import { EloChart } from "../components/player/EloChart";
import { HeadToHeadStats } from "../components/player/HeadToHeadStats";
import { PartnershipStats } from "../components/player/PartnershipStats";
import { PlayerFilters } from "../components/player/PlayerFilters";
import { PlayerHeader } from "../components/player/PlayerHeader";
import { PlayerMatchHistory } from "../components/player/PlayerMatchHistory";
import { PlayerStats } from "../components/player/PlayerStats";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { useAsyncData } from "../hooks/useAsyncData";
import { isUuid } from "../lib/utils";
import { getCourses } from "../services/courses";
import {
  getPlayerCourseRecords,
  getPlayerEloHistory,
  getPlayerHeadToHead,
  getPlayerMatchHistoryPage,
  getPlayerOverview,
  getPlayerPartnerships,
  getPlayerRank,
  getPlayerStats,
  type PlayerStatsFilters,
} from "../services/statistics";

const HISTORY_PAGE_SIZE = 6;

function PlayerAnalytics({ playerId }: { playerId: string }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const loadProfile = useCallback(async () => {
    const [
      overview,
      rank,
      eloHistory,
      courseRecords,
      partnerships,
      opponents,
      courses,
    ] = await Promise.all([
      getPlayerOverview(playerId),
      getPlayerRank(playerId),
      getPlayerEloHistory(playerId),
      getPlayerCourseRecords(playerId),
      getPlayerPartnerships(playerId),
      getPlayerHeadToHead(playerId),
      getCourses(),
    ]);
    return {
      overview,
      rank,
      eloHistory,
      courseRecords,
      partnerships,
      opponents,
      courses,
    };
  }, [playerId]);
  const profile = useAsyncData(loadProfile);

  if (profile.status === "loading") {
    return <LoadingState label="Loading player analytics" rows={7} />;
  }
  if (profile.status === "error") {
    return (
      <ErrorState
        title="Unable to load this player"
        message="The player analytics could not be loaded. Check your connection and try again."
        onRetry={profile.retry}
      />
    );
  }
  if (!profile.data.overview) {
    return (
      <EmptyState
        title="Player not found"
        description="This player may have been removed or the link may be incorrect."
        action={
          <Link className="button-secondary" to="/players">
            Browse players
          </Link>
        }
      />
    );
  }

  return (
    <PlayerAnalyticsContent
      playerId={playerId}
      data={{ ...profile.data, overview: profile.data.overview }}
      searchParams={searchParams}
      setSearchParams={setSearchParams}
    />
  );
}

type ProfileData = {
  overview: NonNullable<Awaited<ReturnType<typeof getPlayerOverview>>>;
  rank: Awaited<ReturnType<typeof getPlayerRank>>;
  eloHistory: Awaited<ReturnType<typeof getPlayerEloHistory>>;
  courseRecords: Awaited<ReturnType<typeof getPlayerCourseRecords>>;
  partnerships: Awaited<ReturnType<typeof getPlayerPartnerships>>;
  opponents: Awaited<ReturnType<typeof getPlayerHeadToHead>>;
  courses: Awaited<ReturnType<typeof getCourses>>;
};

function PlayerAnalyticsContent({
  playerId,
  data,
  searchParams,
  setSearchParams,
}: {
  playerId: string;
  data: ProfileData;
  searchParams: URLSearchParams;
  setSearchParams: ReturnType<typeof useSearchParams>[1];
}) {
  const courseIds = useMemo(
    () => new Set(data.courses.map((course) => course.id)),
    [data.courses],
  );
  const partnerIds = useMemo(
    () => new Set(data.partnerships.map((item) => item.partner_id)),
    [data.partnerships],
  );
  const opponentIds = useMemo(
    () => new Set(data.opponents.map((item) => item.opponent_id)),
    [data.opponents],
  );
  const filters = useMemo<PlayerStatsFilters>(() => {
    const rawHoles = searchParams.get("holes");
    return {
      courseId: courseIds.has(searchParams.get("course") ?? "")
        ? searchParams.get("course")
        : null,
      partnerId: partnerIds.has(searchParams.get("partner") ?? "")
        ? searchParams.get("partner")
        : null,
      opponentId: opponentIds.has(searchParams.get("opponent") ?? "")
        ? searchParams.get("opponent")
        : null,
      holes: rawHoles === "9" ? 9 : rawHoles === "18" ? 18 : null,
    };
  }, [courseIds, opponentIds, partnerIds, searchParams]);
  const requestedPage = Number(searchParams.get("historyPage"));
  const historyPage =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  useEffect(() => {
    const normalized = new URLSearchParams(searchParams);
    if (!filters.courseId) normalized.delete("course");
    if (!filters.partnerId) normalized.delete("partner");
    if (!filters.opponentId) normalized.delete("opponent");
    if (!filters.holes) normalized.delete("holes");
    if (historyPage === 1) normalized.delete("historyPage");
    if (normalized.toString() !== searchParams.toString()) {
      setSearchParams(normalized, { replace: true });
    }
  }, [
    filters.courseId,
    filters.holes,
    filters.opponentId,
    filters.partnerId,
    historyPage,
    searchParams,
    setSearchParams,
  ]);

  const loadStats = useCallback(
    () => getPlayerStats(playerId, filters),
    [filters, playerId],
  );
  const stats = useAsyncData(loadStats);
  const loadHistory = useCallback(
    () => getPlayerMatchHistoryPage(playerId, historyPage, HISTORY_PAGE_SIZE),
    [historyPage, playerId],
  );
  const history = useAsyncData(loadHistory);

  useEffect(() => {
    if (history.status !== "success") return;
    const totalPages = Math.max(
      1,
      Math.ceil(history.data.total / HISTORY_PAGE_SIZE),
    );
    if (historyPage <= totalPages) return;
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (totalPages === 1) next.delete("historyPage");
      else next.set("historyPage", String(totalPages));
      return next;
    }, { replace: true });
  }, [history, historyPage, setSearchParams]);

  function updateFilter(key: keyof PlayerStatsFilters, value: string | null) {
    const paramNames: Record<keyof PlayerStatsFilters, string> = {
      courseId: "course",
      partnerId: "partner",
      opponentId: "opponent",
      holes: "holes",
    };
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (value) next.set(paramNames[key], value);
      else next.delete(paramNames[key]);
      next.delete("historyPage");
      return next;
    });
  }

  function resetFilters() {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      ["course", "partner", "opponent", "holes"].forEach((key) =>
        next.delete(key),
      );
      return next;
    });
  }

  function setHistoryPage(page: number) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (page === 1) next.delete("historyPage");
      else next.set("historyPage", String(page));
      return next;
    });
    document.getElementById("player-history-title")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  const activeLabels = [
    filters.courseId
      ? `Course: ${data.courses.find((item) => item.id === filters.courseId)?.name}`
      : null,
    filters.partnerId
      ? `Partner: ${data.partnerships.find((item) => item.partner_id === filters.partnerId)?.partner_name}`
      : null,
    filters.opponentId
      ? `Opponent: ${data.opponents.find((item) => item.opponent_id === filters.opponentId)?.opponent_name}`
      : null,
    filters.holes ? `${filters.holes} holes` : null,
  ].filter((label): label is string => Boolean(label));

  return (
    <>
      <PlayerHeader player={data.overview} rank={data.rank} />
      <div className="mt-5 grid min-w-0 gap-5 lg:grid-cols-2">
        <EloChart history={data.eloHistory} />
        <div className="min-w-0">
          {stats.status === "loading" && (
            <LoadingState label="Loading filtered statistics" rows={3} />
          )}
          {stats.status === "error" && (
            <ErrorState
              title="Unable to load statistics"
              message="These statistics could not be loaded. Try again without changing your filters."
              onRetry={stats.retry}
            />
          )}
          {stats.status === "success" && (
            <PlayerStats stats={stats.data} isFiltered={activeLabels.length > 0} />
          )}
        </div>
      </div>
      <div className="mt-5">
        <PlayerFilters
          filters={filters}
          courses={data.courses}
          partnerships={data.partnerships}
          opponents={data.opponents}
          activeLabels={activeLabels}
          onChange={updateFilter}
          onReset={resetFilters}
        />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <CourseRecords records={data.courseRecords} />
        <PartnershipStats partnerships={data.partnerships} />
        <HeadToHeadStats opponents={data.opponents} />
      </div>
      <div className="mt-8">
        {history.status === "loading" && (
          <LoadingState label="Loading player match history" rows={4} />
        )}
        {history.status === "error" && (
          <ErrorState
            title="Unable to load recent matches"
            message="This player's match history could not be loaded. Check your connection and try again."
            onRetry={history.retry}
          />
        )}
        {history.status === "success" && (
          <PlayerMatchHistory
            history={history.data}
            page={historyPage}
            pageSize={HISTORY_PAGE_SIZE}
            onPageChange={setHistoryPage}
          />
        )}
      </div>
    </>
  );
}

export function PlayerDetailPage() {
  const { playerId } = useParams();
  if (!isUuid(playerId)) {
    return (
      <EmptyState
        title="Player not found"
        description="The player link is incomplete."
      />
    );
  }
  return <PlayerAnalytics playerId={playerId} />;
}
