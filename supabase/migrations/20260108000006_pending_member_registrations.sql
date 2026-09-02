-- ============================================================================
-- Pending Member Registrations System
-- ============================================================================
-- This table stores self-service member registration requests that need
-- office approval before creating actual member records.

-- Create pending member registrations table
CREATE TABLE IF NOT EXISTS pending_member_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Registration Type
  member_class member_class NOT NULL DEFAULT 'Personal',
  requested_level membership_level NOT NULL DEFAULT 'Community',

  -- Personal Information (for Personal class)
  first_name TEXT,
  last_name TEXT,
  date_of_birth DATE,
  nakshatra nakshatra,
  family_gotra TEXT,

  -- Spouse/Secondary Information (optional)
  secondary_first_name TEXT,
  secondary_last_name TEXT,
  secondary_date_of_birth DATE,
  secondary_nakshatra nakshatra,

  -- Business Information (for Business class)
  business_name TEXT,
  business_ein TEXT,
  business_type TEXT,

  -- Contact Information
  primary_email TEXT NOT NULL,
  primary_phone TEXT,
  secondary_email TEXT,
  secondary_phone TEXT,

  -- Address
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT DEFAULT 'USA',

  -- Additional Information
  how_did_you_hear TEXT, -- How they heard about HSNEF
  notes TEXT, -- Any additional notes from applicant

  -- Status Tracking
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Contacted')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  -- If approved, link to created member
  created_member_id UUID REFERENCES members(id),
  assigned_membership_id VARCHAR(8),

  -- Timestamps
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT chk_personal_requires_name CHECK (
    member_class != 'Personal' OR (first_name IS NOT NULL AND last_name IS NOT NULL)
  ),
  CONSTRAINT chk_business_requires_name CHECK (
    member_class != 'Business' OR business_name IS NOT NULL
  )
);

-- Create indexes
CREATE INDEX idx_pending_registrations_status ON pending_member_registrations(status);
CREATE INDEX idx_pending_registrations_email ON pending_member_registrations(primary_email);
CREATE INDEX idx_pending_registrations_submitted ON pending_member_registrations(submitted_at DESC);

-- Create updated_at trigger
CREATE TRIGGER update_pending_registrations_updated_at
  BEFORE UPDATE ON pending_member_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE pending_member_registrations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public registration)
CREATE POLICY "Anyone can submit registration"
  ON pending_member_registrations
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow staff to view all registrations
CREATE POLICY "Staff can view all registrations"
  ON pending_member_registrations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('Office Staff', 'Office Manager', 'Admin')
    )
  );

-- Allow staff to update registrations (review, approve, reject)
CREATE POLICY "Staff can update registrations"
  ON pending_member_registrations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('Office Staff', 'Office Manager', 'Admin')
    )
  );

-- Comments
COMMENT ON TABLE pending_member_registrations IS 'Stores member registration requests awaiting office approval';
COMMENT ON COLUMN pending_member_registrations.status IS 'Registration status: Pending (awaiting review), Contacted (staff reached out), Approved (member created), Rejected (not approved)';
COMMENT ON COLUMN pending_member_registrations.how_did_you_hear IS 'How the applicant heard about HSNEF - for marketing tracking';
