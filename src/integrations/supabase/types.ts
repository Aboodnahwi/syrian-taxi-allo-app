export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      app_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      driver_applications: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          id_document_url: string | null
          license_document_url: string | null
          license_number: string
          license_plate: string
          phone: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
          vehicle_color: string | null
          vehicle_model: string | null
          vehicle_registration_url: string | null
          vehicle_type: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          id_document_url?: string | null
          license_document_url?: string | null
          license_number: string
          license_plate: string
          phone: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
          vehicle_color?: string | null
          vehicle_model?: string | null
          vehicle_registration_url?: string | null
          vehicle_type: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          id_document_url?: string | null
          license_document_url?: string | null
          license_number?: string
          license_plate?: string
          phone?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          vehicle_color?: string | null
          vehicle_model?: string | null
          vehicle_registration_url?: string | null
          vehicle_type?: string
        }
        Relationships: []
      }
      drivers: {
        Row: {
          created_at: string
          current_location: unknown | null
          id: string
          is_online: boolean | null
          license_number: string
          license_plate: string
          rating: number | null
          total_trips: number | null
          updated_at: string
          user_id: string
          vehicle_color: string | null
          vehicle_model: string | null
          vehicle_type: string
        }
        Insert: {
          created_at?: string
          current_location?: unknown | null
          id?: string
          is_online?: boolean | null
          license_number: string
          license_plate: string
          rating?: number | null
          total_trips?: number | null
          updated_at?: string
          user_id: string
          vehicle_color?: string | null
          vehicle_model?: string | null
          vehicle_type: string
        }
        Update: {
          created_at?: string
          current_location?: unknown | null
          id?: string
          is_online?: boolean | null
          license_number?: string
          license_plate?: string
          rating?: number | null
          total_trips?: number | null
          updated_at?: string
          user_id?: string
          vehicle_color?: string | null
          vehicle_model?: string | null
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "drivers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_codes: {
        Row: {
          attempts: number | null
          code: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_used: boolean | null
          phone: string
        }
        Insert: {
          attempts?: number | null
          code: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          phone: string
        }
        Update: {
          attempts?: number | null
          code?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          phone?: string
        }
        Relationships: []
      }
      pricing_factors: {
        Row: {
          created_at: string
          description: string | null
          factor_name: string
          factor_type: string
          factor_value: number
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          factor_name: string
          factor_type: string
          factor_value: number
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          factor_name?: string
          factor_type?: string
          factor_value?: number
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          governorate: string
          id: string
          is_active: boolean | null
          name: string
          phone: string
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          governorate: string
          id: string
          is_active?: boolean | null
          name: string
          phone: string
          role: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          governorate?: string
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          accepted_at: string | null
          actual_duration: number | null
          cancellation_reason: string | null
          cancelled_at: string | null
          completed_at: string | null
          created_at: string
          customer_comment: string | null
          customer_id: string
          customer_rating: number | null
          distance_km: number | null
          driver_comment: string | null
          driver_id: string | null
          driver_rating: number | null
          estimated_duration: number | null
          from_coordinates: unknown | null
          from_location: string
          id: string
          price: number
          scheduled_time: string | null
          started_at: string | null
          status: string
          to_coordinates: unknown | null
          to_location: string
          updated_at: string
          vehicle_type: string
        }
        Insert: {
          accepted_at?: string | null
          actual_duration?: number | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          customer_comment?: string | null
          customer_id: string
          customer_rating?: number | null
          distance_km?: number | null
          driver_comment?: string | null
          driver_id?: string | null
          driver_rating?: number | null
          estimated_duration?: number | null
          from_coordinates?: unknown | null
          from_location: string
          id?: string
          price: number
          scheduled_time?: string | null
          started_at?: string | null
          status?: string
          to_coordinates?: unknown | null
          to_location: string
          updated_at?: string
          vehicle_type: string
        }
        Update: {
          accepted_at?: string | null
          actual_duration?: number | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          customer_comment?: string | null
          customer_id?: string
          customer_rating?: number | null
          distance_km?: number | null
          driver_comment?: string | null
          driver_id?: string | null
          driver_rating?: number | null
          estimated_duration?: number | null
          from_coordinates?: unknown | null
          from_location?: string
          id?: string
          price?: number
          scheduled_time?: string | null
          started_at?: string | null
          status?: string
          to_coordinates?: unknown | null
          to_location?: string
          updated_at?: string
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_pricing: {
        Row: {
          base_price: number
          created_at: string
          id: string
          is_active: boolean
          minimum_fare: number
          price_per_km: number
          surge_multiplier: number
          updated_at: string
          vehicle_type: string
        }
        Insert: {
          base_price?: number
          created_at?: string
          id?: string
          is_active?: boolean
          minimum_fare?: number
          price_per_km?: number
          surge_multiplier?: number
          updated_at?: string
          vehicle_type: string
        }
        Update: {
          base_price?: number
          created_at?: string
          id?: string
          is_active?: boolean
          minimum_fare?: number
          price_per_km?: number
          surge_multiplier?: number
          updated_at?: string
          vehicle_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_distance: {
        Args: { lat1: number; lon1: number; lat2: number; lon2: number }
        Returns: number
      }
      calculate_dynamic_price: {
        Args: {
          p_vehicle_type: string
          p_distance_km: number
          p_is_peak_hour?: boolean
          p_is_night_time?: boolean
          p_is_weekend?: boolean
          p_is_holiday?: boolean
        }
        Returns: number
      }
      cleanup_expired_otps: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_trip_request: {
        Args: {
          p_customer_id: string
          p_from_location: string
          p_to_location: string
          p_from_coordinates: string
          p_to_coordinates: string
          p_vehicle_type: string
          p_distance_km: number
          p_price: number
          p_scheduled_time?: string
        }
        Returns: string
      }
      generate_otp: {
        Args: { p_phone: string }
        Returns: string
      }
      send_notification: {
        Args: {
          p_user_id: string
          p_title: string
          p_message: string
          p_type: string
          p_data?: Json
        }
        Returns: string
      }
      verify_otp: {
        Args: { p_phone: string; p_code: string }
        Returns: boolean
      }
      verify_otp_and_create_user: {
        Args: { p_phone: string; p_code: string; p_user_data?: Json }
        Returns: Json
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
