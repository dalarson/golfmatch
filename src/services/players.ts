import { supabase } from "../lib/supabase";
import { throwIfError } from "./shared";
import type { TableRow } from "../types/database";

export async function getPlayers(): Promise<TableRow<"players">[]> {
  const { data, error } = await supabase.from("players").select("*").order("name");
  throwIfError("Unable to load players", error);
  return data;
}

export async function getPlayer(playerId: string): Promise<TableRow<"players">> {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("id", playerId)
    .single();
  throwIfError("Unable to load player", error);
  return data;
}

export async function createPlayer(name: string): Promise<string> {
  const { data, error } = await supabase.rpc("create_player", { p_name: name });
  throwIfError("Unable to create player", error);
  return data;
}

export async function updatePlayer(
  playerId: string,
  name: string,
): Promise<TableRow<"players">> {
  const { data, error } = await supabase.rpc("update_player", {
    p_player_id: playerId,
    p_name: name,
  });
  throwIfError("Unable to update player", error);
  return data;
}
