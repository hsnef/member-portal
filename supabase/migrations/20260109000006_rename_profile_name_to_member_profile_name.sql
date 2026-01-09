-- Rename profile_name to member_profile_name for clarity
-- This matches the CSV import template column name

-- Check if column exists before renaming
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'members' AND column_name = 'profile_name'
  ) THEN
    ALTER TABLE members RENAME COLUMN profile_name TO member_profile_name;
  END IF;
END $$;

-- Add comment
COMMENT ON COLUMN members.member_profile_name IS 'Display name for the member profile (e.g., "John & Jane Doe Family")';
