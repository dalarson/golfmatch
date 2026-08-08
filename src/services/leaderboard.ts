import { supabase } from "../lib/supabase";
import { throwIfError } from "./shared";
import type { ViewRow } from "../types/database";

export async function getLeaderboard(): Promise<ViewRow<"leaderboard">[]> {
  const { data, error } = await supabase
    .from("leaderboard")
    .select("*")
    .order("rank");
  throwIfError("Unable to load leaderboard", error);
  return data;
}
