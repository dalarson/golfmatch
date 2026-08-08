import { z } from "zod";
import { supabase } from "../lib/supabase";
import { leaderboardEntrySchema, type LeaderboardEntry } from "./schemas";
import { throwIfError } from "./shared";

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from("leaderboard")
    .select("*")
    .order("rank");
  throwIfError("Unable to load leaderboard", error);
  return z.array(leaderboardEntrySchema).parse(data);
}
