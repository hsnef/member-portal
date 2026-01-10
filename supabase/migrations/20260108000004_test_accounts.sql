-- Add is_test_account flag to members table
ALTER TABLE members ADD COLUMN IF NOT EXISTS is_test_account BOOLEAN DEFAULT FALSE;

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_members_is_test_account ON members(is_test_account);

-- Create test user accounts (these will need to be linked to auth.users manually or via registration)
-- Note: The auth_user_id will need to be set after these users register

-- 1. Test Manager (Office Manager role)
-- Note: Role will be assigned via user_roles table after user registers
-- Membership ID: 99991000 (prefix 9 = test, middle digit 1 = Manager)
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
  '99991000',
  'Test',
  'Manager',
  'dev-mp+testmanager@hsnef.org',
  '(555) 999-1001',
  'Personal',
  'Lifetime',
  TRUE,
  '123 Test Street',
  'Test City',
  'FL',
  '32092'
) ON CONFLICT (membership_id) DO NOTHING;

-- 2. Test Office Staff
-- Membership ID: 99992000 (prefix 9 = test, middle digit 2 = Staff)
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
  '99992000',
  'Test',
  'Staff',
  'dev-mp+teststaff@hsnef.org',
  '(555) 999-1002',
  'Personal',
  'Lifetime',
  TRUE,
  '123 Test Street',
  'Test City',
  'FL',
  '32092'
) ON CONFLICT (membership_id) DO NOTHING;

-- 3. Test Lifetime Member
-- Membership ID: 99993000 (prefix 9 = test, middle digit 3 = Lifetime level)
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
  '99993000',
  'Test',
  'Lifetime',
  'dev-mp+testlifetime@hsnef.org',
  '(555) 999-1003',
  'Personal',
  'Lifetime',
  TRUE,
  '123 Test Street',
  'Test City',
  'FL',
  '32092'
) ON CONFLICT (membership_id) DO NOTHING;

-- 4. Test Annual Member
-- Membership ID: 99994000 (prefix 9 = test, middle digit 4 = Annual level)
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
  '99994000',
  'Test',
  'Annual',
  'dev-mp+testannual@hsnef.org',
  '(555) 999-1004',
  'Personal',
  'Annual',
  TRUE,
  '123 Test Street',
  'Test City',
  'FL',
  '32092'
) ON CONFLICT (membership_id) DO NOTHING;

-- 5. Test Community Member (not paid)
-- Membership ID: 99995000 (prefix 9 = test, middle digit 5 = Community level)
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
  '99995000',
  'Test',
  'Community',
  'dev-mp+testcommunity@hsnef.org',
  '(555) 999-1005',
  'Personal',
  'Community',
  TRUE,
  '123 Test Street',
  'Test City',
  'FL',
  '32092'
) ON CONFLICT (membership_id) DO NOTHING;

-- Add comment explaining test accounts
COMMENT ON COLUMN members.is_test_account IS 'Flag to identify test accounts. These should be filtered from reports, metrics, and analytics to avoid skewing real data.';
