-- ============================================================================
-- HSNEF Membership Portal - Initial Schema Migration
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS AND TYPES
-- ============================================================================

-- Nakshatra (27 birth stars)
CREATE TYPE nakshatra AS ENUM (
  'Ashwini',
  'Bharani',
  'Krittika',
  'Rohini',
  'Mrigashirsha',
  'Ardra',
  'Punarvasu',
  'Pushya',
  'Ashlesha',
  'Magha',
  'Purva Phalguni',
  'Uttara Phalguni',
  'Hasta',
  'Chitra',
  'Swati',
  'Vishakha',
  'Anuradha',
  'Jyeshta',
  'Moola',
  'Purva Ashadha',
  'Uttara Ashadha',
  'Shravana',
  'Dhanishta',
  'Shatabhisha',
  'Purva Bhadrapada',
  'Uttara Bhadrapada',
  'Revati'
);

-- Membership class (Personal or Business)
CREATE TYPE member_class AS ENUM ('Personal', 'Business');

-- Membership level
CREATE TYPE membership_level AS ENUM ('Community', 'Annual', 'Lifetime');

-- Membership status
CREATE TYPE membership_status AS ENUM ('Active', 'Expired', 'Cancelled', 'Pending');

-- Payment method
CREATE TYPE payment_method AS ENUM ('Stripe', 'Cash', 'Check', 'Zelle');

-- Payment purpose
CREATE TYPE payment_purpose AS ENUM ('Membership', 'Event', 'Donation', 'Sponsorship', 'Request', 'Service');

-- Request status
CREATE TYPE request_status AS ENUM ('Draft', 'Sent', 'Partially Paid', 'Paid', 'Cancelled', 'Expired');

-- User roles
CREATE TYPE user_role AS ENUM ('Member', 'Office Staff', 'Office Manager', 'Admin');

-- Activity type
CREATE TYPE activity_type AS ENUM ('Visit', 'Puja', 'Event', 'Donation', 'Service', 'Membership');

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Members table (both Personal and Business)
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- MembershipID: 8 digits, first digit = 1/2/3, ends with 00
  membership_id VARCHAR(8) NOT NULL UNIQUE,
  legacy_id VARCHAR(50), -- Original ID from Excel import

  -- Member classification
  member_class member_class NOT NULL DEFAULT 'Personal',
  current_level membership_level NOT NULL DEFAULT 'Community',

  -- Founding member flag (for Lifetime members)
  is_founding_member BOOLEAN NOT NULL DEFAULT FALSE,

  -- Personal membership fields
  profile_name TEXT, -- Joint name like "Manish & Vandana Sharma"
  first_name TEXT,
  last_name TEXT,
  nakshatra nakshatra,
  family_gotra TEXT,

  -- Secondary/spouse information (Personal only)
  secondary_first_name TEXT,
  secondary_last_name TEXT,
  secondary_nakshatra nakshatra,
  secondary_email TEXT,
  secondary_phone TEXT,

  -- Business membership fields
  business_name TEXT,
  business_ein TEXT,

  -- Contact information
  primary_email TEXT NOT NULL,
  primary_phone TEXT,
  primary_phone_2 TEXT,

  -- Address
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT DEFAULT 'USA',
  mailing_address TEXT, -- Unified address field

  -- Dates and metadata
  member_since DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),

  -- Constraints
  CONSTRAINT chk_membership_id_format CHECK (
    membership_id ~ '^[1-3][0-9]{5}00$'
  ),
  CONSTRAINT chk_membership_id_prefix CHECK (
    (current_level = 'Lifetime' AND LEFT(membership_id, 1) = '1') OR
    (current_level = 'Annual' AND LEFT(membership_id, 1) = '2') OR
    (current_level = 'Community' AND LEFT(membership_id, 1) = '3')
  ),
  CONSTRAINT chk_personal_fields CHECK (
    member_class = 'Business' OR (first_name IS NOT NULL AND last_name IS NOT NULL)
  ),
  CONSTRAINT chk_business_fields CHECK (
    member_class = 'Personal' OR business_name IS NOT NULL
  ),
  CONSTRAINT chk_founding_member CHECK (
    is_founding_member = FALSE OR current_level = 'Lifetime'
  )
);

-- Create indexes on members
CREATE INDEX idx_members_auth_user_id ON members(auth_user_id);
CREATE INDEX idx_members_membership_id ON members(membership_id);
CREATE INDEX idx_members_primary_email ON members(primary_email);
CREATE INDEX idx_members_current_level ON members(current_level);
CREATE INDEX idx_members_member_class ON members(member_class);
CREATE INDEX idx_members_last_name ON members(last_name);
CREATE INDEX idx_members_business_name ON members(business_name);

