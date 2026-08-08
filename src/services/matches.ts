import { z } from "zod";
import { supabase } from "../lib/supabase";
import { throwIfError } from "./shared";
import type {
  Database,
  MatchResultValue,
  ScoreTypeValue,
} from "../types/database";

const matchPlayerSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

const matchSummarySchema = z.object({
  match_id: z.string().uuid().nullable(),
  date: z.string().nullable(),
  created_at: z.string(),
  course_id: z.string().uuid().nullable(),
  course_name: z.string().nullable(),
  holes: z.number().nullable(),
  team_size: z.number().nullable(),
  score: z.string().nullable(),
  team_1_result: z.enum(["WIN", "LOSS", "PUSH"]).nullable(),
  team_2_result: z.enum(["WIN", "LOSS", "PUSH"]).nullable(),
  team_1_players: z.array(matchPlayerSchema),
  team_2_players: z.array(matchPlayerSchema),
});

export type MatchSummary = z.infer<typeof matchSummarySchema>;

export interface MatchHistoryPage {
  matches: MatchSummary[];
  total: number;
}

export interface MatchRating {
  playerId: string;
  ratingBefore: number;
  ratingAfter: number;
  ratingChange: number;
}

export interface MatchFilters {
  courseId?: string;
  holes?: 9 | 18;
  teamSize?: 1 | 2;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface MatchInput {
  date: string;
  courseId: string;
  holes: 9 | 18;
  teamSize: 1 | 2;
  scoreType: ScoreTypeValue;
  scoreValue: number | null;
  holesRemaining: number | null;
  team1PlayerIds: string[];
  team2PlayerIds: string[];
  team1Result: MatchResultValue;
  team2Result: MatchResultValue;
}

export interface EditableMatch {
  id: string;
  input: MatchInput;
}

function toMatchArgs(
  input: MatchInput,
): Database["public"]["Functions"]["record_match"]["Args"] {
  return {
    p_date: input.date,
    p_course_id: input.courseId,
    p_holes: input.holes,
    p_team_size: input.teamSize,
    p_score_type: input.scoreType,
    p_score_value: input.scoreValue,
    p_holes_remaining: input.holesRemaining,
    p_team_1_player_ids: input.team1PlayerIds,
    p_team_2_player_ids: input.team2PlayerIds,
    p_team_1_result: input.team1Result,
    p_team_2_result: input.team2Result,
  };
}

export async function getMatchHistory(
  filters: MatchFilters = {},
): Promise<MatchSummary[]> {
  let query = supabase
    .from("match_summary")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .order("match_id", { ascending: false });

  if (filters.courseId) query = query.eq("course_id", filters.courseId);
  if (filters.holes) query = query.eq("holes", filters.holes);
  if (filters.teamSize) query = query.eq("team_size", filters.teamSize);
  if (filters.startDate) query = query.gte("date", filters.startDate);
  if (filters.endDate) query = query.lte("date", filters.endDate);
  if (filters.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  throwIfError("Unable to load match history", error);
  return data.map((match) =>
    matchSummarySchema.parse({
      ...match,
      team_1_players: match.team_1_players ?? [],
      team_2_players: match.team_2_players ?? [],
    }),
  );
}

export async function getMatchHistoryPage(
  page: number,
  pageSize: number,
): Promise<MatchHistoryPage> {
  const from = (page - 1) * pageSize;
  const { data, error, count } = await supabase
    .from("match_summary")
    .select("*", { count: "exact" })
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .order("match_id", { ascending: false })
    .range(from, from + pageSize - 1);
  throwIfError("Unable to load match history", error);

  return {
    matches: data.map((match) =>
      matchSummarySchema.parse({
        ...match,
        team_1_players: match.team_1_players ?? [],
        team_2_players: match.team_2_players ?? [],
      }),
    ),
    total: count ?? 0,
  };
}

export async function getMatch(matchId: string): Promise<MatchSummary | null> {
  const { data, error } = await supabase
    .from("match_summary")
    .select("*")
    .eq("match_id", matchId)
    .maybeSingle();
  throwIfError("Unable to load match", error);
  if (!data) return null;
  return matchSummarySchema.parse({
    ...data,
    team_1_players: data.team_1_players ?? [],
    team_2_players: data.team_2_players ?? [],
  });
}

export async function getEditableMatch(
  matchId: string,
): Promise<EditableMatch | null> {
  const [matchResult, teamsResult, playersResult] = await Promise.all([
    supabase.from("matches").select("*").eq("id", matchId).maybeSingle(),
    supabase
      .from("match_teams")
      .select("id, team_number, result")
      .eq("match_id", matchId)
      .order("team_number"),
    supabase
      .from("match_team_players")
      .select("match_team_id, player_id")
      .eq("match_id", matchId),
  ]);

  throwIfError("Unable to load match", matchResult.error);
  throwIfError("Unable to load match teams", teamsResult.error);
  throwIfError("Unable to load match players", playersResult.error);
  if (!matchResult.data) return null;

  const team1 = teamsResult.data.find((team) => team.team_number === 1);
  const team2 = teamsResult.data.find((team) => team.team_number === 2);
  if (!team1 || !team2) {
    throw new Error("The saved match does not contain two complete teams.");
  }

  const teamPlayerIds = (teamId: string) =>
    playersResult.data
      .filter((player) => player.match_team_id === teamId)
      .map((player) => player.player_id);
  const holes = matchResult.data.holes;
  const teamSize = matchResult.data.team_size;
  if ((holes !== 9 && holes !== 18) || (teamSize !== 1 && teamSize !== 2)) {
    throw new Error("The saved match has an unsupported format.");
  }

  return {
    id: matchResult.data.id,
    input: {
      date: matchResult.data.date,
      courseId: matchResult.data.course_id,
      holes,
      teamSize,
      scoreType: matchResult.data.score_type,
      scoreValue: matchResult.data.score_value,
      holesRemaining: matchResult.data.holes_remaining,
      team1PlayerIds: teamPlayerIds(team1.id),
      team2PlayerIds: teamPlayerIds(team2.id),
      team1Result: team1.result,
      team2Result: team2.result,
    },
  };
}

export async function getMatchRatings(
  matchId: string,
): Promise<MatchRating[]> {
  const { data, error } = await supabase
    .from("player_ratings")
    .select("player_id, rating_before, rating_after, rating_change")
    .eq("match_id", matchId)
    .order("player_id");
  throwIfError("Unable to load match ratings", error);
  return data.map((rating) => ({
    playerId: rating.player_id,
    ratingBefore: rating.rating_before,
    ratingAfter: rating.rating_after,
    ratingChange: rating.rating_change,
  }));
}

export async function recordMatch(input: MatchInput): Promise<string> {
  const { data, error } = await supabase.rpc("record_match", toMatchArgs(input));
  throwIfError("Unable to record match", error);
  return data;
}

export async function updateMatch(
  matchId: string,
  input: MatchInput,
): Promise<string> {
  const { data, error } = await supabase.rpc("update_match", {
    p_match_id: matchId,
    ...toMatchArgs(input),
  });
  throwIfError("Unable to update match", error);
  return data;
}

export async function deleteMatch(matchId: string): Promise<void> {
  const { error } = await supabase.rpc("delete_match", {
    p_match_id: matchId,
  });
  throwIfError("Unable to delete match", error);
}

export async function recalculateAllElo() {
  const { data, error } = await supabase.rpc("recalculate_all_elo");
  throwIfError("Unable to recalculate ELO", error);
  return data[0] ?? null;
}
