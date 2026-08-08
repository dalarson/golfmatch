import { z } from "zod";
import { supabase } from "../lib/supabase";
import { playerSchema, uuidSchema, type Player } from "./schemas";
import { throwIfError } from "./shared";

export async function getPlayers(): Promise<Player[]> {
  const { data, error } = await supabase.from("players").select("*").order("name");
  throwIfError("Unable to load players", error);
  return z.array(playerSchema).parse(data);
}

export async function createPlayer(name: string): Promise<string> {
  const { data, error } = await supabase.rpc("create_player", { p_name: name });
  throwIfError("Unable to create player", error);
  return uuidSchema.parse(data);
}

export async function updatePlayer(
  playerId: string,
  name: string,
): Promise<Player> {
  const { data, error } = await supabase.rpc("update_player", {
    p_player_id: playerId,
    p_name: name,
  });
  throwIfError("Unable to update player", error);
  return playerSchema.parse(data);
}