-- Business contacts table (links Business members to Personal member contacts)
CREATE TABLE business_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  contact_member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_business_contact_different CHECK (business_member_id != contact_member_id),
  CONSTRAINT uq_primary_contact UNIQUE (business_member_id, is_primary)
);

CREATE INDEX idx_business_contacts_business ON business_contacts(business_member_id);
CREATE INDEX idx_business_contacts_contact ON business_contacts(contact_member_id);

-- Family members table (for Personal memberships)
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  nakshatra nakshatra,
  email TEXT,
  relationship TEXT, -- Child, Spouse, Parent, etc.
  date_of_birth DATE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_family_member_personal CHECK (
    (SELECT member_class FROM members WHERE id = member_id) = 'Personal'
  )
);

CREATE INDEX idx_family_members_member_id ON family_members(member_id);

-- Memberships table (tracks Annual and Lifetime membership history)
CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  level membership_level NOT NULL,
  status membership_status NOT NULL DEFAULT 'Pending',

  -- For Annual: year of membership
  year INTEGER,
  start_date DATE NOT NULL,
  end_date DATE,

  -- Payment reference
  payment_id UUID, -- Will reference payments table
  amount DECIMAL(10, 2) NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_annual_has_year CHECK (
    level != 'Annual' OR year IS NOT NULL
  ),
  CONSTRAINT chk_lifetime_no_end CHECK (
    level != 'Lifetime' OR end_date IS NULL
  )
);

CREATE INDEX idx_memberships_member_id ON memberships(member_id);
CREATE INDEX idx_memberships_year ON memberships(year);
CREATE INDEX idx_memberships_status ON memberships(status);

-- User roles table
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'Member',

  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users(id),

  CONSTRAINT uq_user_role UNIQUE (user_id, role)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);

-- Requests table (payment requests/invoices)
CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_number TEXT NOT NULL UNIQUE, -- Human-readable request ID

  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  contact_email TEXT, -- For non-members
  contact_name TEXT,

  purpose payment_purpose NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',

  status request_status NOT NULL DEFAULT 'Draft',
  due_date DATE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),

  CONSTRAINT chk_amount_positive CHECK (amount > 0)
);

CREATE INDEX idx_requests_member_id ON requests(member_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_request_number ON requests(request_number);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  member_id UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
  request_id UUID REFERENCES requests(id) ON DELETE SET NULL,

  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',

  method payment_method NOT NULL,
  purpose payment_purpose NOT NULL,

  -- Stripe fields
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,

  -- Offline payment fields
  check_number TEXT,
  zelle_reference TEXT,
  notes TEXT,

  payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  CONSTRAINT chk_payment_amount_positive CHECK (amount > 0),
  CONSTRAINT chk_stripe_fields CHECK (
    method != 'Stripe' OR stripe_payment_intent_id IS NOT NULL
  )
);

CREATE INDEX idx_payments_member_id ON payments(member_id);
CREATE INDEX idx_payments_request_id ON payments(request_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_payments_stripe_intent ON payments(stripe_payment_intent_id);

-- Add foreign key to memberships
ALTER TABLE memberships ADD CONSTRAINT fk_memberships_payment
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL;

-- Receipts table
CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receipt_number TEXT NOT NULL UNIQUE, -- Human-readable receipt ID

  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,

  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  payment_method payment_method NOT NULL,
  purpose payment_purpose NOT NULL,

  receipt_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  email_sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_receipt_amount_positive CHECK (amount > 0)
);

CREATE INDEX idx_receipts_payment_id ON receipts(payment_id);
CREATE INDEX idx_receipts_member_id ON receipts(member_id);
CREATE INDEX idx_receipts_receipt_number ON receipts(receipt_number);
CREATE INDEX idx_receipts_receipt_date ON receipts(receipt_date);

-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  name TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  location TEXT,

  -- Registration settings
  registration_required BOOLEAN NOT NULL DEFAULT FALSE,
  registration_opens_at TIMESTAMPTZ,
  registration_closes_at TIMESTAMPTZ,
  max_attendees INTEGER,

  -- Pricing
  price_per_person DECIMAL(10, 2),
  member_discount_percent INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  CONSTRAINT chk_event_price CHECK (price_per_person IS NULL OR price_per_person >= 0),
  CONSTRAINT chk_discount CHECK (member_discount_percent >= 0 AND member_discount_percent <= 100)
);

CREATE INDEX idx_events_event_date ON events(event_date);

