import { z } from "zod";

const publicEnvSchema = z.object({
  VITE_SUPABASE_URL: z.string().url("VITE_SUPABASE_URL must be a valid URL."),
  VITE_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "VITE_SUPABASE_ANON_KEY is required."),
});

const parsedPublicEnv = publicEnvSchema.safeParse(import.meta.env);

export const frontendConfigurationError = parsedPublicEnv.success
  ? null
  : parsedPublicEnv.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("\n");

export const publicEnv = parsedPublicEnv.success
  ? parsedPublicEnv.data
  : {
      VITE_SUPABASE_URL: "https://invalid.local",
      VITE_SUPABASE_ANON_KEY: "invalid-configuration",
    };

export const adminAccessCode = import.meta.env.VITE_ADMIN_ACCESS_CODE?.trim() ?? "";
