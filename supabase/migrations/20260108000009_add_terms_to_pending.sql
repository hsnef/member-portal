-- Add terms acceptance fields to pending_member_registrations
-- This allows us to track that applicant accepted terms during registration
-- When application is approved and member created, we create the actual acceptance record

ALTER TABLE pending_member_registrations
ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS terms_version VARCHAR(20),
ADD COLUMN IF NOT EXISTS terms_content_id UUID REFERENCES terms_content(id);

COMMENT ON COLUMN pending_member_registrations.terms_accepted IS 'Whether applicant accepted terms during registration';
COMMENT ON COLUMN pending_member_registrations.terms_version IS 'Version of terms accepted during registration';
COMMENT ON COLUMN pending_member_registrations.terms_content_id IS 'ID of terms content accepted during registration';
