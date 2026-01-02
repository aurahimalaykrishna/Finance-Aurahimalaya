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
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          new_values: Json | null
          old_values: Json | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          account_name: string
          account_number: string | null
          account_type: string | null
          bank_name: string | null
          company_id: string | null
          created_at: string | null
          currency: string | null
          current_balance: number | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_name: string
          account_number?: string | null
          account_type?: string | null
          bank_name?: string | null
          company_id?: string | null
          created_at?: string | null
          currency?: string | null
          current_balance?: number | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_name?: string
          account_number?: string | null
          account_type?: string | null
          bank_name?: string | null
          company_id?: string | null
          created_at?: string | null
          currency?: string | null
          current_balance?: number | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_statements: {
        Row: {
          amount: number
          bank_account_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_matched: boolean | null
          matched_transaction_id: string | null
          reference_number: string | null
          running_balance: number | null
          statement_date: string
          transaction_type: string | null
          user_id: string
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_matched?: boolean | null
          matched_transaction_id?: string | null
          reference_number?: string | null
          running_balance?: number | null
          statement_date: string
          transaction_type?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_matched?: boolean | null
          matched_transaction_id?: string | null
          reference_number?: string | null
          running_balance?: number | null
          statement_date?: string
          transaction_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_statements_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_statements_matched_transaction_id_fkey"
            columns: ["matched_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          amount: number
          category_id: string
          company_id: string | null
          created_at: string | null
          end_date: string | null
          id: string
          period: string
          start_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category_id: string
          company_id?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          period?: string
          start_date: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string
          company_id?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          period?: string
          start_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          company_id: string | null
          created_at: string | null
          icon: string | null
          id: string
          name: string
          parent_id: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          color?: string | null
          company_id?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          color?: string | null
          company_id?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          created_at: string | null
          currency: string | null
          favicon_url: string | null
          fiscal_year_start: number | null
          id: string
          is_default: boolean | null
          logo_url: string | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          currency?: string | null
          favicon_url?: string | null
          fiscal_year_start?: number | null
          id?: string
          is_default?: boolean | null
          logo_url?: string | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string | null
          currency?: string | null
          favicon_url?: string | null
          fiscal_year_start?: number | null
          id?: string
          is_default?: boolean | null
          logo_url?: string | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      company_access: {
        Row: {
          company_id: string
          created_at: string | null
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_access_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          business_name: string | null
          created_at: string | null
          currency: string | null
          department: string | null
          email: string | null
          fiscal_year_start: number | null
          full_name: string | null
          id: string
          is_active: boolean | null
          job_title: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          business_name?: string | null
          created_at?: string | null
          currency?: string | null
          department?: string | null
          email?: string | null
          fiscal_year_start?: number | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          job_title?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          business_name?: string | null
          created_at?: string | null
          currency?: string | null
          department?: string | null
          email?: string | null
          fiscal_year_start?: number | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          job_title?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reconciliation_sessions: {
        Row: {
          bank_account_id: string | null
          closing_balance: number
          company_id: string | null
          completed_at: string | null
          created_at: string | null
          difference: number | null
          end_date: string
          id: string
          matched_count: number | null
          opening_balance: number
          start_date: string
          status: string | null
          unmatched_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bank_account_id?: string | null
          closing_balance: number
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          difference?: number | null
          end_date: string
          id?: string
          matched_count?: number | null
          opening_balance: number
          start_date: string
          status?: string | null
          unmatched_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bank_account_id?: string | null
          closing_balance?: number
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          difference?: number | null
          end_date?: string
          id?: string
          matched_count?: number | null
          opening_balance?: number
          start_date?: string
          status?: string | null
          unmatched_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reconciliation_sessions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      statement_transaction_matches: {
        Row: {
          bank_statement_id: string
          created_at: string | null
          id: string
          transaction_id: string
          user_id: string
        }
        Insert: {
          bank_statement_id: string
          created_at?: string | null
          id?: string
          transaction_id: string
          user_id: string
        }
        Update: {
          bank_statement_id?: string
          created_at?: string | null
          id?: string
          transaction_id?: string
          user_id?: string
        }
        Relationships: []
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          company_id: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          company_id?: string | null
          created_at?: string | null
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
        }
        Update: {
          accepted_at?: string | null
          company_id?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_notes: {
        Row: {
          content: string
          created_at: string | null
          id: string
          transaction_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          transaction_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          transaction_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_notes_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_receipts: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          transaction_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          transaction_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          transaction_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_receipts_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          bank_statement_id: string | null
          category_id: string | null
          company_id: string | null
          created_at: string | null
          currency: string | null
          date: string
          description: string | null
          id: string
          is_reconciled: boolean | null
          reconciled_at: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          bank_statement_id?: string | null
          category_id?: string | null
          company_id?: string | null
          created_at?: string | null
          currency?: string | null
          date?: string
          description?: string | null
          id?: string
          is_reconciled?: boolean | null
          reconciled_at?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          bank_statement_id?: string | null
          category_id?: string | null
          company_id?: string | null
          created_at?: string | null
          currency?: string | null
          date?: string
          description?: string | null
          id?: string
          is_reconciled?: boolean | null
          reconciled_at?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_bank_statement_id_fkey"
            columns: ["bank_statement_id"]
            isOneToOne: false
            referencedRelation: "bank_statements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          granted_by?: string | null
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
      get_company_users: {
        Args: { _company_id: string }
        Returns: {
          created_at: string
          email: string
          granted_by: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }[]
      }
      get_team_members: {
        Args: { _owner_id: string }
        Returns: {
          created_at: string
          email: string
          granted_by: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }[]
      }
      get_user_companies: {
        Args: { _user_id: string }
        Returns: {
          access_role: Database["public"]["Enums"]["app_role"]
          address: string
          created_at: string
          currency: string
          favicon_url: string
          fiscal_year_start: number
          id: string
          is_default: boolean
          logo_url: string
          name: string
          updated_at: string
          user_id: string
        }[]
      }
      get_user_company_access: {
        Args: { _user_id: string }
        Returns: {
          company_id: string
          company_name: string
          created_at: string
          granted_by: string
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      get_user_company_role: {
        Args: { _company_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_company_access: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "admin" | "accountant" | "viewer"
      transaction_type: "income" | "expense"
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
      app_role: ["owner", "admin", "accountant", "viewer"],
      transaction_type: ["income", "expense"],
    },
  },
} as const
