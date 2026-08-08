import { Route, Routes } from "react-router-dom";
import { AdminGuard } from "./components/admin/AdminGuard";
import { AppShell } from "./components/layout/AppShell";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { AdminEditMatchPage } from "./pages/AdminEditMatchPage";
import { AdminMatchesPage } from "./pages/AdminMatchesPage";
import { AdminNewMatchPage } from "./pages/AdminNewMatchPage";
import { AdminCoursesPage } from "./pages/AdminCoursesPage";
import { AdminPage } from "./pages/AdminPage";
import { AdminPlayersPage } from "./pages/AdminPlayersPage";
import { HomePage } from "./pages/HomePage";
import { MatchDetailPage } from "./pages/MatchDetailPage";
import { MatchesPage } from "./pages/MatchesPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PlayerDetailPage } from "./pages/PlayerDetailPage";
import { PlayersPage } from "./pages/PlayersPage";
import { frontendConfigurationError } from "./lib/env";

function ConfigurationError() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl items-center px-4 py-10 sm:px-6">
      <section className="card w-full border border-amber-300" role="alert">
        <p className="eyebrow">Configuration required</p>
        <h1 className="mt-2 text-2xl font-extrabold text-fairway-950">
          Connect this deployment to Supabase
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Set <code>VITE_SUPABASE_URL</code> and{" "}
          <code>VITE_SUPABASE_ANON_KEY</code>, then rebuild the app. Use the
          public anonymous key, never a service-role key.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">
          {frontendConfigurationError}
        </pre>
        <p className="mt-4 text-sm text-slate-600">
          See the README setup section for migration and environment steps.
        </p>
      </section>
    </main>
  );
}

export function App() {
  if (frontendConfigurationError) {
    return <ConfigurationError />;
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="players" element={<PlayersPage />} />
        <Route path="players/:playerId" element={<PlayerDetailPage />} />
        <Route path="matches" element={<MatchesPage />} />
        <Route path="matches/:matchId" element={<MatchDetailPage />} />
        <Route path="admin/login" element={<AdminLoginPage />} />
        <Route element={<AdminGuard />}>
          <Route path="admin" element={<AdminPage />} />
          <Route path="admin/players" element={<AdminPlayersPage />} />
          <Route path="admin/courses" element={<AdminCoursesPage />} />
          <Route path="admin/matches" element={<AdminMatchesPage />} />
          <Route path="admin/matches/new" element={<AdminNewMatchPage />} />
          <Route path="admin/matches/:matchId/edit" element={<AdminEditMatchPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
