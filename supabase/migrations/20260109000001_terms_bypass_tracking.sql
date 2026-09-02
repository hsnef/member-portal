-- Terms Acceptance Bypass Tracking
-- Tracks when users bypass terms acceptance due to technical errors
-- This allows admin review and ensures re-prompting on next login

CREATE TABLE IF NOT EXISTS terms_acceptance_bypasses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User identification
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  auth_user_id UUID REFERENCES auth.users(id),

  -- Bypass details
  terms_version VARCHAR(20) NOT NULL,
  terms_content_id UUID REFERENCES terms_content(id),
  bypassed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Error context
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,

  -- Technical details
  ip_address TEXT,
  user_agent TEXT,

  -- Resolution tracking
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT,

  -- Re-prompt tracking
  should_reprompt BOOLEAN DEFAULT true,
  reprompted_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for quick lookups
CREATE INDEX idx_bypass_member ON terms_acceptance_bypasses(member_id);
CREATE INDEX idx_bypass_auth_user ON terms_acceptance_bypasses(auth_user_id);
CREATE INDEX idx_bypass_unresolved ON terms_acceptance_bypasses(resolved) WHERE resolved = false;
CREATE INDEX idx_bypass_should_reprompt ON terms_acceptance_bypasses(should_reprompt) WHERE should_reprompt = true;

-- RLS Policies
ALTER TABLE terms_acceptance_bypasses ENABLE ROW LEVEL SECURITY;

-- Users can view their own bypasses
CREATE POLICY "Users can view own bypasses"
  ON terms_acceptance_bypasses
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

-- Users can insert their own bypass records
CREATE POLICY "Users can insert own bypass"
  ON terms_acceptance_bypasses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

-- Staff can view all bypasses
CREATE POLICY "Staff can view all bypasses"
  ON terms_acceptance_bypasses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('Office Staff', 'Office Manager', 'Admin')
    )
  );

-- Staff can update bypasses (mark as resolved)
CREATE POLICY "Staff can update bypasses"
  ON terms_acceptance_bypasses
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
COMMENT ON TABLE terms_acceptance_bypasses IS 'Tracks instances where users bypassed terms acceptance due to technical errors';
COMMENT ON COLUMN terms_acceptance_bypasses.should_reprompt IS 'If true, user should be re-prompted to accept terms on next login';
COMMENT ON COLUMN terms_acceptance_bypasses.retry_count IS 'Number of failed acceptance attempts before bypass';
COMMENT ON COLUMN terms_acceptance_bypasses.resolved IS 'Whether admin has reviewed and resolved this bypass incident';
