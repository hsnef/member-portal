// ============================================================================
// HSNEF Membership Portal - Database Types
// ============================================================================
// Auto-generated types based on Supabase schema

export type Nakshatra =
  | 'Ashwini'
  | 'Bharani'
  | 'Krittika'
  | 'Rohini'
  | 'Mrigashirsha'
  | 'Ardra'
  | 'Punarvasu'
  | 'Pushya'
  | 'Ashlesha'
  | 'Magha'
  | 'Purva Phalguni'
  | 'Uttara Phalguni'
  | 'Hasta'
  | 'Chitra'
  | 'Swati'
  | 'Vishakha'
  | 'Anuradha'
  | 'Jyeshta'
  | 'Moola'
  | 'Purva Ashadha'
  | 'Uttara Ashadha'
  | 'Shravana'
  | 'Dhanishta'
  | 'Shatabhisha'
  | 'Purva Bhadrapada'
  | 'Uttara Bhadrapada'
  | 'Revati';

export type MemberClass = 'Personal' | 'Business';

export type MembershipLevel = 'Community' | 'Annual' | 'Lifetime';

export type MembershipStatus = 'Active' | 'Expired' | 'Cancelled' | 'Pending';

export type PaymentMethod = 'Stripe' | 'Cash' | 'Check' | 'Zelle';

export type PaymentPurpose = 'Membership' | 'Event' | 'Donation' | 'Sponsorship' | 'Request' | 'Service';

export type RequestStatus = 'Draft' | 'Sent' | 'Partially Paid' | 'Paid' | 'Cancelled' | 'Expired';

export type ZelleRequestStatus = 'pending' | 'member_confirmed' | 'staff_confirmed' | 'auto_confirmed' | 'cancelled' | 'expired';

export type UserRole = 'Member' | 'Office Staff' | 'Office Manager' | 'Admin';

export type ActivityType = 'Visit' | 'Puja' | 'Event' | 'Donation' | 'Service' | 'Membership';

