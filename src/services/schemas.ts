import { z } from "zod";

export const uuidSchema = z.string().uuid();
export const timestampSchema = z.string().datetime({ offset: true });

export const playerSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1),
  elo_rating: z.number().int().positive(),
  elo_peak: z.number().int().positive(),
  created_at: timestampSchema,
  updated_at: timestampSchema,
});

export const courseSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1),
  location: z.string().min(1),
  created_at: timestampSchema,
  updated_at: timestampSchema,
});

export const leaderboardEntrySchema = z.object({
  rank: z.number().int().positive(),
  player_id: uuidSchema,
  player_name: z.string().min(1),
  elo_rating: z.number().int().positive(),
  elo_peak: z.number().int().positive(),
  matches: z.number().int().nonnegative(),
  wins: z.number().int().nonnegative(),
  losses: z.number().int().nonnegative(),
  pushes: z.number().int().nonnegative(),
  win_percentage: z.number().min(0).max(100),
});

export type Player = z.infer<typeof playerSchema>;
export type Course = z.infer<typeof courseSchema>;
export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;
