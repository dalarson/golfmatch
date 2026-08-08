import { Route, Routes } from "react-router-dom";
import { AdminGuard } from "./components/admin/AdminGuard";
import { AppShell } from "./components/layout/AppShell";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { AdminPage } from "./pages/AdminPage";
import { HomePage } from "./pages/HomePage";
import { MatchDetailPage } from "./pages/MatchDetailPage";
import { MatchesPage } from "./pages/MatchesPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PlayerComingSoonPage } from "./pages/PlayerComingSoonPage";
import { PlayersPage } from "./pages/PlayersPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="players" element={<PlayersPage />} />
        <Route path="players/:playerId" element={<PlayerComingSoonPage />} />
        <Route path="matches" element={<MatchesPage />} />
        <Route path="matches/:matchId" element={<MatchDetailPage />} />
        <Route path="admin/login" element={<AdminLoginPage />} />
        <Route element={<AdminGuard />}>
          <Route path="admin" element={<AdminPage />} />
          <Route
            path="admin/players"
            element={
              <PlaceholderPage
                eyebrow="Admin"
                title="Manage players"
                description="Create and update players through database RPCs."
              />
            }
          />
          <Route
            path="admin/courses"
            element={
              <PlaceholderPage
                eyebrow="Admin"
                title="Manage courses"
                description="Create and update course records through database RPCs."
              />
            }
          />
          <Route
            path="admin/matches"
            element={
              <PlaceholderPage
                eyebrow="Admin"
                title="Manage matches"
                description="Review the history and launch the match entry workflow."
              />
            }
          />
          <Route
            path="admin/matches/new"
            element={
              <PlaceholderPage
                eyebrow="Admin"
                title="Log a match"
                description="The step-based match entry workflow will call record_match atomically."
              />
            }
          />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
