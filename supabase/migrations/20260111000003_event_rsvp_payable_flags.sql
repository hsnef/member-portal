-- Migration: Add RSVP and payable flags to events table
-- rsvp_enabled: Controls whether members can register for the event
-- is_payable: Controls whether payment is required

-- Add rsvp_enabled column (default true for backward compatibility)
ALTER TABLE events
ADD COLUMN IF NOT EXISTS rsvp_enabled BOOLEAN NOT NULL DEFAULT true;

-- Add is_payable column (default false - free events by default)
ALTER TABLE events
ADD COLUMN IF NOT EXISTS is_payable BOOLEAN NOT NULL DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN events.rsvp_enabled IS 'When true, members can register/RSVP for this event. When false, event is informational only.';
COMMENT ON COLUMN events.is_payable IS 'When true, registration requires payment.';

-- Update existing events to set is_payable based on existing price columns
-- This handles both possible schema versions (member_price or price_per_person)
DO $$
BEGIN
  -- Try updating based on member_price/non_member_price columns (newer schema)
  BEGIN
    UPDATE events
    SET is_payable = true
    WHERE (member_price > 0 OR non_member_price > 0);
    RAISE NOTICE 'Updated is_payable based on member_price/non_member_price columns';
  EXCEPTION WHEN undefined_column THEN
    -- If those columns don't exist, try price_per_person (original schema)
    BEGIN
      UPDATE events
      SET is_payable = true
      WHERE price_per_person > 0;
      RAISE NOTICE 'Updated is_payable based on price_per_person column';
    EXCEPTION WHEN undefined_column THEN
      RAISE NOTICE 'No price columns found, is_payable defaults to false for all events';
    END;
  END;
END $$;
