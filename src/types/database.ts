export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type MatchResult = Database["public"]["Enums"]["match_result"];
type ScoreType = Database["public"]["Enums"]["score_type"];

export interface Database {
  public: {
    Tables: {
      elo_settings: {
        Row: {
          id: boolean;
          initial_rating: number;
          k_factor: number;
          updated_at: string;
        };
        Insert: {
          id?: boolean;
          initial_rating?: number;
          k_factor?: number;
          updated_at?: string;
        };
        Update: {
          id?: boolean;
          initial_rating?: number;
          k_factor?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      players: {
        Row: {
          id: string;
          name: string;
          elo_rating: number;
          elo_peak: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          elo_rating?: number;
          elo_peak?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          elo_rating?: number;
          elo_peak?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      courses: {
        Row: {
          id: string;
          name: string;
          location: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          location: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          location?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      matches: {
        Row: {
          id: string;
          date: string;
          course_id: string;
          holes: number;
          team_size: number;
          score_type: ScoreType;
          score_value: number | null;
          holes_remaining: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          date?: string;
          course_id: string;
          holes: number;
          team_size: number;
          score_type: ScoreType;
          score_value?: number | null;
          holes_remaining?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          course_id?: string;
          holes?: number;
          team_size?: number;
          score_type?: ScoreType;
          score_value?: number | null;
          holes_remaining?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "matches_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      match_teams: {
        Row: {
          id: string;
          match_id: string;
          team_number: number;
          result: MatchResult;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          team_number: number;
          result: MatchResult;
          created_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          team_number?: number;
          result?: MatchResult;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "match_teams_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
        ];
      };
      match_team_players: {
        Row: {
          id: string;
          match_team_id: string;
          match_id: string;
          player_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_team_id: string;
          match_id: string;
          player_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          match_team_id?: string;
          match_id?: string;
          player_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "match_team_players_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "match_team_players_match_team_id_fkey";
            columns: ["match_team_id"];
            isOneToOne: false;
            referencedRelation: "match_teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "match_team_players_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
        ];
      };
      player_ratings: {
        Row: {
          id: string;
          player_id: string;
          match_id: string;
          match_team_id: string;
          rating_before: number;
          rating_after: number;
          rating_change: number;
          team_rating: number;
          opponent_team_rating: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          match_id: string;
          match_team_id: string;
          rating_before: number;
          rating_after: number;
          rating_change: number;
          team_rating: number;
          opponent_team_rating: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          match_id?: string;
          match_team_id?: string;
          rating_before?: number;
          rating_after?: number;
          rating_change?: number;
          team_rating?: number;
          opponent_team_rating?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "player_ratings_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "player_ratings_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "player_ratings_match_team_id_fkey";
            columns: ["match_team_id"];
            isOneToOne: false;
            referencedRelation: "match_teams";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      leaderboard: {
        Row: {
          rank: number | null;
          player_id: string | null;
          player_name: string | null;
          elo_rating: number | null;
          elo_peak: number | null;
          matches: number | null;
          wins: number | null;
          losses: number | null;
          pushes: number | null;
          win_percentage: number | null;
        };
        Relationships: [];
      };
      player_records: {
        Row: {
          player_id: string | null;
          matches: number | null;
          wins: number | null;
          losses: number | null;
          pushes: number | null;
          win_percentage: number | null;
        };
        Relationships: [];
      };
      player_course_records: {
        Row: {
          player_id: string | null;
          course_id: string | null;
          course_name: string | null;
          matches: number | null;
          wins: number | null;
          losses: number | null;
          pushes: number | null;
          win_percentage: number | null;
          elo_change: number | null;
        };
        Relationships: [];
      };
      player_partnerships: {
        Row: {
          player_id: string | null;
          partner_id: string | null;
          player_name: string | null;
          partner_name: string | null;
          matches: number | null;
          wins: number | null;
          losses: number | null;
          pushes: number | null;
          win_percentage: number | null;
        };
        Relationships: [];
      };
      player_head_to_head: {
        Row: {
          player_id: string | null;
          opponent_id: string | null;
          player_name: string | null;
          opponent_name: string | null;
          matches: number | null;
          wins: number | null;
          losses: number | null;
          pushes: number | null;
          win_percentage: number | null;
        };
        Relationships: [];
      };
      player_match_history: {
        Row: {
          match_id: string | null;
          player_id: string | null;
          date: string | null;
          course_id: string | null;
          course_name: string | null;
          holes: number | null;
          team_size: number | null;
          player_result: MatchResult | null;
          score_type: ScoreType | null;
          score_value: number | null;
          holes_remaining: number | null;
          elo_before: number | null;
          elo_after: number | null;
          elo_change: number | null;
        };
        Relationships: [];
      };
      player_elo_history: {
        Row: {
          player_id: string | null;
          match_id: string | null;
          date: string | null;
          course_name: string | null;
          rating_before: number | null;
          rating_after: number | null;
          rating_change: number | null;
        };
        Relationships: [];
      };
      match_summary: {
        Row: {
          match_id: string | null;
          date: string | null;
          course_id: string | null;
          course_name: string | null;
          holes: number | null;
          team_size: number | null;
          score: string | null;
          team_1_result: MatchResult | null;
          team_2_result: MatchResult | null;
          team_1_players: Json | null;
          team_2_players: Json | null;
        };
        Relationships: [];
      };
      match_analytics: {
        Row: {
          match_id: string | null;
          date: string | null;
          course_id: string | null;
          holes: number | null;
          team_size: number | null;
          team_1_rating: number | null;
          team_2_rating: number | null;
          rating_difference: number | null;
          winning_team_rating: number | null;
          losing_team_rating: number | null;
          upset_margin: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      calculate_elo_expected: {
        Args: { rating_a: number; rating_b: number };
        Returns: number;
      };
      get_result_value: {
        Args: { result: MatchResult };
        Returns: number;
      };
      format_match_score: {
        Args: {
          score_type: ScoreType;
          score_value: number | null;
          holes_remaining: number | null;
        };
        Returns: string;
      };
      create_player: {
        Args: { p_name: string };
        Returns: string;
      };
      update_player: {
        Args: { p_player_id: string; p_name: string };
        Returns: Database["public"]["Tables"]["players"]["Row"];
      };
      create_course: {
        Args: { p_name: string; p_location: string };
        Returns: string;
      };
      update_course: {
        Args: { p_course_id: string; p_name: string; p_location: string };
        Returns: Database["public"]["Tables"]["courses"]["Row"];
      };
      record_match: {
        Args: MatchMutationArgs;
        Returns: string;
      };
      update_match: {
        Args: MatchMutationArgs & { p_match_id: string };
        Returns: string;
      };
      delete_match: {
        Args: { p_match_id: string };
        Returns: undefined;
      };
      recalculate_all_elo: {
        Args: never;
        Returns: {
          players_processed: number;
          matches_processed: number;
        }[];
      };
      get_player_stats: {
        Args: {
          p_player_id: string;
          p_course_id?: string | null;
          p_partner_id?: string | null;
          p_opponent_id?: string | null;
          p_holes?: number | null;
          p_team_size?: number | null;
          p_start_date?: string | null;
          p_end_date?: string | null;
        };
        Returns: PlayerStatsRow[];
      };
      get_player_overview: {
        Args: { p_player_id: string };
        Returns: PlayerOverviewRow[];
      };
    };
    Enums: {
      match_result: "WIN" | "LOSS" | "PUSH";
      score_type: "UP" | "HOLES_UP" | "PUSH";
    };
    CompositeTypes: Record<never, never>;
  };
}

type MatchMutationArgs = {
  p_date: string;
  p_course_id: string;
  p_holes: number;
  p_team_size: number;
  p_score_type: ScoreType;
  p_score_value: number | null;
  p_holes_remaining: number | null;
  p_team_1_player_ids: string[];
  p_team_2_player_ids: string[];
  p_team_1_result: MatchResult;
  p_team_2_result: MatchResult;
};

type PlayerStatsRow = {
  matches: number;
  wins: number;
  losses: number;
  pushes: number;
  win_percentage: number;
  elo_change: number;
};

type PlayerOverviewRow = {
  player_id: string;
  name: string;
  current_elo: number;
  peak_elo: number;
  matches: number;
  wins: number;
  losses: number;
  pushes: number;
  win_percentage: number;
  elo_change_last_5: number;
  elo_change_last_10: number;
  elo_change_last_25: number;
};

export type TableRow<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type ViewRow<T extends keyof Database["public"]["Views"]> =
  Database["public"]["Views"][T]["Row"];
export type MatchResultValue = MatchResult;
export type ScoreTypeValue = ScoreType;
