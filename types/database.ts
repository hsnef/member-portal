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

export type UserRole = 'Member' | 'Office Staff' | 'Office Manager' | 'Admin';

export type ActivityType = 'Visit' | 'Puja' | 'Event' | 'Donation' | 'Service' | 'Membership';

export interface Member {
  id: string;
  auth_user_id: string | null;
  membership_id: string;
  legacy_id: string | null;
  member_class: MemberClass;
  current_level: MembershipLevel;
  is_founding_member: boolean;

  // Personal fields
  profile_name: string | null;
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

export interface FamilyMember {
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

export interface BusinessContact {
  id: string;
  business_member_id: string;
  contact_member_id: string;
  is_primary: boolean;
  created_at: string;
}

export interface Membership {
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

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  granted_at: string;
  granted_by: string | null;
}

export interface Request {
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

export interface Payment {
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

export interface Receipt {
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

export interface Event {
  id: string;
  name: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  location: string | null;
  registration_required: boolean;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  max_attendees: number | null;
  price_per_person: number | null;
  member_discount_percent: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface EventRegistration {
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
}

export interface LedgerEntry {
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

export interface LoginAuditLog {
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

export interface RegistrationInvitation {
  id: string;
  member_id: string;
  email: string;
  token: string;
  expires_at: string;
  invited_at: string;
  invited_by: string | null;
  accepted_at: string | null;
}

export interface Election {
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

export interface ElectionOption {
  id: string;
  election_id: string;
  option_text: string;
  display_order: number;
  created_at: string;
}

export interface Vote {
  id: string;
  election_id: string;
  member_id: string;
  election_option_id: string | null;
  voted_at: string;
}

export interface AuditLog {
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

export interface MemberAuditLog {
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

export interface PendingMemberRegistration {
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

// Database schema type for Supabase client
export interface Database {
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
      };
      family_members: {
        Row: FamilyMember;
        Insert: Omit<FamilyMember, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<FamilyMember>;
      };
      business_contacts: {
        Row: BusinessContact;
        Insert: Omit<BusinessContact, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<BusinessContact>;
      };
      memberships: {
        Row: Membership;
        Insert: Omit<Membership, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Membership>;
      };
      user_roles: {
        Row: UserRoleRecord;
        Insert: Omit<UserRoleRecord, 'id' | 'granted_at'> & {
          id?: string;
          granted_at?: string;
        };
        Update: Partial<UserRoleRecord>;
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
      };
      payments: {
        Row: Payment;
        Insert: Omit<Payment, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Payment>;
      };
      receipts: {
        Row: Receipt;
        Insert: Omit<Receipt, 'id' | 'receipt_number' | 'created_at'> & {
          id?: string;
          receipt_number?: string;
          created_at?: string;
        };
        Update: Partial<Receipt>;
      };
      events: {
        Row: Event;
        Insert: Omit<Event, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Event>;
      };
      event_registrations: {
        Row: EventRegistration;
        Insert: Omit<EventRegistration, 'id' | 'total_attendees' | 'registered_at'> & {
          id?: string;
          registered_at?: string;
        };
        Update: Partial<EventRegistration>;
      };
      ledger_entries: {
        Row: LedgerEntry;
        Insert: Omit<LedgerEntry, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<LedgerEntry>;
      };
      login_audit_logs: {
        Row: LoginAuditLog;
        Insert: Omit<LoginAuditLog, 'id' | 'login_at'> & {
          id?: string;
          login_at?: string;
        };
        Update: Partial<LoginAuditLog>;
      };
      registration_invitations: {
        Row: RegistrationInvitation;
        Insert: Omit<RegistrationInvitation, 'id' | 'invited_at'> & {
          id?: string;
          invited_at?: string;
        };
        Update: Partial<RegistrationInvitation>;
      };
      elections: {
        Row: Election;
        Insert: Omit<Election, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Election>;
      };
      election_options: {
        Row: ElectionOption;
        Insert: Omit<ElectionOption, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<ElectionOption>;
      };
      votes: {
        Row: Vote;
        Insert: Omit<Vote, 'id' | 'voted_at'> & {
          id?: string;
          voted_at?: string;
        };
        Update: Partial<Vote>;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Omit<AuditLog, 'id' | 'changed_at'> & {
          id?: string;
          changed_at?: string;
        };
        Update: Partial<AuditLog>;
      };
      member_audit_log: {
        Row: MemberAuditLog;
        Insert: Omit<MemberAuditLog, 'id' | 'changed_at'> & {
          id?: string;
          changed_at?: string;
        };
        Update: Partial<MemberAuditLog>;
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
      user_role: UserRole;
      activity_type: ActivityType;
    };
  };
}