-- Event registrations table
CREATE TABLE event_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  -- Attendees
  primary_attendee_count INTEGER NOT NULL DEFAULT 1,
  family_attendee_count INTEGER NOT NULL DEFAULT 0,
  guest_attendee_count INTEGER NOT NULL DEFAULT 0,
  total_attendees INTEGER GENERATED ALWAYS AS (
    primary_attendee_count + family_attendee_count + guest_attendee_count
  ) STORED,

  -- Payment
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  amount_paid DECIMAL(10, 2),

  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_attendee_counts CHECK (
    primary_attendee_count >= 0 AND
    family_attendee_count >= 0 AND
    guest_attendee_count >= 0
  )
);

CREATE INDEX idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_member_id ON event_registrations(member_id);

-- Ledger entries (activity log)
CREATE TABLE ledger_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  activity_type activity_type NOT NULL,

  description TEXT NOT NULL,
  amount DECIMAL(10, 2),

  -- References
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  request_id UUID REFERENCES requests(id) ON DELETE SET NULL,

  activity_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ledger_entries_member_id ON ledger_entries(member_id);
CREATE INDEX idx_ledger_entries_activity_date ON ledger_entries(activity_date);
CREATE INDEX idx_ledger_entries_activity_type ON ledger_entries(activity_type);

-- Login audit logs
CREATE TABLE login_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,

  login_method TEXT NOT NULL, -- 'email', 'google', 'membership_number'
  ip_address INET,
  user_agent TEXT,
  geo_country TEXT,
  geo_city TEXT,

  success BOOLEAN NOT NULL DEFAULT TRUE,
  failure_reason TEXT,

  login_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_login_audit_auth_user ON login_audit_logs(auth_user_id);
CREATE INDEX idx_login_audit_member ON login_audit_logs(member_id);
CREATE INDEX idx_login_audit_login_at ON login_audit_logs(login_at);

-- Email invitations / registration tokens
CREATE TABLE registration_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  email TEXT NOT NULL,

  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,

  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  invited_by UUID REFERENCES auth.users(id),

  accepted_at TIMESTAMPTZ,

  CONSTRAINT chk_token_not_empty CHECK (LENGTH(token) > 0)
);

CREATE INDEX idx_registration_invitations_member_id ON registration_invitations(member_id);
CREATE INDEX idx_registration_invitations_token ON registration_invitations(token);
CREATE INDEX idx_registration_invitations_email ON registration_invitations(email);

-- ============================================================================
-- VOTING MODULE (Phase 2 - Schema only)
-- ============================================================================

-- Elections/polls table
CREATE TABLE elections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  title TEXT NOT NULL,
  description TEXT,

  -- Eligibility
  eligible_levels membership_level[] NOT NULL DEFAULT ARRAY['Lifetime', 'Annual']::membership_level[],

  -- Dates
  opens_at TIMESTAMPTZ NOT NULL,
  closes_at TIMESTAMPTZ NOT NULL,

  -- Settings
  allow_abstain BOOLEAN NOT NULL DEFAULT FALSE,
  results_public BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  CONSTRAINT chk_election_dates CHECK (closes_at > opens_at)
);

CREATE INDEX idx_elections_opens_at ON elections(opens_at);
CREATE INDEX idx_elections_closes_at ON elections(closes_at);

-- Election options
CREATE TABLE election_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_election_option UNIQUE (election_id, display_order)
);

CREATE INDEX idx_election_options_election_id ON election_options(election_id);

-- Votes (one per member per election)
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  election_option_id UUID REFERENCES election_options(id) ON DELETE CASCADE,

  voted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_vote_per_member UNIQUE (election_id, member_id)
);

CREATE INDEX idx_votes_election_id ON votes(election_id);
CREATE INDEX idx_votes_member_id ON votes(member_id);

-- ============================================================================
-- AUDIT LOG TABLE (for data changes)
-- ============================================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,

  action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  old_values JSONB,
  new_values JSONB,

  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  reason TEXT
);

CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_changed_at ON audit_logs(changed_at);
CREATE INDEX idx_audit_logs_changed_by ON audit_logs(changed_by);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_family_members_updated_at BEFORE UPDATE ON family_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate next membership ID for a given level
CREATE OR REPLACE FUNCTION generate_membership_id(p_level membership_level)
RETURNS VARCHAR(8) AS $$
DECLARE
  v_prefix CHAR(1);
  v_next_number INTEGER;
  v_membership_id VARCHAR(8);
