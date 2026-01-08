-- ============================================================================
-- Update Constraints to Allow Test Accounts with Prefix 9
-- ============================================================================
-- This migration modifies the membership_id constraints to allow test accounts
-- to use prefix 9, bypassing the level-prefix matching requirement.

-- Step 1: Create is_test_account column if it doesn't exist
-- (This column will be used in the constraint, so it must exist first)
ALTER TABLE members ADD COLUMN IF NOT EXISTS is_test_account BOOLEAN DEFAULT FALSE;

-- Step 2: Drop existing constraints
ALTER TABLE members DROP CONSTRAINT IF EXISTS chk_membership_id_format;
ALTER TABLE members DROP CONSTRAINT IF EXISTS chk_membership_id_prefix;

-- Step 3: Add updated format constraint (allows prefix 9 for test accounts)
ALTER TABLE members ADD CONSTRAINT chk_membership_id_format CHECK (
  membership_id ~ '^[1-39][0-9]{5}00$'
);

-- Step 4: Add updated prefix constraint (test accounts bypass level matching)
ALTER TABLE members ADD CONSTRAINT chk_membership_id_prefix CHECK (
  is_test_account = TRUE OR (
    (current_level = 'Lifetime' AND LEFT(membership_id, 1) = '1') OR
    (current_level = 'Annual' AND LEFT(membership_id, 1) = '2') OR
    (current_level = 'Community' AND LEFT(membership_id, 1) = '3')
  )
);

-- Step 5: Update trigger function to skip validation for test accounts
CREATE OR REPLACE FUNCTION validate_membership_id_on_level_change()
RETURNS TRIGGER AS $$
DECLARE
  v_expected_prefix CHAR(1);
  v_actual_prefix CHAR(1);
BEGIN
  -- Skip validation for test accounts
  IF NEW.is_test_account = TRUE THEN
    RETURN NEW;
  END IF;

  -- Determine expected prefix for regular accounts
  v_expected_prefix := CASE NEW.current_level
    WHEN 'Lifetime' THEN '1'
    WHEN 'Annual' THEN '2'
    WHEN 'Community' THEN '3'
  END;

  v_actual_prefix := LEFT(NEW.membership_id, 1);

  -- Validate prefix matches level for regular accounts
  IF v_actual_prefix != v_expected_prefix THEN
    RAISE EXCEPTION 'MembershipID prefix (%) does not match level (%). Expected prefix: %',
      v_actual_prefix, NEW.current_level, v_expected_prefix;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON CONSTRAINT chk_membership_id_format ON members IS 
  'Membership ID format: 8 digits starting with 1-3 (regular) or 9 (test), ending with 00';
COMMENT ON CONSTRAINT chk_membership_id_prefix ON members IS 
  'Prefix must match level for regular accounts. Test accounts (prefix 9) bypass this check.';
