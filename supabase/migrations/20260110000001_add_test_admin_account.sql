-- Add Test Admin Account
-- This account allows testers to test Admin-only functionality
-- and have the data cleaned up with "Clean Test Data"

-- Test Admin Account
-- Membership ID: 99990000 (prefix 9 = test, 0 = Admin/Super)
INSERT INTO members (
  membership_id,
  first_name,
  last_name,
  primary_email,
  primary_phone,
  member_class,
  current_level,
  is_test_account,
  address_line_1,
  city,
  state,
  zip
) VALUES (
  '99990000',
  'Test',
  'Admin',
  'dev-mp+testadmin@hsnef.org',
  '(555) 999-1000',
  'Personal',
  'Lifetime',
  TRUE,
  '123 Test Street',
  'Test City',
  'FL',
  '32092'
) ON CONFLICT (membership_id) DO NOTHING;

-- Note: After this account is registered via the portal,
-- the Admin role must be assigned manually in user_roles table:
-- INSERT INTO user_roles (user_id, role) VALUES ('<auth_user_id>', 'Admin');
