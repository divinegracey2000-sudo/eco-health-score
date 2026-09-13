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
      audits: {
        Row: {
          created_at: string
          domain: string
          grade: string | null
          health: string | null
          id: string
          public_token: string
          published_at: string | null
          published_score: number | null
          raw_evidence_score: number | null
          result: Json | null
          review_deadline: string
          score_method: string | null
          status: string
          store_name: string | null
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          domain: string
          grade?: string | null
          health?: string | null
          id?: string
          public_token: string
          published_at?: string | null
          published_score?: number | null
          raw_evidence_score?: number | null
          result?: Json | null
          review_deadline?: string
          score_method?: string | null
          status?: string
          store_name?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          domain?: string
          grade?: string | null
          health?: string | null
          id?: string
          public_token?: string
          published_at?: string | null
          published_score?: number | null
          raw_evidence_score?: number | null
          result?: Json | null
          review_deadline?: string
          score_method?: string | null
          status?: string
          store_name?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      enterprise_score_benchmarks: {
        Row: {
          created_at: string
          domain: string
          id: string
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
        }
        Relationships: []
      }
      merchant_toolkit_services: {
        Row: {
          created_at: string
          description: string | null
          id: string
          last_verified_at: string
          name: string
          slug: string
          tags: string[]
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          last_verified_at?: string
          name: string
          slug: string
          tags?: string[]
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          last_verified_at?: string
          name?: string
          slug?: string
          tags?: string[]
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      merchant_toolkit_sync_state: {
        Row: {
          id: boolean
          last_attempt_at: string | null
          last_error: string | null
          last_success_at: string | null
          service_count: number
        }
        Insert: {
          id?: boolean
          last_attempt_at?: string | null
          last_error?: string | null
          last_success_at?: string | null
          service_count?: number
        }
        Update: {
          id?: boolean
          last_attempt_at?: string | null
          last_error?: string | null
          last_success_at?: string | null
          service_count?: number
        }
        Relationships: []
      }
      store_overrides: {
        Row: {
          conversion_potential: number | null
          created_at: string
          created_by: string | null
          critical_issues: number | null
          domain: string
          grade: string | null
          health: string | null
          id: string
          marketing_score: number | null
          opportunities: number | null
          overall_score: number | null
          performance_score: number | null
          retention_score: number | null
          seo_score: number | null
          setup_score: number | null
          store_name: string | null
          total_issues: number | null
          updated_at: string
          warnings: number | null
        }
        Insert: {
          conversion_potential?: number | null
          created_at?: string
          created_by?: string | null
          critical_issues?: number | null
          domain: string
          grade?: string | null
          health?: string | null
          id?: string
          marketing_score?: number | null
          opportunities?: number | null
          overall_score?: number | null
          performance_score?: number | null
          retention_score?: number | null
          seo_score?: number | null
          setup_score?: number | null
          store_name?: string | null
          total_issues?: number | null
          updated_at?: string
          warnings?: number | null
        }
        Update: {
          conversion_potential?: number | null
          created_at?: string
          created_by?: string | null
          critical_issues?: number | null
          domain?: string
          grade?: string | null
          health?: string | null
          id?: string
          marketing_score?: number | null
          opportunities?: number | null
          overall_score?: number | null
          performance_score?: number | null
          retention_score?: number | null
          seo_score?: number | null
          setup_score?: number | null
          store_name?: string | null
          total_issues?: number | null
          updated_at?: string
          warnings?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_delete_store_override: {
        Args: { _domain: string; _secret: string }
        Returns: undefined
      }
      admin_list_store_overrides: {
        Args: { _secret: string }
        Returns: {
          conversion_potential: number | null
          created_at: string
          created_by: string | null
          critical_issues: number | null
          domain: string
          grade: string | null
          health: string | null
          id: string
          marketing_score: number | null
          opportunities: number | null
          overall_score: number | null
          performance_score: number | null
          retention_score: number | null
          seo_score: number | null
          setup_score: number | null
          store_name: string | null
          total_issues: number | null
          updated_at: string
          warnings: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "store_overrides"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_upsert_store_override: {
        Args: { _row: Json; _secret: string }
        Returns: {
          conversion_potential: number | null
          created_at: string
          created_by: string | null
          critical_issues: number | null
          domain: string
          grade: string | null
          health: string | null
          id: string
          marketing_score: number | null
          opportunities: number | null
          overall_score: number | null
          performance_score: number | null
          retention_score: number | null
          seo_score: number | null
          setup_score: number | null
          store_name: string | null
          total_issues: number | null
          updated_at: string
          warnings: number | null
        }
        SetofOptions: {
          from: "*"
          to: "store_overrides"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      grade_for_score: { Args: { _score: number }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      health_for_score: { Args: { _score: number }; Returns: string }
      publish_due_audits: { Args: never; Returns: number }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
