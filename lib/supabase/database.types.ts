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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
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
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          changed_at: string
          changed_by: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          reason: string | null
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          reason?: string | null
          record_id: string
          table_name: string
        }
        Update: {
          action?: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          reason?: string | null
          record_id?: string
          table_name?: string
        }
        Relationships: []
      }
      business_contacts: {
        Row: {
          business_member_id: string
          contact_member_id: string
          created_at: string
          id: string
          is_primary: boolean
        }
        Insert: {
          business_member_id: string
          contact_member_id: string
          created_at?: string
          id?: string
          is_primary?: boolean
        }
        Update: {
          business_member_id?: string
          contact_member_id?: string
          created_at?: string
          id?: string
          is_primary?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "business_contacts_business_member_id_fkey"
            columns: ["business_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_contacts_contact_member_id_fkey"
            columns: ["contact_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      election_options: {
        Row: {
          created_at: string
          display_order: number
          election_id: string
          id: string
          option_text: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          election_id: string
          id?: string
          option_text: string
        }
        Update: {
          created_at?: string
          display_order?: number
          election_id?: string
          id?: string
          option_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "election_options_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "elections"
            referencedColumns: ["id"]
          },
        ]
      }
      elections: {
        Row: {
          allow_abstain: boolean
          closes_at: string
          created_at: string
          created_by: string | null
          description: string | null
          eligible_levels: Database["public"]["Enums"]["membership_level"][]
          id: string
          opens_at: string
          results_public: boolean
          title: string
        }
        Insert: {
          allow_abstain?: boolean
          closes_at: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          eligible_levels?: Database["public"]["Enums"]["membership_level"][]
          id?: string
          opens_at: string
          results_public?: boolean
          title: string
        }
        Update: {
          allow_abstain?: boolean
          closes_at?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          eligible_levels?: Database["public"]["Enums"]["membership_level"][]
          id?: string
          opens_at?: string
          results_public?: boolean
          title?: string
        }
        Relationships: []
      }
      event_registrations: {
        Row: {
          amount_paid: number | null
          event_id: string
          family_attendee_count: number
          guest_attendee_count: number
          id: string
          member_id: string
          payment_id: string | null
          primary_attendee_count: number
          registered_at: string
          total_attendees: number | null
        }
        Insert: {
          amount_paid?: number | null
          event_id: string
          family_attendee_count?: number
          guest_attendee_count?: number
          id?: string
          member_id: string
          payment_id?: string | null
          primary_attendee_count?: number
          registered_at?: string
          total_attendees?: number | null
        }
        Update: {
          amount_paid?: number | null
          event_id?: string
          family_attendee_count?: number
          guest_attendee_count?: number
          id?: string
          member_id?: string
          payment_id?: string | null
          primary_attendee_count?: number
          registered_at?: string
          total_attendees?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          event_date: string
          event_time: string | null
          id: string
          location: string | null
          max_attendees: number | null
          member_discount_percent: number | null
          name: string
          price_per_person: number | null
          registration_closes_at: string | null
          registration_opens_at: string | null
          registration_required: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date: string
          event_time?: string | null
          id?: string
          location?: string | null
          max_attendees?: number | null
          member_discount_percent?: number | null
          name: string
          price_per_person?: number | null
          registration_closes_at?: string | null
          registration_opens_at?: string | null
          registration_required?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date?: string
          event_time?: string | null
          id?: string
          location?: string | null
          max_attendees?: number | null
          member_discount_percent?: number | null
          name?: string
          price_per_person?: number | null
          registration_closes_at?: string | null
          registration_opens_at?: string | null
          registration_required?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      family_members: {
        Row: {
          child_order: number | null
          created_at: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string
          member_id: string
          nakshatra: string | null
          phone: string | null
          relationship: string
          updated_at: string | null
        }
        Insert: {
          child_order?: number | null
          created_at?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          member_id: string
          nakshatra?: string | null
          phone?: string | null
          relationship: string
          updated_at?: string | null
        }
        Update: {
          child_order?: number | null
          created_at?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          member_id?: string
          nakshatra?: string | null
          phone?: string | null
          relationship?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      import_batches: {
        Row: {
          batch_number: string
          created_at: string | null
          failed_records: number
          file_name: string
          id: string
          imported_by: string | null
          imported_by_name: string | null
          notes: string | null
          reverted_at: string | null
          reverted_by: string | null
          reverted_by_name: string | null
          status: string
          successful_records: number
          total_records: number
        }
        Insert: {
          batch_number: string
          created_at?: string | null
          failed_records?: number
          file_name: string
          id?: string
          imported_by?: string | null
          imported_by_name?: string | null
          notes?: string | null
          reverted_at?: string | null
          reverted_by?: string | null
          reverted_by_name?: string | null
          status?: string
          successful_records?: number
          total_records?: number
        }
        Update: {
          batch_number?: string
          created_at?: string | null
          failed_records?: number
          file_name?: string
          id?: string
          imported_by?: string | null
          imported_by_name?: string | null
          notes?: string | null
          reverted_at?: string | null
          reverted_by?: string | null
          reverted_by_name?: string | null
          status?: string
          successful_records?: number
          total_records?: number
        }
        Relationships: []
      }
      ledger_entries: {
        Row: {
          activity_date: string
          activity_type: Database["public"]["Enums"]["activity_type"]
          amount: number | null
          created_at: string
          description: string
          event_id: string | null
          id: string
          member_id: string
          payment_id: string | null
          request_id: string | null
        }
        Insert: {
          activity_date?: string
          activity_type: Database["public"]["Enums"]["activity_type"]
          amount?: number | null
          created_at?: string
          description: string
          event_id?: string | null
          id?: string
          member_id: string
          payment_id?: string | null
          request_id?: string | null
        }
        Update: {
          activity_date?: string
          activity_type?: Database["public"]["Enums"]["activity_type"]
          amount?: number | null
          created_at?: string
          description?: string
          event_id?: string | null
          id?: string
          member_id?: string
          payment_id?: string | null
          request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      login_audit_logs: {
        Row: {
          auth_user_id: string | null
          failure_reason: string | null
          geo_city: string | null
          geo_country: string | null
          id: string
          ip_address: unknown
          login_at: string
          login_method: string
          member_id: string | null
          success: boolean
          user_agent: string | null
        }
        Insert: {
          auth_user_id?: string | null
          failure_reason?: string | null
          geo_city?: string | null
          geo_country?: string | null
          id?: string
          ip_address?: unknown
          login_at?: string
          login_method: string
          member_id?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Update: {
          auth_user_id?: string | null
          failure_reason?: string | null
          geo_city?: string | null
          geo_country?: string | null
          id?: string
          ip_address?: unknown
          login_at?: string
          login_method?: string
          member_id?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "login_audit_logs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      member_audit_log: {
        Row: {
          action_type: string
          change_reason: string | null
          changed_at: string
          changed_by: string | null
          changed_by_name: string | null
          changed_by_role: string | null
          changed_fields: Json | null
          creation_source: string | null
          field_names: string[] | null
          id: string
          member_id: string
          metadata: Json | null
          new_membership_id: string | null
          old_membership_id: string | null
        }
        Insert: {
          action_type: string
          change_reason?: string | null
          changed_at?: string
          changed_by?: string | null
          changed_by_name?: string | null
          changed_by_role?: string | null
          changed_fields?: Json | null
          creation_source?: string | null
          field_names?: string[] | null
          id?: string
          member_id: string
          metadata?: Json | null
          new_membership_id?: string | null
          old_membership_id?: string | null
        }
        Update: {
          action_type?: string
          change_reason?: string | null
          changed_at?: string
          changed_by?: string | null
          changed_by_name?: string | null
          changed_by_role?: string | null
          changed_fields?: Json | null
          creation_source?: string | null
          field_names?: string[] | null
          id?: string
          member_id?: string
          metadata?: Json | null
          new_membership_id?: string | null
          old_membership_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_audit_log_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          auth_user_id: string | null
          business_ein: string | null
          business_name: string | null
          city: string | null
          country: string | null
          created_at: string
          created_by: string | null
          current_level: Database["public"]["Enums"]["membership_level"]
          family_gotra: string | null
          first_name: string | null
          id: string
          import_batch_id: string | null
          is_founding_member: boolean
          is_test_account: boolean | null
          last_name: string | null
          legacy_id: string | null
          mailing_address: string | null
          member_class: Database["public"]["Enums"]["member_class"]
          member_profile_name: string | null
          member_since: string | null
          membership_id: string
          nakshatra: Database["public"]["Enums"]["nakshatra"] | null
          primary_email: string
          primary_phone: string | null
          primary_phone_2: string | null
          secondary_email: string | null
          secondary_first_name: string | null
          secondary_last_name: string | null
          secondary_nakshatra: Database["public"]["Enums"]["nakshatra"] | null
          secondary_phone: string | null
          state: string | null
          updated_at: string
          updated_by: string | null
          zip: string | null
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          auth_user_id?: string | null
          business_ein?: string | null
          business_name?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          current_level?: Database["public"]["Enums"]["membership_level"]
          family_gotra?: string | null
          first_name?: string | null
          id?: string
          import_batch_id?: string | null
          is_founding_member?: boolean
          is_test_account?: boolean | null
          last_name?: string | null
          legacy_id?: string | null
          mailing_address?: string | null
          member_class?: Database["public"]["Enums"]["member_class"]
          member_profile_name?: string | null
          member_since?: string | null
          membership_id: string
          nakshatra?: Database["public"]["Enums"]["nakshatra"] | null
          primary_email: string
          primary_phone?: string | null
          primary_phone_2?: string | null
          secondary_email?: string | null
          secondary_first_name?: string | null
          secondary_last_name?: string | null
          secondary_nakshatra?: Database["public"]["Enums"]["nakshatra"] | null
          secondary_phone?: string | null
          state?: string | null
          updated_at?: string
          updated_by?: string | null
          zip?: string | null
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          auth_user_id?: string | null
          business_ein?: string | null
          business_name?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          current_level?: Database["public"]["Enums"]["membership_level"]
          family_gotra?: string | null
          first_name?: string | null
          id?: string
          import_batch_id?: string | null
          is_founding_member?: boolean
          is_test_account?: boolean | null
          last_name?: string | null
          legacy_id?: string | null
          mailing_address?: string | null
          member_class?: Database["public"]["Enums"]["member_class"]
          member_profile_name?: string | null
          member_since?: string | null
          membership_id?: string
          nakshatra?: Database["public"]["Enums"]["nakshatra"] | null
          primary_email?: string
          primary_phone?: string | null
          primary_phone_2?: string | null
          secondary_email?: string | null
          secondary_first_name?: string | null
          secondary_last_name?: string | null
          secondary_nakshatra?: Database["public"]["Enums"]["nakshatra"] | null
          secondary_phone?: string | null
          state?: string | null
          updated_at?: string
          updated_by?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          amount: number
          created_at: string
          end_date: string | null
          id: string
          level: Database["public"]["Enums"]["membership_level"]
          member_id: string
          payment_id: string | null
          start_date: string
          status: Database["public"]["Enums"]["membership_status"]
          updated_at: string
          year: number | null
        }
        Insert: {
          amount: number
          created_at?: string
          end_date?: string | null
          id?: string
          level: Database["public"]["Enums"]["membership_level"]
          member_id: string
          payment_id?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
          year?: number | null
        }
        Update: {
          amount?: number
          created_at?: string
          end_date?: string | null
          id?: string
          level?: Database["public"]["Enums"]["membership_level"]
          member_id?: string
          payment_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_memberships_payment"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          check_number: string | null
          created_at: string
          created_by: string | null
          currency: string
          id: string
          member_id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          payment_date: string
          purpose: Database["public"]["Enums"]["payment_purpose"]
          request_id: string | null
          stripe_charge_id: string | null
          stripe_payment_intent_id: string | null
          zelle_reference: string | null
        }
        Insert: {
          amount: number
          check_number?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          member_id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          payment_date?: string
          purpose: Database["public"]["Enums"]["payment_purpose"]
          request_id?: string | null
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          zelle_reference?: string | null
        }
        Update: {
          amount?: number
          check_number?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          member_id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          payment_date?: string
          purpose?: Database["public"]["Enums"]["payment_purpose"]
          request_id?: string | null
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          zelle_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_member_registrations: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          assigned_membership_id: string | null
          business_ein: string | null
          business_name: string | null
          business_type: string | null
          city: string | null
          country: string | null
          created_at: string
          created_member_id: string | null
          date_of_birth: string | null
          family_gotra: string | null
          first_name: string | null
          how_did_you_hear: string | null
          id: string
          last_name: string | null
          member_class: Database["public"]["Enums"]["member_class"]
          nakshatra: Database["public"]["Enums"]["nakshatra"] | null
          notes: string | null
          primary_email: string
          primary_phone: string | null
          requested_level: Database["public"]["Enums"]["membership_level"]
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          secondary_date_of_birth: string | null
          secondary_email: string | null
          secondary_first_name: string | null
          secondary_last_name: string | null
          secondary_nakshatra: Database["public"]["Enums"]["nakshatra"] | null
          secondary_phone: string | null
          state: string | null
          status: string
          submitted_at: string
          terms_accepted: boolean | null
          terms_content_id: string | null
          terms_version: string | null
          updated_at: string
          zip: string | null
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          assigned_membership_id?: string | null
          business_ein?: string | null
          business_name?: string | null
          business_type?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_member_id?: string | null
          date_of_birth?: string | null
          family_gotra?: string | null
          first_name?: string | null
          how_did_you_hear?: string | null
          id?: string
          last_name?: string | null
          member_class?: Database["public"]["Enums"]["member_class"]
          nakshatra?: Database["public"]["Enums"]["nakshatra"] | null
          notes?: string | null
          primary_email: string
          primary_phone?: string | null
          requested_level?: Database["public"]["Enums"]["membership_level"]
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          secondary_date_of_birth?: string | null
          secondary_email?: string | null
          secondary_first_name?: string | null
          secondary_last_name?: string | null
          secondary_nakshatra?: Database["public"]["Enums"]["nakshatra"] | null
          secondary_phone?: string | null
          state?: string | null
          status?: string
          submitted_at?: string
          terms_accepted?: boolean | null
          terms_content_id?: string | null
          terms_version?: string | null
          updated_at?: string
          zip?: string | null
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          assigned_membership_id?: string | null
          business_ein?: string | null
          business_name?: string | null
          business_type?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_member_id?: string | null
          date_of_birth?: string | null
          family_gotra?: string | null
          first_name?: string | null
          how_did_you_hear?: string | null
          id?: string
          last_name?: string | null
          member_class?: Database["public"]["Enums"]["member_class"]
          nakshatra?: Database["public"]["Enums"]["nakshatra"] | null
          notes?: string | null
          primary_email?: string
          primary_phone?: string | null
          requested_level?: Database["public"]["Enums"]["membership_level"]
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          secondary_date_of_birth?: string | null
          secondary_email?: string | null
          secondary_first_name?: string | null
          secondary_last_name?: string | null
          secondary_nakshatra?: Database["public"]["Enums"]["nakshatra"] | null
          secondary_phone?: string | null
          state?: string | null
          status?: string
          submitted_at?: string
          terms_accepted?: boolean | null
          terms_content_id?: string | null
          terms_version?: string | null
          updated_at?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pending_member_registrations_created_member_id_fkey"
            columns: ["created_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_member_registrations_terms_content_id_fkey"
            columns: ["terms_content_id"]
            isOneToOne: false
            referencedRelation: "terms_content"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_settings: {
        Row: {
          category: string
          created_at: string
          description: string | null
          display_name: string
          id: string
          setting_key: string
          setting_type: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          setting_key: string
          setting_type: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          setting_key?: string
          setting_type?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      purohits: {
        Row: {
          bio: string | null
          created_at: string | null
          display_order: number | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          picture_url: string | null
          profile_url: string | null
          specialties: string | null
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          display_order?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          picture_url?: string | null
          profile_url?: string | null
          specialties?: string | null
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          display_order?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          picture_url?: string | null
          profile_url?: string | null
          specialties?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      receipts: {
        Row: {
          amount: number
          created_at: string
          currency: string
          email_sent_at: string | null
          id: string
          member_id: string
          payment_id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          purpose: Database["public"]["Enums"]["payment_purpose"]
          receipt_date: string
          receipt_number: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          email_sent_at?: string | null
          id?: string
          member_id: string
          payment_id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          purpose: Database["public"]["Enums"]["payment_purpose"]
          receipt_date?: string
          receipt_number: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          email_sent_at?: string | null
          id?: string
          member_id?: string
          payment_id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          purpose?: Database["public"]["Enums"]["payment_purpose"]
          receipt_date?: string
          receipt_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_invitations: {
        Row: {
          accepted_at: string | null
          email: string
          expires_at: string
          id: string
          invited_at: string
          invited_by: string | null
          member_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          email: string
          expires_at: string
          id?: string
          invited_at?: string
          invited_by?: string | null
          member_id: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_at?: string
          invited_by?: string | null
          member_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "registration_invitations_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          amount: number
          contact_email: string | null
          contact_name: string | null
          created_at: string
          created_by: string | null
          currency: string
          description: string
          due_date: string | null
          id: string
          member_id: string | null
          purpose: Database["public"]["Enums"]["payment_purpose"]
          request_number: string
          sent_at: string | null
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description: string
          due_date?: string | null
          id?: string
          member_id?: string | null
          purpose: Database["public"]["Enums"]["payment_purpose"]
          request_number: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string
          due_date?: string | null
          id?: string
          member_id?: string | null
          purpose?: Database["public"]["Enums"]["payment_purpose"]
          request_number?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "requests_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      service_booking_items: {
        Row: {
          booking_id: string
          created_at: string | null
          id: string
          item_amount: number
          item_notes: string | null
          location_type: Database["public"]["Enums"]["service_location_type"]
          purohit_id: string | null
          purohit_name: string | null
          service_address: string | null
          service_date: string
          service_id: string
          service_name: string
          service_time: string | null
          updated_at: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          id?: string
          item_amount: number
          item_notes?: string | null
          location_type: Database["public"]["Enums"]["service_location_type"]
          purohit_id?: string | null
          purohit_name?: string | null
          service_address?: string | null
          service_date: string
          service_id: string
          service_name: string
          service_time?: string | null
          updated_at?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          id?: string
          item_amount?: number
          item_notes?: string | null
          location_type?: Database["public"]["Enums"]["service_location_type"]
          purohit_id?: string | null
          purohit_name?: string | null
          service_address?: string | null
          service_date?: string
          service_id?: string
          service_name?: string
          service_time?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_booking_items_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "service_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_booking_items_purohit_id_fkey"
            columns: ["purohit_id"]
            isOneToOne: false
            referencedRelation: "purohits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_booking_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_bookings: {
        Row: {
          approval_notes: string | null
          booking_number: string
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          id: string
          internal_notes: string | null
          is_walk_in: boolean | null
          member_id: string | null
          membership_id: string | null
          notes: string | null
          paid_at: string | null
          payment_id: string | null
          rejection_reason: string | null
          requester_email: string
          requester_name: string
          requester_phone: string
          reviewed_at: string | null
          reviewed_by: string | null
          reviewed_by_name: string | null
          status: Database["public"]["Enums"]["booking_status"] | null
          submitted_at: string | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          approval_notes?: string | null
          booking_number: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          internal_notes?: string | null
          is_walk_in?: boolean | null
          member_id?: string | null
          membership_id?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_id?: string | null
          rejection_reason?: string | null
          requester_email: string
          requester_name: string
          requester_phone: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewed_by_name?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          submitted_at?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          approval_notes?: string | null
          booking_number?: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          internal_notes?: string | null
          is_walk_in?: boolean | null
          member_id?: string | null
          membership_id?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_id?: string | null
          rejection_reason?: string | null
          requester_email?: string
          requester_name?: string
          requester_phone?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewed_by_name?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          submitted_at?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_bookings_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_bookings_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category: Database["public"]["Enums"]["service_category"] | null
          created_at: string | null
          description: string | null
          display_name: string | null
          display_order: number | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          is_temple_only: boolean | null
          name: string
          preparation_notes: string | null
          price_community_external: number | null
          price_community_temple: number | null
          price_member_external: number | null
          price_member_temple: number | null
          requires_appointment: boolean | null
          updated_at: string | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["service_category"] | null
          created_at?: string | null
          description?: string | null
          display_name?: string | null
          display_order?: number | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          is_temple_only?: boolean | null
          name: string
          preparation_notes?: string | null
          price_community_external?: number | null
          price_community_temple?: number | null
          price_member_external?: number | null
          price_member_temple?: number | null
          requires_appointment?: boolean | null
          updated_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["service_category"] | null
          created_at?: string | null
          description?: string | null
          display_name?: string | null
          display_order?: number | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          is_temple_only?: boolean | null
          name?: string
          preparation_notes?: string | null
          price_community_external?: number | null
          price_community_temple?: number | null
          price_member_external?: number | null
          price_member_temple?: number | null
          requires_appointment?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      terms_acceptance_bypasses: {
        Row: {
          auth_user_id: string | null
          bypassed_at: string
          created_at: string
          error_message: string | null
          id: string
          ip_address: string | null
          member_id: string | null
          reprompted_at: string | null
          resolution_notes: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          retry_count: number
          should_reprompt: boolean | null
          terms_content_id: string | null
          terms_version: string
          user_agent: string | null
        }
        Insert: {
          auth_user_id?: string | null
          bypassed_at?: string
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          member_id?: string | null
          reprompted_at?: string | null
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          retry_count?: number
          should_reprompt?: boolean | null
          terms_content_id?: string | null
          terms_version: string
          user_agent?: string | null
        }
        Update: {
          auth_user_id?: string | null
          bypassed_at?: string
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          member_id?: string | null
          reprompted_at?: string | null
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          retry_count?: number
          should_reprompt?: boolean | null
          terms_content_id?: string | null
          terms_version?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "terms_acceptance_bypasses_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "terms_acceptance_bypasses_terms_content_id_fkey"
            columns: ["terms_content_id"]
            isOneToOne: false
            referencedRelation: "terms_content"
            referencedColumns: ["id"]
          },
        ]
      }
      terms_acceptances: {
        Row: {
          acceptance_method: string | null
          accepted_at: string
          auth_user_id: string | null
          id: string
          ip_address: string | null
          member_id: string | null
          terms_content_id: string | null
          terms_version: string
          user_agent: string | null
        }
        Insert: {
          acceptance_method?: string | null
          accepted_at?: string
          auth_user_id?: string | null
          id?: string
          ip_address?: string | null
          member_id?: string | null
          terms_content_id?: string | null
          terms_version: string
          user_agent?: string | null
        }
        Update: {
          acceptance_method?: string | null
          accepted_at?: string
          auth_user_id?: string | null
          id?: string
          ip_address?: string | null
          member_id?: string | null
          terms_content_id?: string | null
          terms_version?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "terms_acceptances_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "terms_acceptances_terms_content_id_fkey"
            columns: ["terms_content_id"]
            isOneToOne: false
            referencedRelation: "terms_content"
            referencedColumns: ["id"]
          },
        ]
      }
      terms_content: {
        Row: {
          content: string
          content_format: string
          created_at: string
          created_by: string | null
          effective_date: string
          id: string
          is_active: boolean
          title: string
          updated_at: string
          version: string
        }
        Insert: {
          content: string
          content_format?: string
          created_at?: string
          created_by?: string | null
          effective_date: string
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
          version: string
        }
        Update: {
          content?: string
          content_format?: string
          created_at?: string
          created_by?: string | null
          effective_date?: string
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      votes: {
        Row: {
          election_id: string
          election_option_id: string | null
          id: string
          member_id: string
          voted_at: string
        }
        Insert: {
          election_id: string
          election_option_id?: string | null
          id?: string
          member_id: string
          voted_at?: string
        }
        Update: {
          election_id?: string
          election_option_id?: string | null
          id?: string
          member_id?: string
          voted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "elections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_election_option_id_fkey"
            columns: ["election_option_id"]
            isOneToOne: false
            referencedRelation: "election_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_membership_id: {
        Args: { p_level: Database["public"]["Enums"]["membership_level"] }
        Returns: string
      }
      generate_receipt_number: { Args: never; Returns: string }
      generate_request_number: { Args: never; Returns: string }
      get_current_member_id: { Args: never; Returns: string }
      get_user_roles: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"][]
      }
      has_any_role: {
        Args: { required_roles: Database["public"]["Enums"]["user_role"][] }
        Returns: boolean
      }
      has_role: {
        Args: { required_role: Database["public"]["Enums"]["user_role"] }
        Returns: boolean
      }
      is_own_member_record: { Args: { member_id: string }; Returns: boolean }
    }
    Enums: {
      activity_type:
        | "Visit"
        | "Puja"
        | "Event"
        | "Donation"
        | "Service"
        | "Membership"
      booking_status:
        | "Pending Approval"
        | "Approved"
        | "Rejected"
        | "Paid"
        | "Completed"
        | "Cancelled"
      member_class: "Personal" | "Business"
      membership_level: "Community" | "Annual" | "Lifetime"
      membership_status: "Active" | "Expired" | "Cancelled" | "Pending"
      nakshatra:
        | "Ashwini"
        | "Bharani"
        | "Krittika"
        | "Rohini"
        | "Mrigashirsha"
        | "Ardra"
        | "Punarvasu"
        | "Pushya"
        | "Ashlesha"
        | "Magha"
        | "Purva Phalguni"
        | "Uttara Phalguni"
        | "Hasta"
        | "Chitra"
        | "Swati"
        | "Vishakha"
        | "Anuradha"
        | "Jyeshta"
        | "Moola"
        | "Purva Ashadha"
        | "Uttara Ashadha"
        | "Shravana"
        | "Dhanishta"
        | "Shatabhisha"
        | "Purva Bhadrapada"
        | "Uttara Bhadrapada"
        | "Revati"
      payment_method: "Stripe" | "Cash" | "Check" | "Zelle"
      payment_purpose:
        | "Membership"
        | "Event"
        | "Donation"
        | "Sponsorship"
        | "Request"
        | "Service"
      request_status:
        | "Draft"
        | "Sent"
        | "Partially Paid"
        | "Paid"
        | "Cancelled"
        | "Expired"
      service_category: "Puja" | "Other"
      service_location_type: "Temple" | "External"
      user_role: "Member" | "Office Staff" | "Office Manager" | "Admin"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      activity_type: [
        "Visit",
        "Puja",
        "Event",
        "Donation",
        "Service",
        "Membership",
      ],
      booking_status: [
        "Pending Approval",
        "Approved",
        "Rejected",
        "Paid",
        "Completed",
        "Cancelled",
      ],
      member_class: ["Personal", "Business"],
      membership_level: ["Community", "Annual", "Lifetime"],
      membership_status: ["Active", "Expired", "Cancelled", "Pending"],
      nakshatra: [
        "Ashwini",
        "Bharani",
        "Krittika",
        "Rohini",
        "Mrigashirsha",
        "Ardra",
        "Punarvasu",
        "Pushya",
        "Ashlesha",
        "Magha",
        "Purva Phalguni",
        "Uttara Phalguni",
        "Hasta",
        "Chitra",
        "Swati",
        "Vishakha",
        "Anuradha",
        "Jyeshta",
        "Moola",
        "Purva Ashadha",
        "Uttara Ashadha",
        "Shravana",
        "Dhanishta",
        "Shatabhisha",
        "Purva Bhadrapada",
        "Uttara Bhadrapada",
        "Revati",
      ],
      payment_method: ["Stripe", "Cash", "Check", "Zelle"],
      payment_purpose: [
        "Membership",
        "Event",
        "Donation",
        "Sponsorship",
        "Request",
        "Service",
      ],
      request_status: [
        "Draft",
        "Sent",
        "Partially Paid",
        "Paid",
        "Cancelled",
        "Expired",
      ],
      service_category: ["Puja", "Other"],
      service_location_type: ["Temple", "External"],
      user_role: ["Member", "Office Staff", "Office Manager", "Admin"],
    },
  },
} as const