BEGIN
  -- Determine prefix based on level
  v_prefix := CASE p_level
    WHEN 'Lifetime' THEN '1'
    WHEN 'Annual' THEN '2'
    WHEN 'Community' THEN '3'
  END;

  -- Find the maximum existing number for this prefix
  SELECT COALESCE(MAX(SUBSTRING(membership_id FROM 2 FOR 5)::INTEGER), 0) + 1
  INTO v_next_number
  FROM members
  WHERE LEFT(membership_id, 1) = v_prefix;

  -- Format as 8 digits: prefix + 5 digits + '00'
  v_membership_id := v_prefix || LPAD(v_next_number::TEXT, 5, '0') || '00';

  RETURN v_membership_id;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate membership_id if not provided
CREATE OR REPLACE FUNCTION auto_generate_membership_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.membership_id IS NULL OR NEW.membership_id = '' THEN
    NEW.membership_id := generate_membership_id(NEW.current_level);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate membership_id
CREATE TRIGGER trigger_auto_generate_membership_id
  BEFORE INSERT ON members
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_membership_id();

-- Function to validate membership_id prefix matches level on update
CREATE OR REPLACE FUNCTION validate_membership_id_on_level_change()
RETURNS TRIGGER AS $$
DECLARE
  v_expected_prefix CHAR(1);
  v_actual_prefix CHAR(1);
BEGIN
  -- Determine expected prefix
  v_expected_prefix := CASE NEW.current_level
    WHEN 'Lifetime' THEN '1'
    WHEN 'Annual' THEN '2'
    WHEN 'Community' THEN '3'
  END;

  v_actual_prefix := LEFT(NEW.membership_id, 1);

  IF v_actual_prefix != v_expected_prefix THEN
    RAISE EXCEPTION 'MembershipID prefix (%) does not match level (%). Expected prefix: %',
      v_actual_prefix, NEW.current_level, v_expected_prefix;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate membership_id on level change
CREATE TRIGGER trigger_validate_membership_id_level
  BEFORE UPDATE OF current_level ON members
  FOR EACH ROW
  WHEN (OLD.current_level IS DISTINCT FROM NEW.current_level)
  EXECUTE FUNCTION validate_membership_id_on_level_change();

-- Function to auto-generate request number
CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TEXT AS $$
DECLARE
  v_year TEXT;
  v_sequence INTEGER;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');

  SELECT COALESCE(MAX(SUBSTRING(request_number FROM 5)::INTEGER), 0) + 1
  INTO v_sequence
  FROM requests
  WHERE request_number LIKE 'REQ-' || v_year || '%';

  RETURN 'REQ-' || v_year || '-' || LPAD(v_sequence::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate request_number
CREATE OR REPLACE FUNCTION auto_generate_request_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.request_number IS NULL OR NEW.request_number = '' THEN
    NEW.request_number := generate_request_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_request_number
  BEFORE INSERT ON requests
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_request_number();

-- Function to auto-generate receipt number
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TEXT AS $$
DECLARE
  v_year TEXT;
  v_sequence INTEGER;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');

  SELECT COALESCE(MAX(SUBSTRING(receipt_number FROM 5)::INTEGER), 0) + 1
  INTO v_sequence
  FROM receipts
  WHERE receipt_number LIKE 'RCP-' || v_year || '%';

  RETURN 'RCP-' || v_year || '-' || LPAD(v_sequence::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate receipt_number
CREATE OR REPLACE FUNCTION auto_generate_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.receipt_number IS NULL OR NEW.receipt_number = '' THEN
    NEW.receipt_number := generate_receipt_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_receipt_number
  BEFORE INSERT ON receipts
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_receipt_number();

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Create default admin role (you'll need to update user_id after first admin signs up)
-- This is just a placeholder structure
COMMENT ON TABLE user_roles IS 'First admin user should be manually assigned Admin role after signup';

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE members IS 'Core members table supporting both Personal and Business memberships';
COMMENT ON COLUMN members.membership_id IS '8-digit ID: first digit = level (1=Lifetime, 2=Annual, 3=Community), ends with 00';
COMMENT ON COLUMN members.is_founding_member IS 'Flag to mark Lifetime members as founding members';
COMMENT ON TABLE family_members IS 'Family members for Personal memberships (spouse, children)';
COMMENT ON TABLE business_contacts IS 'Links Business memberships to Personal member contacts';
COMMENT ON TABLE memberships IS 'Tracks Annual and Lifetime membership history/records';
COMMENT ON TABLE payments IS 'All payments (Stripe, Cash, Check, Zelle)';
COMMENT ON TABLE receipts IS 'Payment receipts - immutable records';
COMMENT ON TABLE requests IS 'Payment requests/invoices sent to members';
COMMENT ON TABLE ledger_entries IS 'Activity ledger for all member transactions and activities';
COMMENT ON TABLE login_audit_logs IS 'Audit log for all login attempts';
COMMENT ON TABLE audit_logs IS 'Audit trail for data changes';
