import { Flag, Map, Plus, Users } from "lucide-react";
import { useCallback } from "react";
import { Link } from "react-router-dom";
import { useAdminAuth } from "../auth/AdminAuthContext";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { PageIntro } from "../components/ui/PageIntro";
import { useAsyncData } from "../hooks/useAsyncData";
import { getCourses } from "../services/courses";
import { getLeaderboard } from "../services/leaderboard";
import { getMatchHistoryPage } from "../services/matches";

const adminLinks = [
  {
    to: "/admin/matches",
    title: "Match history",
    description: "Log, edit, and remove matches",
    icon: Flag,
  },
  {
    to: "/admin/players",
    title: "Players",
    description: "Manage the field",
    icon: Users,
  },
  {
    to: "/admin/courses",
    title: "Courses",
    description: "Manage venues",
    icon: Map,
  },
];

export function AdminPage() {
  const { logout } = useAdminAuth();
  const load = useCallback(async () => {
    const [players, courses, matches] = await Promise.all([
      getLeaderboard(),
      getCourses(),
      getMatchHistoryPage(1, 1),
    ]);
    return { players, courses, matches };
  }, []);
  const summary = useAsyncData(load);

  return (
    <>
      <PageIntro
        eyebrow="Administration"
        title="Clubhouse"
        description="Manage this personal match tracker. The access code is a UI convenience gate, not a security boundary."
        action={
          <div className="flex flex-wrap gap-2">
            <Link className="button-primary" to="/admin/matches/new">
              <Plus aria-hidden="true" size={18} />
              Log match
            </Link>
            <button className="button-secondary" type="button" onClick={logout}>
              Sign out
            </button>
          </div>
        }
      />
      {summary.status === "loading" && <LoadingState label="Loading admin summary" rows={2} />}
      {summary.status === "error" && (
        <ErrorState
          title="Unable to load the admin summary"
          message="Management tools are still available below."
          onRetry={summary.retry}
        />
      )}
      {summary.status === "success" && (
        <dl className="mb-6 grid grid-cols-3 gap-2 sm:gap-4">
          <div className="rounded-card bg-fairway-900 p-3 text-white shadow-card sm:p-5">
            <dt className="text-[0.65rem] font-bold uppercase tracking-wider text-fairway-100">Players</dt>
            <dd className="mt-1 text-2xl font-extrabold tabular-nums sm:text-3xl">{summary.data.players.length}</dd>
          </div>
          <div className="rounded-card bg-white p-3 shadow-card sm:p-5">
            <dt className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-500">Courses</dt>
            <dd className="mt-1 text-2xl font-extrabold tabular-nums sm:text-3xl">{summary.data.courses.length}</dd>
          </div>
          <div className="rounded-card bg-trophy-100 p-3 shadow-card sm:p-5">
            <dt className="text-[0.65rem] font-bold uppercase tracking-wider text-trophy-700">Matches</dt>
            <dd className="mt-1 text-2xl font-extrabold tabular-nums sm:text-3xl">{summary.data.matches.total}</dd>
          </div>
        </dl>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        {adminLinks.map(({ to, title, description, icon: Icon }) => (
          <Link key={to} to={to} className="card group min-h-36 transition hover:-translate-y-0.5">
            <Icon className="text-trophy-700" aria-hidden="true" />
            <h2 className="mt-5 text-lg font-extrabold text-fairway-950 group-hover:text-fairway-700">
              {title}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
