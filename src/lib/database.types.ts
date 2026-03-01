export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      clubs: {
        Row: {
          city: string | null
          created_at: string | null
          description: string | null
          description_ka: string | null
          id: string
          logo_url: string | null
          name: string
          name_ka: string
          region: string | null
          slug: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          description?: string | null
          description_ka?: string | null
          id?: string
          logo_url?: string | null
          name: string
          name_ka: string
          region?: string | null
          slug: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          description?: string | null
          description_ka?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          name_ka?: string
          region?: string | null
          slug?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      contact_requests: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          message: string
          player_id: string | null
          responded_at: string | null
          responded_by: string | null
          response_message: string | null
          scout_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          message: string
          player_id?: string | null
          responded_at?: string | null
          responded_by?: string | null
          response_message?: string | null
          scout_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          message?: string
          player_id?: string | null
          responded_at?: string | null
          responded_by?: string | null
          response_message?: string | null
          scout_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_requests_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_requests_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_requests_scout_id_fkey"
            columns: ["scout_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_blocks: {
        Row: {
          blocked_by: string
          conversation_id: string
          created_at: string | null
          id: string
          reason: string | null
        }
        Insert: {
          blocked_by: string
          conversation_id: string
          created_at?: string | null
          id?: string
          reason?: string | null
        }
        Update: {
          blocked_by?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_blocks_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_blocks_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          club_id: string
          created_at: string | null
          id: string
          last_message_at: string | null
          scout_id: string
          updated_at: string | null
        }
        Insert: {
          club_id: string
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          scout_id: string
          updated_at?: string | null
        }
        Update: {
          club_id?: string
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          scout_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_scout_id_fkey"
            columns: ["scout_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      match_player_stats: {
        Row: {
          assists: number | null
          created_at: string | null
          distance_km: number | null
          goals: number | null
          heat_map_data: Json | null
          id: string
          interceptions: number | null
          match_id: string | null
          minutes_played: number | null
          pass_accuracy: number | null
          player_id: string | null
          rating: number | null
          shots: number | null
          shots_on_target: number | null
          source: string
          sprints: number | null
          tackles: number | null
          top_speed_kmh: number | null
        }
        Insert: {
          assists?: number | null
          created_at?: string | null
          distance_km?: number | null
          goals?: number | null
          heat_map_data?: Json | null
          id?: string
          interceptions?: number | null
          match_id?: string | null
          minutes_played?: number | null
          pass_accuracy?: number | null
          player_id?: string | null
          rating?: number | null
          shots?: number | null
          shots_on_target?: number | null
          source: string
          sprints?: number | null
          tackles?: number | null
          top_speed_kmh?: number | null
        }
        Update: {
          assists?: number | null
          created_at?: string | null
          distance_km?: number | null
          goals?: number | null
          heat_map_data?: Json | null
          id?: string
          interceptions?: number | null
          match_id?: string | null
          minutes_played?: number | null
          pass_accuracy?: number | null
          player_id?: string | null
          rating?: number | null
          shots?: number | null
          shots_on_target?: number | null
          source?: string
          sprints?: number | null
          tackles?: number | null
          top_speed_kmh?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "match_player_stats_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          away_club_id: string | null
          away_score: number | null
          camera_source: string | null
          competition: string | null
          created_at: string | null
          external_event_id: string | null
          highlights_url: string | null
          home_club_id: string | null
          home_score: number | null
          id: string
          match_date: string
          match_report: string | null
          match_report_ka: string | null
          slug: string
          venue: string | null
          video_url: string | null
        }
        Insert: {
          away_club_id?: string | null
          away_score?: number | null
          camera_source?: string | null
          competition?: string | null
          created_at?: string | null
          external_event_id?: string | null
          highlights_url?: string | null
          home_club_id?: string | null
          home_score?: number | null
          id?: string
          match_date: string
          match_report?: string | null
          match_report_ka?: string | null
          slug: string
          venue?: string | null
          video_url?: string | null
        }
        Update: {
          away_club_id?: string | null
          away_score?: number | null
          camera_source?: string | null
          competition?: string | null
          created_at?: string | null
          external_event_id?: string | null
          highlights_url?: string | null
          home_club_id?: string | null
          home_score?: number | null
          id?: string
          match_date?: string
          match_report?: string | null
          match_report_ka?: string | null
          slug?: string
          venue?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_club_id_fkey"
            columns: ["away_club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_club_id_fkey"
            columns: ["home_club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string | null

          file_name: string | null
          file_size_bytes: number | null
          file_type: string | null
          file_url: string | null
          id: string
          message_type: Database["public"]["Enums"]["message_type"]
          read_at: string | null
          referenced_player_id: string | null
          sender_id: string | null
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string | null

          file_name?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          message_type?: Database["public"]["Enums"]["message_type"]
          read_at?: string | null
          referenced_player_id?: string | null
          sender_id?: string | null
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string | null

          file_name?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          message_type?: Database["public"]["Enums"]["message_type"]
          read_at?: string | null
          referenced_player_id?: string | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_referenced_player_id_fkey"
            columns: ["referenced_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      page_views: {
        Row: {
          entity_id: string | null
          entity_slug: string | null
          id: string
          page_type: string
          viewed_at: string | null
        }
        Insert: {
          entity_id?: string | null
          entity_slug?: string | null
          id?: string
          page_type: string
          viewed_at?: string | null
        }
        Update: {
          entity_id?: string | null
          entity_slug?: string | null
          id?: string
          page_type?: string
          viewed_at?: string | null
        }
        Relationships: []
      }
      player_club_history: {
        Row: {
          club_id: string | null
          id: string
          joined_at: string
          left_at: string | null
          player_id: string
        }
        Insert: {
          club_id?: string | null
          id?: string
          joined_at?: string
          left_at?: string | null
          player_id: string
        }
        Update: {
          club_id?: string | null
          id?: string
          joined_at?: string
          left_at?: string | null
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_club_history_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_club_history_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_season_stats: {
        Row: {
          assists: number | null
          clean_sheets: number | null
          created_at: string | null
          distance_covered_km: number | null
          goals: number | null
          id: string
          interceptions: number | null
          matches_played: number | null
          minutes_played: number | null
          pass_accuracy: number | null
          player_id: string | null
          season: string
          shots_on_target: number | null
          source: string
          sprints: number | null
          tackles: number | null
        }
        Insert: {
          assists?: number | null
          clean_sheets?: number | null
          created_at?: string | null
          distance_covered_km?: number | null
          goals?: number | null
          id?: string
          interceptions?: number | null
          matches_played?: number | null
          minutes_played?: number | null
          pass_accuracy?: number | null
          player_id?: string | null
          season: string
          shots_on_target?: number | null
          source: string
          sprints?: number | null
          tackles?: number | null
        }
        Update: {
          assists?: number | null
          clean_sheets?: number | null
          created_at?: string | null
          distance_covered_km?: number | null
          goals?: number | null
          id?: string
          interceptions?: number | null
          matches_played?: number | null
          minutes_played?: number | null
          pass_accuracy?: number | null
          player_id?: string | null
          season?: string
          shots_on_target?: number | null
          source?: string
          sprints?: number | null
          tackles?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_season_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_skills: {
        Row: {
          defending: number | null
          dribbling: number | null
          id: string
          pace: number | null
          passing: number | null
          physical: number | null
          player_id: string | null
          shooting: number | null
          updated_at: string | null
        }
        Insert: {
          defending?: number | null
          dribbling?: number | null
          id?: string
          pace?: number | null
          passing?: number | null
          physical?: number | null
          player_id?: string | null
          shooting?: number | null
          updated_at?: string | null
        }
        Update: {
          defending?: number | null
          dribbling?: number | null
          id?: string
          pace?: number | null
          passing?: number | null
          physical?: number | null
          player_id?: string | null
          shooting?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_skills_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_videos: {
        Row: {
          created_at: string | null
          duration_seconds: number | null
          id: string
          match_id: string | null
          player_id: string | null
          title: string
          url: string
          video_type: string | null
        }
        Insert: {
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          match_id?: string | null
          player_id?: string | null
          title: string
          url: string
          video_type?: string | null
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          match_id?: string | null
          player_id?: string | null
          title?: string
          url?: string
          video_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_videos_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_videos_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_views: {
        Row: {
          id: string
          player_id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          id?: string
          player_id: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          id?: string
          player_id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_views_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          club_id: string | null
          created_at: string | null
          date_of_birth: string
          height_cm: number | null
          id: string
          is_featured: boolean | null
          jersey_number: number | null
          name: string
          name_ka: string
          nationality: string | null
          parent_guardian_contact: string | null
          photo_url: string | null
          platform_id: string
          position: string
          preferred_foot: string | null
          scouting_report: string | null
          scouting_report_ka: string | null
          slug: string
          status: Database["public"]["Enums"]["player_status"] | null
          updated_at: string | null
          weight_kg: number | null
        }
        Insert: {
          club_id?: string | null
          created_at?: string | null
          date_of_birth: string
          height_cm?: number | null
          id?: string
          is_featured?: boolean | null
          jersey_number?: number | null
          name: string
          name_ka: string
          nationality?: string | null
          parent_guardian_contact?: string | null
          photo_url?: string | null
          platform_id?: string
          position: string
          preferred_foot?: string | null
          scouting_report?: string | null
          scouting_report_ka?: string | null
          slug: string
          status?: Database["public"]["Enums"]["player_status"] | null
          updated_at?: string | null
          weight_kg?: number | null
        }
        Update: {
          club_id?: string | null
          created_at?: string | null
          date_of_birth?: string
          height_cm?: number | null
          id?: string
          is_featured?: boolean | null
          jersey_number?: number | null
          name?: string
          name_ka?: string
          nationality?: string | null
          parent_guardian_contact?: string | null
          photo_url?: string | null
          platform_id?: string
          position?: string
          preferred_foot?: string | null
          scouting_report?: string | null
          scouting_report_ka?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["player_status"] | null
          updated_at?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "players_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          club_id: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          organization: string | null
          phone: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          club_id?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          organization?: string | null
          phone?: string | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          club_id?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          organization?: string | null
          phone?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      shortlists: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          player_id: string | null
          scout_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          player_id?: string | null
          scout_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          player_id?: string | null
          scout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shortlists_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shortlists_scout_id_fkey"
            columns: ["scout_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transfer_requests: {
        Row: {
          expires_at: string
          from_club_id: string | null
          id: string
          player_id: string
          requested_at: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["transfer_status"]
          to_club_id: string | null
        }
        Insert: {
          expires_at?: string
          from_club_id?: string | null
          id?: string
          player_id: string
          requested_at?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["transfer_status"]
          to_club_id?: string | null
        }
        Update: {
          expires_at?: string
          from_club_id?: string | null
          id?: string
          player_id?: string
          requested_at?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["transfer_status"]
          to_club_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transfer_requests_from_club_id_fkey"
            columns: ["from_club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfer_requests_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfer_requests_to_club_id_fkey"
            columns: ["to_club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_conversations_with_metadata: {
        Args: { p_user_id: string }
        Returns: {
          id: string
          scout_id: string
          club_id: string
          last_message_at: string | null
          created_at: string | null
          club_name: string | null
          club_name_ka: string | null
          club_logo_url: string | null
          scout_full_name: string | null
          scout_email: string | null
          scout_organization: string | null
          scout_role: string | null
          last_message_content: string | null
          last_message_type: string | null
          last_message_sender_id: string | null
          last_message_created_at: string | null
          unread_count: number
          is_blocked: boolean
        }[]
      }
      get_player_view_counts: {
        Args: { player_ids?: string[] }
        Returns: {
          player_id: string
          prev_week_views: number
          total_views: number
          weekly_views: number
        }[]
      }
      get_total_unread_count: { Args: never; Returns: number }
      get_user_club_id: { Args: never; Returns: string }
      get_user_role: { Args: never; Returns: string }
      mark_messages_read: {
        Args: { p_conversation_id: string }
        Returns: undefined
      }
    }
    Enums: {
      message_type: "text" | "file" | "player_ref" | "system"
      player_status: "active" | "free_agent"
      transfer_status: "pending" | "accepted" | "declined" | "expired"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      message_type: ["text", "file", "player_ref", "system"],
      player_status: ["active", "free_agent"],
      transfer_status: ["pending", "accepted", "declined", "expired"],
    },
  },
} as const
