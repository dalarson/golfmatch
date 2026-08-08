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

export function App() {
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