export type Member = {
  id: string;
  auth_user_id: string | null;
  membership_id: string;
  legacy_id: string | null;
  member_class: MemberClass;
  current_level: MembershipLevel;
  is_founding_member: boolean;

  // Personal fields
  member_profile_name: string | null;
  first_name: string | null;
  last_name: string | null;
  nakshatra: Nakshatra | null;
  family_gotra: string | null;

  // Secondary/spouse
  secondary_first_name: string | null;
  secondary_last_name: string | null;
  secondary_nakshatra: Nakshatra | null;
  secondary_email: string | null;
  secondary_phone: string | null;

  // Business fields
  business_name: string | null;
  business_ein: string | null;

  // Contact
  primary_email: string;
  primary_phone: string | null;
  primary_phone_2: string | null;

  // Address
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  mailing_address: string | null;

  // Metadata
  member_since: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export type FamilyMember = {
  id: string;
  member_id: string;
  first_name: string;
  last_name: string;
  nakshatra: Nakshatra | null;
  email: string | null;
  relationship: string | null;
  date_of_birth: string | null;
  created_at: string;
  updated_at: string;
}

export type BusinessContact = {
  id: string;
  business_member_id: string;
  contact_member_id: string;
  is_primary: boolean;
  created_at: string;
}

export type Membership = {
  id: string;
  member_id: string;
  level: MembershipLevel;
  status: MembershipStatus;
  year: number | null;
  start_date: string;
  end_date: string | null;
  payment_id: string | null;
  amount: number;
  created_at: string;
  updated_at: string;
}

export type UserRoleRecord = {
  id: string;
  user_id: string;
  role: UserRole;
  granted_at: string;
  granted_by: string | null;
}

export type Request = {
  id: string;
  request_number: string;
  member_id: string | null;
  contact_email: string | null;
  contact_name: string | null;
  purpose: PaymentPurpose;
  description: string;
  amount: number;
  currency: string;
  status: RequestStatus;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  created_by: string | null;
}

export type Payment = {
  id: string;
  member_id: string;
  request_id: string | null;
  amount: number;
  currency: string;
  method: PaymentMethod;
  purpose: PaymentPurpose;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  check_number: string | null;
  zelle_reference: string | null;
  notes: string | null;
  payment_date: string;
  created_at: string;
  created_by: string | null;
}

export type Receipt = {
  id: string;
  receipt_number: string;
  payment_id: string;
  member_id: string;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  purpose: PaymentPurpose;
  receipt_date: string;
  email_sent_at: string | null;
  created_at: string;
}

export type EventStatus = 'Draft' | 'Published' | 'Cancelled' | 'Completed';
export type EventCategory =
  | 'Festival' | 'Puja' | 'Educational' | 'Social' | 'Cultural' | 'Fundraiser' | 'Other';

// Matches migration 20260901000001_events_align_with_application.sql, which
// brought the table up to the column set every events page already used. See
// DEC-009 -- before that migration these queries all returned 400.
export type Event = {
  id: string;
  event_name: string;
  description: string | null;
  short_description: string | null;
  category: EventCategory;
  status: EventStatus;
  event_date: string;
  event_time: string | null;
  location: string | null;
  registration_required: boolean;
  registration_opens_at: string | null;
  registration_deadline: string | null;
  max_capacity: number | null;
  member_price: number | null;
  non_member_price: number | null;
  image_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  rsvp_enabled: boolean;
  is_payable: boolean;
  is_test_event: boolean | null;
  // Superseded by member_price / non_member_price; retained in the table.
  price_per_person: number | null;
  member_discount_percent: number | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export type EventRegistration = {
  id: string;
  event_id: string;
  member_id: string;
  primary_attendee_count: number;
  family_attendee_count: number;
  guest_attendee_count: number;
  total_attendees: number;
  payment_id: string | null;
  amount_paid: number | null;
  registered_at: string;
  attended: boolean | null;
}

export type LedgerEntry = {
  id: string;
  member_id: string;
  activity_type: ActivityType;
  description: string;
  amount: number | null;
  payment_id: string | null;
  event_id: string | null;
  request_id: string | null;
  activity_date: string;
  created_at: string;
}

export type LoginAuditLog = {
  id: string;
  auth_user_id: string | null;
  member_id: string | null;
  login_method: string;
  ip_address: string | null;
  user_agent: string | null;
  geo_country: string | null;
  geo_city: string | null;
  success: boolean;
  failure_reason: string | null;
  login_at: string;
}

export type RegistrationInvitation = {
  id: string;
  member_id: string;
  email: string;
  token: string;
  expires_at: string;
  invited_at: string;
  invited_by: string | null;
  accepted_at: string | null;
}

export type Election = {
  id: string;
  title: string;
  description: string | null;
  eligible_levels: MembershipLevel[];
  opens_at: string;
  closes_at: string;
  allow_abstain: boolean;
  results_public: boolean;
  created_at: string;
  created_by: string | null;
}

export type ElectionOption = {
  id: string;
  election_id: string;
  option_text: string;
  display_order: number;
  created_at: string;
}

export type Vote = {
  id: string;
  election_id: string;
  member_id: string;
  election_option_id: string | null;
  voted_at: string;
}

export type AuditLog = {
  id: string;
  table_name: string;
  record_id: string;
  action: string;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  changed_by: string | null;
  changed_at: string;
  reason: string | null;
}

export type MemberAuditLogActionType = 'CREATED' | 'MEMBERSHIP_ID_CHANGED' | 'FIELD_UPDATED' | 'BULK_UPDATE';
export type CreationSource = 'AUTO_IMPORT' | 'SELF_REGISTRATION' | 'OFFICE_STAFF' | 'OFFICE_MANAGER' | 'ADMIN';

export type MemberAuditLog = {
  id: string;
  member_id: string;
  action_type: MemberAuditLogActionType;
  changed_by: string | null;
  changed_by_role: string | null;
  changed_by_name: string | null;
  creation_source: CreationSource | null;
  old_membership_id: string | null;
  new_membership_id: string | null;
  changed_fields: Record<string, { old: any; new: any }> | null;
  field_names: string[] | null;
  change_reason: string | null;
  metadata: Record<string, any> | null;
  changed_at: string;
}

export type PendingMemberRegistration = {
  id: string;
  member_class: MemberClass;
  requested_level: MembershipLevel;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  nakshatra: Nakshatra | null;
  family_gotra: string | null;
  secondary_first_name: string | null;
  secondary_last_name: string | null;
  secondary_date_of_birth: string | null;
  secondary_nakshatra: Nakshatra | null;
  business_name: string | null;
  business_ein: string | null;
  business_type: string | null;
  primary_email: string;
  primary_phone: string | null;
  secondary_email: string | null;
  secondary_phone: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  how_did_you_hear: string | null;
  notes: string | null;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Contacted';
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_member_id: string | null;
  assigned_membership_id: string | null;
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

export type ZellePaymentRequest = {
  id: string;
  reference_code: string;
  member_id: string | null;
  amount: number;
  purpose: PaymentPurpose;
  description: string | null;
  request_id: string | null;
  event_registration_id: string | null;
  service_booking_id: string | null;
  status: ZelleRequestStatus;
  member_confirmed_at: string | null;
  member_zelle_reference: string | null;
  staff_confirmed_at: string | null;
  staff_confirmed_by: string | null;
  staff_notes: string | null;
  expires_at: string;
  qr_token: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  payment_id: string | null;
}

export interface ZelleSettings {
  enabled: boolean;
  zelle_email: string;
  zelle_phone: string;
  auto_confirm_threshold: number;
  request_expiry_hours: number;
  instructions: string;
}

// Database schema type for Supabase client
export type Database = {
  public: {
    Tables: {
      members: {
        Row: Member;
        Insert: Omit<Member, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Member>;
        Relationships: [];
      };
      family_members: {
        Row: FamilyMember;
        Insert: Omit<FamilyMember, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<FamilyMember>;
        Relationships: [];
      };
      business_contacts: {
        Row: BusinessContact;
        Insert: Omit<BusinessContact, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<BusinessContact>;
        Relationships: [];
      };
      memberships: {
        Row: Membership;
        Insert: Omit<Membership, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Membership>;
        Relationships: [];
      };
      user_roles: {
        Row: UserRoleRecord;
        Insert: Omit<UserRoleRecord, 'id' | 'granted_at'> & {
          id?: string;
          granted_at?: string;
        };
        Update: Partial<UserRoleRecord>;
        Relationships: [];
      };
      requests: {
        Row: Request;
        Insert: Omit<Request, 'id' | 'request_number' | 'created_at' | 'updated_at'> & {
          id?: string;
          request_number?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Request>;
        Relationships: [];
      };
      payments: {
        Row: Payment;
        Insert: Omit<Payment, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Payment>;
        Relationships: [];
      };
      receipts: {
        Row: Receipt;
        Insert: Omit<Receipt, 'id' | 'receipt_number' | 'created_at'> & {
          id?: string;
          receipt_number?: string;
          created_at?: string;
        };
        Update: Partial<Receipt>;
        Relationships: [];
      };
      events: {
        Row: Event;
        Insert: Omit<Event, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Event>;
        Relationships: [];
      };
      event_registrations: {
        Row: EventRegistration;
        Insert: Omit<EventRegistration, 'id' | 'total_attendees' | 'registered_at'> & {
          id?: string;
          registered_at?: string;
        };
        Update: Partial<EventRegistration>;
        Relationships: [];
      };
      ledger_entries: {
        Row: LedgerEntry;
        Insert: Omit<LedgerEntry, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<LedgerEntry>;
        Relationships: [];
      };
      login_audit_logs: {
        Row: LoginAuditLog;
        Insert: Omit<LoginAuditLog, 'id' | 'login_at'> & {
          id?: string;
          login_at?: string;
        };
        Update: Partial<LoginAuditLog>;
        Relationships: [];
      };
      registration_invitations: {
        Row: RegistrationInvitation;
        Insert: Omit<RegistrationInvitation, 'id' | 'invited_at'> & {
          id?: string;
          invited_at?: string;
        };
        Update: Partial<RegistrationInvitation>;
        Relationships: [];
      };
      elections: {
        Row: Election;
        Insert: Omit<Election, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Election>;
        Relationships: [];
      };
      election_options: {
        Row: ElectionOption;
        Insert: Omit<ElectionOption, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<ElectionOption>;
        Relationships: [];
      };
      votes: {
        Row: Vote;
        Insert: Omit<Vote, 'id' | 'voted_at'> & {
          id?: string;
          voted_at?: string;
        };
        Update: Partial<Vote>;
        Relationships: [];
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Omit<AuditLog, 'id' | 'changed_at'> & {
          id?: string;
          changed_at?: string;
        };
        Update: Partial<AuditLog>;
        Relationships: [];
      };
      member_audit_log: {
        Row: MemberAuditLog;
        Insert: Omit<MemberAuditLog, 'id' | 'changed_at'> & {
          id?: string;
          changed_at?: string;
        };
        Update: Partial<MemberAuditLog>;
        Relationships: [];
      };
      pending_member_registrations: {
        Row: PendingMemberRegistration;
        Insert: Omit<PendingMemberRegistration, 'id' | 'submitted_at' | 'created_at' | 'updated_at'> & {
          id?: string;
          submitted_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<PendingMemberRegistration>;
        Relationships: [];
      };
      zelle_payment_requests: {
        Row: ZellePaymentRequest;
        Insert: Omit<ZellePaymentRequest, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<ZellePaymentRequest>;
        Relationships: [];
      };
      // ---------------------------------------------------------------
      // Generated from the live schema (PostgREST OpenAPI) on 2026-09-01.
      // These 10 tables were queried in code but absent from this type, so
      // every .from() on them resolved to `never` -- roughly 400 of the
      // ~469 type errors this file was producing.
      // ---------------------------------------------------------------
      import_batches: {
        Row: {
          id: string;
          batch_number: string;
          file_name: string;
          imported_by: string | null;
          imported_by_name: string | null;
          total_records: number;
          successful_records: number;
          failed_records: number;
          status: string;
          notes: string | null;
          created_at: string | null;
          reverted_at: string | null;
          reverted_by: string | null;
          reverted_by_name: string | null;
        };
        Insert: Partial<Database['public']['Tables']['import_batches']['Row']>;
        Update: Partial<Database['public']['Tables']['import_batches']['Row']>;
        Relationships: [];
      };
      portal_settings: {
        Row: {
          id: string;
          setting_key: string;
          setting_value: Record<string, unknown>;
          setting_type: string;
          display_name: string;
          description: string | null;
          category: string;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['portal_settings']['Row']>;
        Update: Partial<Database['public']['Tables']['portal_settings']['Row']>;
        Relationships: [];
      };
      purohits: {
        Row: {
          id: string;
          name: string;
          bio: string | null;
          picture_url: string | null;
          profile_url: string | null;
          phone: string | null;
          email: string | null;
          specialties: string | null;
          is_active: boolean | null;
          display_order: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['purohits']['Row']>;
        Update: Partial<Database['public']['Tables']['purohits']['Row']>;
        Relationships: [];
      };
      service_booking_items: {
        Row: {
          id: string;
          booking_id: string;
          service_id: string;
          service_name: string;
          service_date: string;
          service_time: string | null;
          location_type: "Temple" | "External";
          service_address: string | null;
          purohit_id: string | null;
          purohit_name: string | null;
          item_amount: number;
          item_notes: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['service_booking_items']['Row']>;
        Update: Partial<Database['public']['Tables']['service_booking_items']['Row']>;
        Relationships: [];
      };
      service_bookings: {
        Row: {
          id: string;
          booking_number: string;
          member_id: string | null;
          membership_id: string | null;
          requester_name: string;
          requester_phone: string;
          requester_email: string;
          total_amount: number;
          status: "Pending Approval" | "Approved" | "Rejected" | "Paid" | "Completed" | "Cancelled" | null;
          submitted_at: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          reviewed_by_name: string | null;
          approval_notes: string | null;
          rejection_reason: string | null;
          payment_id: string | null;
          paid_at: string | null;
          completed_at: string | null;
          notes: string | null;
          internal_notes: string | null;
          is_walk_in: boolean | null;
          created_by: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['service_bookings']['Row']>;
        Update: Partial<Database['public']['Tables']['service_bookings']['Row']>;
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          name: string;
          display_name: string | null;
          description: string | null;
          category: "Puja" | "Other" | null;
          price_member_temple: number | null;
          price_community_temple: number | null;
          price_member_external: number | null;
          price_community_external: number | null;
          duration_minutes: number | null;
          preparation_notes: string | null;
          is_active: boolean | null;
          is_temple_only: boolean | null;
          requires_appointment: boolean | null;
          display_order: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['services']['Row']>;
        Update: Partial<Database['public']['Tables']['services']['Row']>;
        Relationships: [];
      };
      terms_acceptance_bypasses: {
        Row: {
          id: string;
          member_id: string | null;
          auth_user_id: string | null;
          terms_version: string;
          terms_content_id: string | null;
          bypassed_at: string;
          error_message: string | null;
          retry_count: number;
          ip_address: string | null;
          user_agent: string | null;
          resolved: boolean | null;
          resolved_at: string | null;
          resolved_by: string | null;
          resolution_notes: string | null;
          should_reprompt: boolean | null;
          reprompted_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['terms_acceptance_bypasses']['Row']>;
        Update: Partial<Database['public']['Tables']['terms_acceptance_bypasses']['Row']>;
        Relationships: [];
      };
      terms_acceptances: {
        Row: {
          id: string;
          member_id: string | null;
          auth_user_id: string | null;
          terms_version: string;
          terms_content_id: string | null;
          accepted_at: string;
          ip_address: string | null;
          user_agent: string | null;
          acceptance_method: string | null;
        };
        Insert: Partial<Database['public']['Tables']['terms_acceptances']['Row']>;
        Update: Partial<Database['public']['Tables']['terms_acceptances']['Row']>;
        Relationships: [];
      };
      terms_content: {
        Row: {
          id: string;
          version: string;
          title: string;
          content: string;
          content_format: string;
          is_active: boolean;
          effective_date: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['terms_content']['Row']>;
        Update: Partial<Database['public']['Tables']['terms_content']['Row']>;
        Relationships: [];
      };
      theme_definitions: {
        Row: {
          id: string;
          name: string;
          display_name: string;
          description: string | null;
          theme_type: string;
          css_variables: Record<string, unknown>;
          fonts: Record<string, unknown> | null;
          metadata: Record<string, unknown> | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          is_active: boolean | null;
        };
        Insert: Partial<Database['public']['Tables']['theme_definitions']['Row']>;
        Update: Partial<Database['public']['Tables']['theme_definitions']['Row']>;
        Relationships: [];
      };
    };

    Views: {};
    Functions: {
      generate_membership_id: {
        Args: { p_level: MembershipLevel };
        Returns: string;
      };
      get_user_roles: {
        Args: {};
        Returns: UserRole[];
      };
      has_role: {
        Args: { required_role: UserRole };
        Returns: boolean;
      };
      has_any_role: {
        Args: { required_roles: UserRole[] };
        Returns: boolean;
      };
      is_own_member_record: {
        Args: { member_id: string };
        Returns: boolean;
      };
      get_current_member_id: {
        Args: {};
        Returns: string;
      };
    };
    Enums: {
      nakshatra: Nakshatra;
      member_class: MemberClass;
      membership_level: MembershipLevel;
      membership_status: MembershipStatus;
      payment_method: PaymentMethod;
      payment_purpose: PaymentPurpose;
      request_status: RequestStatus;
      zelle_request_status: ZelleRequestStatus;
      user_role: UserRole;
      activity_type: ActivityType;
    };
  };
}
