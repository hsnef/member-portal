-- ============================================================================
-- Theme System
-- ============================================================================
-- This migration creates the theme system infrastructure:
-- 1. theme_definitions table: Stores all themes (built-in + custom)
-- 2. active_theme setting: Stores currently selected theme
-- 3. Inserts default theme (matches current design)
-- 4. Inserts Florida Oura theme

-- Create theme_definitions table
CREATE TABLE IF NOT EXISTS theme_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Theme identification
  name TEXT NOT NULL UNIQUE,  -- 'default', 'florida-oura', 'summer-florida'
  display_name TEXT NOT NULL,
  description TEXT,
  theme_type TEXT NOT NULL CHECK (theme_type IN ('built-in', 'custom')),
  
  -- Theme configuration
  css_variables JSONB NOT NULL DEFAULT '{}'::jsonb,  -- All CSS variable definitions
  fonts JSONB,  -- Font definitions: { header: { family, source, url }, body: {...} }
  metadata JSONB,  -- Additional metadata: { spacing, borders, shadows }
  
  -- Audit fields
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true  -- Can disable themes
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_theme_definitions_name ON theme_definitions(name);
CREATE INDEX IF NOT EXISTS idx_theme_definitions_type ON theme_definitions(theme_type);
CREATE INDEX IF NOT EXISTS idx_theme_definitions_active ON theme_definitions(is_active) WHERE is_active = true;

-- Create updated_at trigger
CREATE TRIGGER update_theme_definitions_updated_at
  BEFORE UPDATE ON theme_definitions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE theme_definitions ENABLE ROW LEVEL SECURITY;

-- Anyone can read themes (needed for theme application)
CREATE POLICY "Anyone can view themes"
  ON theme_definitions
  FOR SELECT
  TO public
  USING (is_active = true);

-- Only Super Admin can manage themes
CREATE POLICY "Super Admin can manage themes"
  ON theme_definitions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'Admin'
    )
  );

-- Insert active_theme setting in portal_settings
INSERT INTO portal_settings (setting_key, setting_value, setting_type, display_name, description, category)
VALUES
  (
    'active_theme',
    '{"themeName": "default"}'::jsonb,
    'json',
    'Active Theme',
    'The currently selected theme that applies to the entire portal.',
    'appearance'
  )
ON CONFLICT (setting_key) DO NOTHING;

-- Insert Default Theme (matches current design)
INSERT INTO theme_definitions (
  name,
  display_name,
  description,
  theme_type,
  css_variables,
  fonts,
  metadata,
  is_active
) VALUES (
  'default',
  'Default',
  'Default theme matching the current design',
  'built-in',
  '{
    "--theme-bg-primary": "#fffaf5",
    "--theme-bg-secondary": "#ffffff",
    "--theme-text-primary": "#1a1a1a",
    "--theme-text-secondary": "#666666",
    "--theme-accent-primary": "#FF9933",
    "--theme-accent-secondary": "#800000",
    "--theme-border": "#e5e5e5",
    "--theme-border-radius-card": "8px",
    "--theme-border-radius-button": "6px",
    "--theme-shadow-card": "0 1px 3px rgba(0, 0, 0, 0.1)",
    "--theme-spacing-card": "24px",
    "--theme-spacing-section": "32px"
  }'::jsonb,
  '{
    "header": {
      "family": "Arial, Helvetica, sans-serif",
      "source": "system",
      "weight": "600"
    },
    "body": {
      "family": "Arial, Helvetica, sans-serif",
      "source": "system",
      "weight": "400"
    }
  }'::jsonb,
  '{
    "spacing": {
      "cardPadding": "24px",
      "sectionSpacing": "32px"
    },
    "borders": {
      "cardRadius": "8px",
      "buttonRadius": "6px"
    },
    "shadows": {
      "card": "0 1px 3px rgba(0, 0, 0, 0.1)"
    }
  }'::jsonb,
  true
) ON CONFLICT (name) DO NOTHING;

-- Insert Florida Oura Theme
INSERT INTO theme_definitions (
  name,
  display_name,
  description,
  theme_type,
  css_variables,
  fonts,
  metadata,
  is_active
) VALUES (
  'florida-oura',
  'Florida Oura',
  'Calming vibrant Florida vibe with sky brightness and crisp modern design',
  'built-in',
  '{
    "--theme-bg-primary": "#FFFBF7",
    "--theme-bg-secondary": "#FFFFFF",
    "--theme-text-primary": "#3E362E",
    "--theme-text-secondary": "#6B5D52",
    "--theme-accent-primary": "#FFD8B1",
    "--theme-accent-secondary": "#87CEEB",
    "--theme-border": "#E8E0D8",
    "--theme-border-radius-card": "16px",
    "--theme-border-radius-button": "8px",
    "--theme-shadow-card": "0 4px 12px rgba(62, 54, 46, 0.08)",
    "--theme-spacing-card": "20px",
    "--theme-spacing-section": "28px"
  }'::jsonb,
  '{
    "header": {
      "family": "Lora, serif",
      "source": "google",
      "url": "https://fonts.googleapis.com/css2?family=Lora:wght@600&display=swap",
      "weight": "600"
    },
    "body": {
      "family": "Inter, sans-serif",
      "source": "google",
      "url": "https://fonts.googleapis.com/css2?family=Inter:wght@400&display=swap",
      "weight": "400"
    }
  }'::jsonb,
  '{
    "spacing": {
      "cardPadding": "20px",
      "sectionSpacing": "28px"
    },
    "borders": {
      "cardRadius": "16px",
      "buttonRadius": "8px"
    },
    "shadows": {
      "card": "0 4px 12px rgba(62, 54, 46, 0.08)"
    }
  }'::jsonb,
  true
) ON CONFLICT (name) DO NOTHING;

-- Comments
COMMENT ON TABLE theme_definitions IS 'Stores theme definitions (built-in and custom)';
COMMENT ON COLUMN theme_definitions.name IS 'Unique identifier for the theme (e.g., "default", "florida-oura")';
COMMENT ON COLUMN theme_definitions.display_name IS 'Display name shown in admin UI (e.g., "Default", "Florida Oura")';
COMMENT ON COLUMN theme_definitions.theme_type IS 'Type of theme: built-in (in code) or custom (admin-uploaded)';
COMMENT ON COLUMN theme_definitions.css_variables IS 'JSONB object with all CSS custom property definitions';
COMMENT ON COLUMN theme_definitions.fonts IS 'Font configuration: { header: { family, source, url, weight }, body: {...} }';
COMMENT ON COLUMN theme_definitions.metadata IS 'Additional theme metadata: spacing, borders, shadows, etc.';
COMMENT ON COLUMN theme_definitions.is_active IS 'Whether the theme is active and available for selection';
