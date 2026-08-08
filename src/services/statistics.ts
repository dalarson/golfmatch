import { z } from "zod";
import { supabase } from "../lib/supabase";
import { throwIfError } from "./shared";

const uuidSchema = z.string().uuid();

const playerOverviewSchema = z.object({
  player_id: uuidSchema,
  name: z.string().min(1),
  current_elo: z.number().int(),
  peak_elo: z.number().int(),
  matches: z.number().int().nonnegative(),
  wins: z.number().int().nonnegative(),
  losses: z.number().int().nonnegative(),
  pushes: z.number().int().nonnegative(),
  win_percentage: z.number().nonnegative(),
  elo_change_last_5: z.number().int(),
  elo_change_last_10: z.number().int(),
  elo_change_last_25: z.number().int(),
});

const playerStatsSchema = z.object({
  matches: z.number().int().nonnegative(),
  wins: z.number().int().nonnegative(),
  losses: z.number().int().nonnegative(),
  pushes: z.number().int().nonnegative(),
  win_percentage: z.number().nonnegative(),
  elo_change: z.number().int(),
});

const eloHistorySchema = z.object({
  player_id: uuidSchema,
  match_id: uuidSchema,
  date: z.string(),
  course_name: z.string(),
  rating_before: z.number().int(),
  rating_after: z.number().int(),
  rating_change: z.number().int(),
  created_at: z.string(),
});

const courseRecordSchema = z.object({
  player_id: uuidSchema,
  course_id: uuidSchema,
  course_name: z.string(),
  matches: z.number().int().nonnegative(),
  wins: z.number().int().nonnegative(),
  losses: z.number().int().nonnegative(),
  pushes: z.number().int().nonnegative(),
  win_percentage: z.number().nonnegative(),
  elo_change: z.number().int(),
});

const partnershipSchema = z.object({
  player_id: uuidSchema,
  partner_id: uuidSchema,
  player_name: z.string(),
  partner_name: z.string(),
  matches: z.number().int().nonnegative(),
  wins: z.number().int().nonnegative(),
  losses: z.number().int().nonnegative(),
  pushes: z.number().int().nonnegative(),
  win_percentage: z.number().nonnegative(),
});

const headToHeadSchema = z.object({
  player_id: uuidSchema,
  opponent_id: uuidSchema,
  player_name: z.string(),
  opponent_name: z.string(),
  matches: z.number().int().nonnegative(),
  wins: z.number().int().nonnegative(),
  losses: z.number().int().nonnegative(),
  pushes: z.number().int().nonnegative(),
  win_percentage: z.number().nonnegative(),
});

const playerHistorySchema = z.object({
  match_id: uuidSchema,
  player_id: uuidSchema,
  date: z.string(),
  course_id: uuidSchema,
  course_name: z.string(),
  holes: z.number().int(),
  team_size: z.number().int(),
  player_result: z.enum(["WIN", "LOSS", "PUSH"]),
  score_type: z.enum(["UP", "HOLES_UP", "PUSH"]),
  score_value: z.number().int().nullable(),
  holes_remaining: z.number().int().nullable(),
  elo_before: z.number().int(),
  elo_after: z.number().int(),
  elo_change: z.number().int(),
  created_at: z.string(),
});

export type PlayerOverview = z.infer<typeof playerOverviewSchema>;
export type PlayerStats = z.infer<typeof playerStatsSchema>;
export type EloHistoryPoint = z.infer<typeof eloHistorySchema>;
export type PlayerCourseRecord = z.infer<typeof courseRecordSchema>;
export type PlayerPartnership = z.infer<typeof partnershipSchema>;
export type PlayerHeadToHead = z.infer<typeof headToHeadSchema>;
export type PlayerHistoryItem = z.infer<typeof playerHistorySchema>;

export interface PlayerStatsFilters {
  courseId: string | null;
  partnerId: string | null;
  opponentId: string | null;
  holes: 9 | 18 | null;
}

export interface PlayerHistoryPage {
  matches: PlayerHistoryItem[];
  total: number;
}

export async function getPlayerOverview(
  playerId: string,
): Promise<PlayerOverview | null> {
  const { data, error } = await supabase.rpc("get_player_overview", {
    p_player_id: playerId,
  });
  throwIfError("Unable to load player overview", error);
  return data[0] ? playerOverviewSchema.parse(data[0]) : null;
}

export async function getPlayerRank(playerId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from("leaderboard")
    .select("rank")
    .eq("player_id", playerId)
    .maybeSingle();
  throwIfError("Unable to load player rank", error);
  return data?.rank ?? null;
}

export async function getPlayerStats(
  playerId: string,
  filters: PlayerStatsFilters,
): Promise<PlayerStats> {
  const { data, error } = await supabase.rpc("get_player_stats", {
    p_player_id: playerId,
    p_course_id: filters.courseId,
    p_partner_id: filters.partnerId,
    p_opponent_id: filters.opponentId,
    p_holes: filters.holes,
    p_team_size: null,
    p_start_date: null,
    p_end_date: null,
  });
  throwIfError("Unable to load player statistics", error);
  return playerStatsSchema.parse(data[0]);
}

export async function getPlayerEloHistory(
  playerId: string,
): Promise<EloHistoryPoint[]> {
  const { data, error } = await supabase
    .from("player_elo_history")
    .select("*")
    .eq("player_id", playerId)
    .order("date")
    .order("created_at")
    .order("match_id");
  throwIfError("Unable to load ELO history", error);
  return z.array(eloHistorySchema).parse(data);
}

export async function getPlayerCourseRecords(
  playerId: string,
): Promise<PlayerCourseRecord[]> {
  const { data, error } = await supabase
    .from("player_course_records")
    .select("*")
    .eq("player_id", playerId)
    .order("win_percentage", { ascending: false })
    .order("matches", { ascending: false });
  throwIfError("Unable to load course statistics", error);
  return z.array(courseRecordSchema).parse(data);
}

export async function getPlayerPartnerships(
  playerId: string,
): Promise<PlayerPartnership[]> {
  const { data, error } = await supabase
    .from("player_partnerships")
    .select("*")
    .eq("player_id", playerId)
    .order("matches", { ascending: false })
    .order("partner_name");
  throwIfError("Unable to load partnership statistics", error);
  return z.array(partnershipSchema).parse(data);
}

export async function getPlayerHeadToHead(
  playerId: string,
): Promise<PlayerHeadToHead[]> {
  const { data, error } = await supabase
    .from("player_head_to_head")
    .select("*")
    .eq("player_id", playerId)
    .order("matches", { ascending: false })
    .order("opponent_name");
  throwIfError("Unable to load head-to-head statistics", error);
  return z.array(headToHeadSchema).parse(data);
}

export async function getPlayerMatchHistoryPage(
  playerId: string,
  page: number,
  pageSize: number,
): Promise<PlayerHistoryPage> {
  const from = (page - 1) * pageSize;
  const { data, error, count } = await supabase
    .from("player_match_history")
    .select("*", { count: "exact" })
    .eq("player_id", playerId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .order("match_id", { ascending: false })
    .range(from, from + pageSize - 1);
  throwIfError("Unable to load player match history", error);
  return {
    matches: z.array(playerHistorySchema).parse(data),
    total: count ?? 0,
  };
}
