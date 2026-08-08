import type { MatchSummary } from "../services/matches";

export function teamNames(players: MatchSummary["team_1_players"]) {
  return players.length
    ? players.map((player) => player.name).join(" + ")
    : "Team unavailable";
}
