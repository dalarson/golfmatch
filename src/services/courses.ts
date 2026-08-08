import { z } from "zod";
import { supabase } from "../lib/supabase";
import { courseSchema, uuidSchema, type Course } from "./schemas";
import { throwIfError } from "./shared";

export async function getCourses(): Promise<Course[]> {
  const { data, error } = await supabase.from("courses").select("*").order("name");
  throwIfError("Unable to load courses", error);
  return z.array(courseSchema).parse(data);
}

export async function createCourse(name: string, location: string): Promise<string> {
  const { data, error } = await supabase.rpc("create_course", {
    p_name: name,
    p_location: location,
  });
  throwIfError("Unable to create course", error);
  return uuidSchema.parse(data);
}

export async function updateCourse(
  courseId: string,
  name: string,
  location: string,
): Promise<Course> {
  const { data, error } = await supabase.rpc("update_course", {
    p_course_id: courseId,
    p_name: name,
    p_location: location,
  });
  throwIfError("Unable to update course", error);
  return courseSchema.parse(data);
}
