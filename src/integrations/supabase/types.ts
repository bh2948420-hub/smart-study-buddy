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
      achievements: {
        Row: {
          created_at: string
          description: string
          description_ar: string
          icon: string
          id: string
          name: string
          name_ar: string
          points: number
          requirement_type: string
          requirement_value: number
        }
        Insert: {
          created_at?: string
          description: string
          description_ar: string
          icon: string
          id?: string
          name: string
          name_ar: string
          points?: number
          requirement_type: string
          requirement_value: number
        }
        Update: {
          created_at?: string
          description?: string
          description_ar?: string
          icon?: string
          id?: string
          name?: string
          name_ar?: string
          points?: number
          requirement_type?: string
          requirement_value?: number
        }
        Relationships: []
      }
      challenge_room_answers: {
        Row: {
          answer: string
          answered_at: string
          id: string
          is_correct: boolean
          question_index: number
          room_id: string
          user_id: string
        }
        Insert: {
          answer: string
          answered_at?: string
          id?: string
          is_correct?: boolean
          question_index: number
          room_id: string
          user_id: string
        }
        Update: {
          answer?: string
          answered_at?: string
          id?: string
          is_correct?: boolean
          question_index?: number
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_room_answers_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "challenge_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_rooms: {
        Row: {
          created_at: string
          current_question_index: number
          finished_at: string | null
          guest_display_name: string | null
          guest_score: number
          guest_user_id: string | null
          host_display_name: string | null
          host_score: number
          host_user_id: string
          id: string
          quiz_id: number | null
          room_code: string
          started_at: string | null
          status: string
          total_questions: number
        }
        Insert: {
          created_at?: string
          current_question_index?: number
          finished_at?: string | null
          guest_display_name?: string | null
          guest_score?: number
          guest_user_id?: string | null
          host_display_name?: string | null
          host_score?: number
          host_user_id: string
          id?: string
          quiz_id?: number | null
          room_code: string
          started_at?: string | null
          status?: string
          total_questions?: number
        }
        Update: {
          created_at?: string
          current_question_index?: number
          finished_at?: string | null
          guest_display_name?: string | null
          guest_score?: number
          guest_user_id?: string | null
          host_display_name?: string | null
          host_score?: number
          host_user_id?: string
          id?: string
          quiz_id?: number | null
          room_code?: string
          started_at?: string | null
          status?: string
          total_questions?: number
        }
        Relationships: [
          {
            foreignKeyName: "challenge_rooms_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_context: {
        Row: {
          content_text: string | null
          created_at: string
          file_name: string
          file_path: string
          id: number
          subject: string | null
          user_id: string
        }
        Insert: {
          content_text?: string | null
          created_at?: string
          file_name: string
          file_path: string
          id?: number
          subject?: string | null
          user_id: string
        }
        Update: {
          content_text?: string | null
          created_at?: string
          file_name?: string
          file_path?: string
          id?: number
          subject?: string | null
          user_id?: string
        }
        Relationships: []
      }
      daily_quiz_attempts: {
        Row: {
          created_at: string
          id: string
          quiz_date: string
          score: number
          time_spent_seconds: number | null
          total_questions: number
          user_id: string
          xp_earned: number
        }
        Insert: {
          created_at?: string
          id?: string
          quiz_date?: string
          score: number
          time_spent_seconds?: number | null
          total_questions?: number
          user_id: string
          xp_earned?: number
        }
        Update: {
          created_at?: string
          id?: string
          quiz_date?: string
          score?: number
          time_spent_seconds?: number | null
          total_questions?: number
          user_id?: string
          xp_earned?: number
        }
        Relationships: []
      }
      materials: {
        Row: {
          description: string | null
          file_name: string
          file_path: string
          file_type: string
          id: number
          subject: string | null
          uploaded_at: string
          user_id: string
        }
        Insert: {
          description?: string | null
          file_name: string
          file_path: string
          file_type: string
          id?: number
          subject?: string | null
          uploaded_at?: string
          user_id: string
        }
        Update: {
          description?: string | null
          file_name?: string
          file_path?: string
          file_type?: string
          id?: number
          subject?: string | null
          uploaded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          created_at: string
          id: number
          is_ai: boolean
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          is_ai?: boolean
          message: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          is_ai?: boolean
          message?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: number
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          correct_answer: string
          explanation: string | null
          id: number
          options: Json | null
          order_index: number
          question_text: string
          question_type: string
          quiz_id: number
        }
        Insert: {
          correct_answer: string
          explanation?: string | null
          id?: never
          options?: Json | null
          order_index?: number
          question_text: string
          question_type: string
          quiz_id: number
        }
        Update: {
          correct_answer?: string
          explanation?: string | null
          id?: never
          options?: Json | null
          order_index?: number
          question_text?: string
          question_type?: string
          quiz_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_results: {
        Row: {
          answers: Json | null
          completed_at: string
          id: number
          percentage: number
          quiz_id: number
          score: number
          time_spent_seconds: number | null
          total_questions: number
          user_id: string
        }
        Insert: {
          answers?: Json | null
          completed_at?: string
          id?: never
          percentage: number
          quiz_id: number
          score: number
          time_spent_seconds?: number | null
          total_questions: number
          user_id: string
        }
        Update: {
          answers?: Json | null
          completed_at?: string
          id?: never
          percentage?: number
          quiz_id?: number
          score?: number
          time_spent_seconds?: number | null
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_results_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          description: string | null
          difficulty: string | null
          id: number
          material_id: number | null
          subject: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty?: string | null
          id?: never
          material_id?: number | null
          subject?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty?: string | null
          id?: never
          material_id?: number | null
          subject?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      streak_freeze_history: {
        Row: {
          action_type: string
          created_at: string
          id: string
          user_id: string
          xp_spent: number | null
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          user_id: string
          xp_spent?: number | null
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          user_id?: string
          xp_spent?: number | null
        }
        Relationships: []
      }
      streak_recoveries: {
        Row: {
          id: string
          recovered_at: string
          recovered_streak: number
          user_id: string
          xp_spent: number
        }
        Insert: {
          id?: string
          recovered_at?: string
          recovered_streak: number
          user_id: string
          xp_spent: number
        }
        Update: {
          id?: string
          recovered_at?: string
          recovered_streak?: number
          user_id?: string
          xp_spent?: number
        }
        Relationships: []
      }
      study_insights: {
        Row: {
          average_quiz_score: number | null
          created_at: string
          id: number
          improvement_recommendations: string[] | null
          motivation_message: string | null
          strongest_subject: string | null
          study_pattern_analysis: string | null
          total_quizzes_completed: number | null
          total_study_minutes: number | null
          total_tasks_completed: number | null
          user_id: string
          weakest_subject: string | null
          week_end: string
          week_start: string
        }
        Insert: {
          average_quiz_score?: number | null
          created_at?: string
          id?: number
          improvement_recommendations?: string[] | null
          motivation_message?: string | null
          strongest_subject?: string | null
          study_pattern_analysis?: string | null
          total_quizzes_completed?: number | null
          total_study_minutes?: number | null
          total_tasks_completed?: number | null
          user_id: string
          weakest_subject?: string | null
          week_end: string
          week_start: string
        }
        Update: {
          average_quiz_score?: number | null
          created_at?: string
          id?: number
          improvement_recommendations?: string[] | null
          motivation_message?: string | null
          strongest_subject?: string | null
          study_pattern_analysis?: string | null
          total_quizzes_completed?: number | null
          total_study_minutes?: number | null
          total_tasks_completed?: number | null
          user_id?: string
          weakest_subject?: string | null
          week_end?: string
          week_start?: string
        }
        Relationships: []
      }
      study_schedule: {
        Row: {
          classroom: string | null
          created_at: string
          day_of_week: number
          end_time: string
          id: number
          notes: string | null
          start_time: string
          subject: string
          user_id: string
        }
        Insert: {
          classroom?: string | null
          created_at?: string
          day_of_week: number
          end_time: string
          id?: number
          notes?: string | null
          start_time: string
          subject: string
          user_id: string
        }
        Update: {
          classroom?: string | null
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: number
          notes?: string | null
          start_time?: string
          subject?: string
          user_id?: string
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          created_at: string
          duration_minutes: number | null
          end_time: string | null
          id: number
          start_time: string
          subject: string | null
          task_id: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          end_time?: string | null
          id?: number
          start_time?: string
          subject?: string | null
          task_id?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          end_time?: string | null
          id?: number
          start_time?: string
          subject?: string | null
          task_id?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          completed: boolean
          created_at: string
          description: string | null
          due_date: string
          id: number
          priority: string
          title: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          description?: string | null
          due_date: string
          id?: number
          priority?: string
          title: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          description?: string | null
          due_date?: string
          id?: number
          priority?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenge_progress: {
        Row: {
          challenge_id: string
          completed: boolean
          completed_at: string | null
          created_at: string
          current_value: number
          id: string
          updated_at: string
          user_id: string
          xp_claimed: boolean
        }
        Insert: {
          challenge_id: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_value?: number
          id?: string
          updated_at?: string
          user_id: string
          xp_claimed?: boolean
        }
        Update: {
          challenge_id?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_value?: number
          id?: string
          updated_at?: string
          user_id?: string
          xp_claimed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "user_challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "weekly_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          break_duration: number | null
          created_at: string
          dark_mode: boolean | null
          display_name: string | null
          id: number
          level: number | null
          notifications_enabled: boolean | null
          pomodoro_duration: number | null
          reminder_enabled: boolean | null
          reminder_time: string | null
          streak_days: number | null
          streak_freezes: number
          study_goal_minutes: number | null
          updated_at: string
          user_id: string
          xp_points: number | null
        }
        Insert: {
          avatar_url?: string | null
          break_duration?: number | null
          created_at?: string
          dark_mode?: boolean | null
          display_name?: string | null
          id?: number
          level?: number | null
          notifications_enabled?: boolean | null
          pomodoro_duration?: number | null
          reminder_enabled?: boolean | null
          reminder_time?: string | null
          streak_days?: number | null
          streak_freezes?: number
          study_goal_minutes?: number | null
          updated_at?: string
          user_id: string
          xp_points?: number | null
        }
        Update: {
          avatar_url?: string | null
          break_duration?: number | null
          created_at?: string
          dark_mode?: boolean | null
          display_name?: string | null
          id?: number
          level?: number | null
          notifications_enabled?: boolean | null
          pomodoro_duration?: number | null
          reminder_enabled?: boolean | null
          reminder_time?: string | null
          streak_days?: number | null
          streak_freezes?: number
          study_goal_minutes?: number | null
          updated_at?: string
          user_id?: string
          xp_points?: number | null
        }
        Relationships: []
      }
      weekly_challenges: {
        Row: {
          challenge_type: string
          created_at: string
          description: string
          description_ar: string
          icon: string
          id: string
          target_value: number
          title: string
          title_ar: string
          week_end: string
          week_start: string
          xp_reward: number
        }
        Insert: {
          challenge_type: string
          created_at?: string
          description: string
          description_ar: string
          icon?: string
          id?: string
          target_value: number
          title: string
          title_ar: string
          week_end: string
          week_start: string
          xp_reward?: number
        }
        Update: {
          challenge_type?: string
          created_at?: string
          description?: string
          description_ar?: string
          icon?: string
          id?: string
          target_value?: number
          title?: string
          title_ar?: string
          week_end?: string
          week_start?: string
          xp_reward?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_leaderboard: {
        Args: { limit_count?: number; time_filter?: string }
        Returns: {
          avatar_url: string
          display_name: string
          level: number
          quizzes_completed: number
          rank: number
          streak_days: number
          study_hours: number
          xp_points: number
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
