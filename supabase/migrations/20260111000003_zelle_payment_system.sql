-- ============================================================================
-- Zelle Payment System
-- ============================================================================
-- This migration adds support for UPI-like Zelle payment experience with:
-- - Zelle payment requests table for tracking pending payments
-- - Portal settings for Zelle configuration
-- - Enum for payment request status

-- Create status enum for Zelle payment requests
DO $$ BEGIN
  CREATE TYPE zelle_request_status AS ENUM (
    'pending',           -- Request created, awaiting member action
    'member_confirmed',  -- Member marked as sent, awaiting staff confirmation
    'staff_confirmed',   -- Staff confirmed receipt, payment complete
    'auto_confirmed',    -- Auto-confirmed (under threshold)
    'cancelled',         -- Cancelled by member or staff
    'expired'            -- Request expired without completion
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create Zelle payment requests table
CREATE TABLE IF NOT EXISTS zelle_payment_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Unique reference code for this payment (e.g., "HSNEF-Z-A7X3")
  reference_code VARCHAR(20) NOT NULL UNIQUE,

  -- Member making the payment (nullable for walk-in scenarios)
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,

  -- Payment details
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  purpose TEXT NOT NULL CHECK (purpose IN ('Membership', 'Event', 'Donation', 'Sponsorship', 'Request', 'Service')),
  description TEXT,

  -- Optional links to existing records
  request_id UUID REFERENCES requests(id) ON DELETE SET NULL,
  event_registration_id UUID REFERENCES event_registrations(id) ON DELETE SET NULL,
  service_booking_id UUID REFERENCES service_bookings(id) ON DELETE SET NULL,

  -- Status tracking
  status zelle_request_status NOT NULL DEFAULT 'pending',
  member_confirmed_at TIMESTAMPTZ,
  member_zelle_reference TEXT,  -- Reference the member provides from their bank
  staff_confirmed_at TIMESTAMPTZ,
  staff_confirmed_by UUID REFERENCES auth.users(id),
  staff_notes TEXT,

  -- Expiration and QR
  expires_at TIMESTAMPTZ NOT NULL,
  qr_token TEXT,  -- JWT token encoded in QR code

  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Final payment record (set when confirmed)
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL
);

-- Create indexes for efficient queries
CREATE INDEX idx_zelle_requests_reference ON zelle_payment_requests(reference_code);
CREATE INDEX idx_zelle_requests_member ON zelle_payment_requests(member_id);
CREATE INDEX idx_zelle_requests_status ON zelle_payment_requests(status);
CREATE INDEX idx_zelle_requests_expires ON zelle_payment_requests(expires_at);
CREATE INDEX idx_zelle_requests_created ON zelle_payment_requests(created_at DESC);

-- Create updated_at trigger
CREATE TRIGGER update_zelle_payment_requests_updated_at
  BEFORE UPDATE ON zelle_payment_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE zelle_payment_requests ENABLE ROW LEVEL SECURITY;

-- Members can view their own payment requests
CREATE POLICY "Members can view their own Zelle requests"
  ON zelle_payment_requests
  FOR SELECT
  TO authenticated
  USING (
    member_id IN (
      SELECT id FROM members WHERE auth_user_id = auth.uid()
    )
  );

-- Staff can view all Zelle requests
CREATE POLICY "Staff can view all Zelle requests"
  ON zelle_payment_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('Office Staff', 'Office Manager', 'Admin')
    )
  );

-- Staff can create Zelle requests
CREATE POLICY "Staff can create Zelle requests"
  ON zelle_payment_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('Office Staff', 'Office Manager', 'Admin')
    )
  );

-- Members can create their own Zelle requests (for self-service payments)
CREATE POLICY "Members can create own Zelle requests"
  ON zelle_payment_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    member_id IN (
      SELECT id FROM members WHERE auth_user_id = auth.uid()
    )
  );

-- Members can update their own pending requests (to confirm)
CREATE POLICY "Members can update own pending Zelle requests"
  ON zelle_payment_requests
  FOR UPDATE
  TO authenticated
  USING (
    member_id IN (
      SELECT id FROM members WHERE auth_user_id = auth.uid()
    )
    AND status = 'pending'
  );

-- Staff can update any Zelle request
CREATE POLICY "Staff can update Zelle requests"
  ON zelle_payment_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('Office Staff', 'Office Manager', 'Admin')
    )
  );

-- Function to generate unique reference codes
CREATE OR REPLACE FUNCTION generate_zelle_reference_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Generate a reference like "HSNEF-Z-A7X3"
    code := 'HSNEF-Z-' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 4));

    -- Check if this code already exists
    SELECT EXISTS(
      SELECT 1 FROM zelle_payment_requests WHERE reference_code = code
    ) INTO exists_check;

    -- Exit loop if code is unique
    EXIT WHEN NOT exists_check;
  END LOOP;

  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Add Zelle settings to portal_settings
INSERT INTO portal_settings (setting_key, setting_value, setting_type, display_name, description, category)
VALUES
  (
    'zelle_enabled',
    '{"enabled": true}'::jsonb,
    'boolean',
    'Enable Zelle Payments',
    'Allow members to pay via Zelle. When enabled, Zelle will appear as a payment option alongside card payments.',
    'payments'
  ),
  (
    'zelle_email',
    '{"value": ""}'::jsonb,
    'string',
    'Zelle Email Address',
    'The email address registered with Zelle to receive payments.',
    'payments'
  ),
  (
    'zelle_phone',
    '{"value": ""}'::jsonb,
    'string',
    'Zelle Phone Number',
    'The phone number registered with Zelle to receive payments (optional, as alternative to email).',
    'payments'
  ),
  (
    'zelle_auto_confirm_threshold',
    '{"value": 50}'::jsonb,
    'number',
    'Auto-Confirm Threshold ($)',
    'Payments at or below this amount will be automatically confirmed when the member marks them as sent. Payments above this amount require staff confirmation.',
    'payments'
  ),
  (
    'zelle_request_expiry_hours',
    '{"value": 48}'::jsonb,
    'number',
    'Payment Request Expiry (Hours)',
    'Number of hours before an uncompleted Zelle payment request expires.',
    'payments'
  ),
  (
    'zelle_instructions',
    '{"value": "Please send your Zelle payment and include the reference code in the memo field. This helps us match your payment to your account."}'::jsonb,
    'string',
    'Zelle Payment Instructions',
    'Custom instructions displayed to members when paying via Zelle.',
    'payments'
  )
ON CONFLICT (setting_key) DO NOTHING;

-- Comments
COMMENT ON TABLE zelle_payment_requests IS 'Tracks Zelle payment requests for UPI-like payment experience';
COMMENT ON COLUMN zelle_payment_requests.reference_code IS 'Unique code member includes in Zelle memo for payment matching';
COMMENT ON COLUMN zelle_payment_requests.status IS 'Current status of the payment request';
COMMENT ON COLUMN zelle_payment_requests.member_zelle_reference IS 'Reference/confirmation number from member bank after sending';
COMMENT ON COLUMN zelle_payment_requests.qr_token IS 'JWT token for QR code verification';
