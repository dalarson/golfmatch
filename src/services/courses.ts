import { supabase } from "../lib/supabase";
import { throwIfError } from "./shared";
import type { TableRow } from "../types/database";

export async function getCourses(): Promise<TableRow<"courses">[]> {
  const { data, error } = await supabase.from("courses").select("*").order("name");
  throwIfError("Unable to load courses", error);
  return data;
}

export async function createCourse(name: string, location: string): Promise<string> {
  const { data, error } = await supabase.rpc("create_course", {
    p_name: name,
    p_location: location,
  });
  throwIfError("Unable to create course", error);
  return data;
}

export async function updateCourse(
  courseId: string,
  name: string,
  location: string,
): Promise<TableRow<"courses">> {
  const { data, error } = await supabase.rpc("update_course", {
    p_course_id: courseId,
    p_name: name,
    p_location: location,
  });
  throwIfError("Unable to update course", error);
  return data;
}

export async function getEloSettings(): Promise<TableRow<"elo_settings">> {
  const { data, error } = await supabase
    .from("elo_settings")
    .select("*")
    .eq("id", true)
    .single();
  throwIfError("Unable to load ELO settings", error);
  return data;
}
