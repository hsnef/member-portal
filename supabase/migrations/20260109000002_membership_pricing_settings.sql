-- Membership Pricing Settings
-- Allows Office Managers to configure membership prices via portal settings

-- Insert default membership pricing settings
INSERT INTO portal_settings (setting_key, setting_value, setting_type, display_name, description, category, updated_by)
VALUES
  (
    'membership_pricing',
    '{
      "community": {
        "price": 0,
        "displayPrice": "Free",
        "description": "Free community membership"
      },
      "annual": {
        "price": 101,
        "displayPrice": "$101/year",
        "description": "Annual membership with full benefits"
      },
      "lifetime": {
        "price": 1008,
        "displayPrice": "$1,008 (one-time)",
        "description": "Lifetime membership - one-time payment"
      }
    }'::jsonb,
    'json',
    'Membership Pricing',
    'Membership pricing for different membership levels. Price is in dollars.',
    'Membership',
    NULL
  )
ON CONFLICT (setting_key) DO NOTHING;

-- Add comment
COMMENT ON COLUMN portal_settings.setting_value IS 'JSONB value for flexible settings. For membership_pricing: { community: {price, displayPrice, description}, annual: {...}, lifetime: {...} }';
