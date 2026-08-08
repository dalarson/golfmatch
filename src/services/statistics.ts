import { supabase } from "../lib/supabase";
import { throwIfError } from "./shared";
import type { Database, ViewRow } from "../types/database";

export type PlayerStatsFilters = Omit<
  Database["public"]["Functions"]["get_player_stats"]["Args"],
  "p_player_id"
>;

export async function getPlayerOverview(playerId: string) {
  const { data, error } = await supabase.rpc("get_player_overview", {
    p_player_id: playerId,
  });
  throwIfError("Unable to load player overview", error);
  return data[0] ?? null;
}

export async function getPlayerStats(
  playerId: string,
  filters: PlayerStatsFilters = {},
) {
  const { data, error } = await supabase.rpc("get_player_stats", {
    p_player_id: playerId,
    ...filters,
  });
  throwIfError("Unable to load player statistics", error);
  return data[0] ?? null;
}

export async function getPlayerEloHistory(
  playerId: string,
): Promise<ViewRow<"player_elo_history">[]> {
  const { data, error } = await supabase
    .from("player_elo_history")
    .select("*")
    .eq("player_id", playerId)
    .order("date")
    .order("match_id");
  throwIfError("Unable to load ELO history", error);
  return data;
}

export async function getPlayerCourseRecords(
  playerId: string,
): Promise<ViewRow<"player_course_records">[]> {
  const { data, error } = await supabase
    .from("player_course_records")
    .select("*")
    .eq("player_id", playerId)
    .order("win_percentage", { ascending: false });
  throwIfError("Unable to load course statistics", error);
  return data;
}

export async function getPlayerPartnerships(
  playerId: string,
): Promise<ViewRow<"player_partnerships">[]> {
  const { data, error } = await supabase
    .from("player_partnerships")
    .select("*")
    .eq("player_id", playerId)
    .order("matches", { ascending: false });
  throwIfError("Unable to load partnership statistics", error);
  return data;
}

export async function getPlayerHeadToHead(
  playerId: string,
): Promise<ViewRow<"player_head_to_head">[]> {
  const { data, error } = await supabase
    .from("player_head_to_head")
    .select("*")
    .eq("player_id", playerId)
    .order("matches", { ascending: false });
  throwIfError("Unable to load head-to-head statistics", error);
  return data;
}
