import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "./env";
import type { Database } from "../types/database";

export const supabase = createClient<Database>(
  publicEnv.VITE_SUPABASE_URL,
  publicEnv.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  },
);
