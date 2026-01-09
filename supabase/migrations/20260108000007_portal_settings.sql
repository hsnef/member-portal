-- ============================================================================
-- Portal Settings System
-- ============================================================================
-- This table stores portal-wide configuration settings that can be managed
-- by administrators through the admin panel.

-- Create portal settings table
CREATE TABLE IF NOT EXISTS portal_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Setting identification
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  setting_type TEXT NOT NULL CHECK (setting_type IN ('boolean', 'string', 'number', 'json')),

  -- Metadata
  display_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- e.g., 'authentication', 'registration', 'general'

  -- Audit fields
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_portal_settings_key ON portal_settings(setting_key);
CREATE INDEX idx_portal_settings_category ON portal_settings(category);

-- Create updated_at trigger
CREATE TRIGGER update_portal_settings_updated_at
  BEFORE UPDATE ON portal_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE portal_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (for checking if features are enabled)
CREATE POLICY "Anyone can view settings"
  ON portal_settings
  FOR SELECT
  TO public
  USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can update settings"
  ON portal_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('Admin', 'Office Manager')
    )
  );

-- Only admins can insert settings
CREATE POLICY "Admins can insert settings"
  ON portal_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('Admin', 'Office Manager')
    )
  );

-- Insert default settings
INSERT INTO portal_settings (setting_key, setting_value, setting_type, display_name, description, category)
VALUES
  -- Authentication Settings
  (
    'enable_traditional_login',
    '{"enabled": false}'::jsonb,
    'boolean',
    'Enable Traditional Email/Password Login',
    'Allow users to register and login with email and password in addition to magic link and Google OAuth. When disabled, only magic link and Google sign-in are available.',
    'authentication'
  ),

  -- Registration Settings
  (
    'require_member_approval',
    '{"enabled": false}'::jsonb,
    'boolean',
    'Require Office Approval for New Members',
    'When enabled, all member registrations via /join must be reviewed and approved by office staff. When disabled, applications are automatically approved and member accounts are created immediately.',
    'registration'
  ),

  -- General Settings
  (
    'organization_name',
    '{"value": "HSNEF"}'::jsonb,
    'string',
    'Organization Name',
    'The name of your organization displayed throughout the portal.',
    'general'
  ),

  (
    'organization_email',
    '{"value": "info@hsnef.org"}'::jsonb,
    'string',
    'Organization Email',
    'Primary contact email for the organization.',
    'general'
  ),

  (
    'organization_phone',
    '{"value": "(555) 123-4567"}'::jsonb,
    'string',
    'Organization Phone',
    'Primary contact phone number for the organization.',
    'general'
  )
ON CONFLICT (setting_key) DO NOTHING;

-- Comments
COMMENT ON TABLE portal_settings IS 'Stores portal-wide configuration settings managed by administrators';
COMMENT ON COLUMN portal_settings.setting_key IS 'Unique identifier for the setting (e.g., enable_traditional_login)';
COMMENT ON COLUMN portal_settings.setting_value IS 'The setting value stored as JSONB for flexibility';
COMMENT ON COLUMN portal_settings.setting_type IS 'Data type of the setting: boolean, string, number, or json';
COMMENT ON COLUMN portal_settings.category IS 'Grouping category: authentication, registration, general, etc.';
