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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      conversations: {
        Row: {
          context_summary: string | null
          created_at: string
          destination: string | null
          id: string
          last_message_at: string | null
          status: string
          title: string | null
          total_tokens_used: number
          travel_dates: Json | null
          trip_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          context_summary?: string | null
          created_at?: string
          destination?: string | null
          id?: string
          last_message_at?: string | null
          status?: string
          title?: string | null
          total_tokens_used?: number
          travel_dates?: Json | null
          trip_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          context_summary?: string | null
          created_at?: string
          destination?: string | null
          id?: string
          last_message_at?: string | null
          status?: string
          title?: string | null
          total_tokens_used?: number
          travel_dates?: Json | null
          trip_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      episodic_memories: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string
          destination: string | null
          id: string
          is_processed: boolean
          memory_type: string
          metadata: Json
          processed_at: string | null
          trip_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string
          destination?: string | null
          id?: string
          is_processed?: boolean
          memory_type: string
          metadata?: Json
          processed_at?: string | null
          trip_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string
          destination?: string | null
          id?: string
          is_processed?: boolean
          memory_type?: string
          metadata?: Json
          processed_at?: string | null
          trip_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "episodic_memories_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "episodic_memories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          injected_memory_ids: string[] | null
          input_tokens: number | null
          is_flagged: boolean
          output_tokens: number | null
          role: string
          tool_input: Json | null
          tool_name: string | null
          tool_result: Json | null
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          injected_memory_ids?: string[] | null
          input_tokens?: number | null
          is_flagged?: boolean
          output_tokens?: number | null
          role: string
          tool_input?: Json | null
          tool_name?: string | null
          tool_result?: Json | null
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          injected_memory_ids?: string[] | null
          input_tokens?: number | null
          is_flagged?: boolean
          output_tokens?: number | null
          role?: string
          tool_input?: Json | null
          tool_name?: string | null
          tool_result?: Json | null
          user_id?: string
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
            foreignKeyName: "messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_snapshots: {
        Row: {
          created_at: string
          id: string
          profile_version: number
          snapshot: Json
          trigger_event: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_version: number
          snapshot: Json
          trigger_event?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_version?: number
          snapshot?: Json
          trigger_event?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      semantic_memories: {
        Row: {
          confidence_score: number | null
          created_at: string
          destination: string | null
          embedding: string | null
          id: string
          is_stale: boolean
          last_retrieved_at: string | null
          source_episodic_ids: string[]
          summary: string
          times_retrieved: number
          topic_tags: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          destination?: string | null
          embedding?: string | null
          id?: string
          is_stale?: boolean
          last_retrieved_at?: string | null
          source_episodic_ids?: string[]
          summary: string
          times_retrieved?: number
          topic_tags?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          destination?: string | null
          embedding?: string | null
          id?: string
          is_stale?: boolean
          last_retrieved_at?: string | null
          source_episodic_ids?: string[]
          summary?: string
          times_retrieved?: number
          topic_tags?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "semantic_memories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      traveler_profiles: {
        Row: {
          archetype_scores: Json
          attributes: Json
          created_at: string
          id: string
          last_enriched_at: string | null
          onboarding_completed: boolean
          primary_archetype: string | null
          profile_version: number
          secondary_archetype: string | null
          updated_at: string
          user_id: string
          visited_destinations: Json
          wishlist_destinations: Json
        }
        Insert: {
          archetype_scores?: Json
          attributes?: Json
          created_at?: string
          id?: string
          last_enriched_at?: string | null
          onboarding_completed?: boolean
          primary_archetype?: string | null
          profile_version?: number
          secondary_archetype?: string | null
          updated_at?: string
          user_id: string
          visited_destinations?: Json
          wishlist_destinations?: Json
        }
        Update: {
          archetype_scores?: Json
          attributes?: Json
          created_at?: string
          id?: string
          last_enriched_at?: string | null
          onboarding_completed?: boolean
          primary_archetype?: string | null
          profile_version?: number
          secondary_archetype?: string | null
          updated_at?: string
          user_id?: string
          visited_destinations?: Json
          wishlist_destinations?: Json
        }
        Relationships: [
          {
            foreignKeyName: "traveler_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_facts: {
        Row: {
          category: string
          created_at: string
          fact: string
          id: string
          is_active: boolean
          sentiment: string
          source_conversation_id: string | null
          source_message_id: string | null
          source_quote: string | null
          superseded_by: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          fact: string
          id?: string
          is_active?: boolean
          sentiment?: string
          source_conversation_id?: string | null
          source_message_id?: string | null
          source_quote?: string | null
          superseded_by?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          fact?: string
          id?: string
          is_active?: boolean
          sentiment?: string
          source_conversation_id?: string | null
          source_message_id?: string | null
          source_quote?: string | null
          superseded_by?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_facts_source_conversation_id_fkey"
            columns: ["source_conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_facts_source_message_id_fkey"
            columns: ["source_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_facts_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "user_facts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_facts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          clerk_user_id: string
          created_at: string
          display_name: string | null
          email: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          clerk_user_id: string
          created_at?: string
          display_name?: string | null
          email: string
          id?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          clerk_user_id?: string
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string
          email: string | null
          id: number
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: number
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clerk_user_id: { Args: never; Returns: string }
      search_semantic_memories: {
        Args: {
          p_destination?: string
          p_embedding: string
          p_match_count?: number
          p_match_threshold?: number
          p_topic_tags?: string[]
          p_user_id: string
        }
        Returns: {
          created_at: string
          destination: string
          id: string
          similarity: number
          summary: string
          topic_tags: string[]
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
