-- ============================================================================
-- HSNEF Membership Portal - Row-Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE election_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================================================

-- Function to get current user's role(s)
CREATE OR REPLACE FUNCTION get_user_roles()
RETURNS user_role[] AS $$
  SELECT COALESCE(array_agg(role), ARRAY[]::user_role[])
  FROM user_roles
  WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION has_role(required_role user_role)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = required_role
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Function to check if user has any of the specified roles
CREATE OR REPLACE FUNCTION has_any_role(required_roles user_role[])
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = ANY(required_roles)
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Function to check if user is the member (owns the member record)
CREATE OR REPLACE FUNCTION is_own_member_record(member_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM members
    WHERE id = member_id AND auth_user_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Function to get member_id for current user
CREATE OR REPLACE FUNCTION get_current_member_id()
RETURNS UUID AS $$
  SELECT id FROM members WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================================
-- MEMBERS TABLE RLS POLICIES
-- ============================================================================

-- Members: SELECT
-- - Members can view their own record
-- - Office Staff, Office Manager, Admin can view all
CREATE POLICY members_select_policy ON members
  FOR SELECT
  USING (
    auth_user_id = auth.uid() OR
    has_any_role(ARRAY['Office Staff', 'Office Manager', 'Admin']::user_role[])
  );

-- Members: INSERT
-- - Admin and Office Manager can insert
CREATE POLICY members_insert_policy ON members
  FOR INSERT
  WITH CHECK (
    has_any_role(ARRAY['Office Manager', 'Admin']::user_role[])
  );

-- Members: UPDATE
-- - Members can update their own profile (limited fields)
-- - Office Staff can update limited fields
-- - Office Manager and Admin can update all fields
CREATE POLICY members_update_policy ON members
  FOR UPDATE
  USING (
    auth_user_id = auth.uid() OR
    has_any_role(ARRAY['Office Staff', 'Office Manager', 'Admin']::user_role[])
  )
  WITH CHECK (
    auth_user_id = auth.uid() OR
    has_any_role(ARRAY['Office Staff', 'Office Manager', 'Admin']::user_role[])
  );

-- Members: DELETE
-- - Only Admin can delete
CREATE POLICY members_delete_policy ON members
  FOR DELETE
  USING (has_role('Admin'::user_role));

-- ============================================================================
-- FAMILY MEMBERS TABLE RLS POLICIES
-- ============================================================================

-- Family Members: SELECT
-- - Members can view their own family
-- - Staff can view all
CREATE POLICY family_members_select_policy ON family_members
  FOR SELECT
  USING (
    is_own_member_record(member_id) OR
    has_any_role(ARRAY['Office Staff', 'Office Manager', 'Admin']::user_role[])
  );

-- Family Members: INSERT
-- - Members can add to their own family
-- - Staff can add to any family
CREATE POLICY family_members_insert_policy ON family_members
  FOR INSERT
  WITH CHECK (
    is_own_member_record(member_id) OR
    has_any_role(ARRAY['Office Staff', 'Office Manager', 'Admin']::user_role[])
  );

-- Family Members: UPDATE
-- - Members can update their own family
-- - Staff can update any
CREATE POLICY family_members_update_policy ON family_members
  FOR UPDATE
  USING (
    is_own_member_record(member_id) OR
    has_any_role(ARRAY['Office Staff', 'Office Manager', 'Admin']::user_role[])
  );

-- Family Members: DELETE
-- - Members can delete from their own family
-- - Office Manager and Admin can delete any
CREATE POLICY family_members_delete_policy ON family_members
  FOR DELETE
  USING (
    is_own_member_record(member_id) OR
    has_any_role(ARRAY['Office Manager', 'Admin']::user_role[])
  );

-- ============================================================================
-- BUSINESS CONTACTS TABLE RLS POLICIES
-- ============================================================================

-- Business Contacts: SELECT
-- - Members linked as contact can view
-- - Staff can view all
CREATE POLICY business_contacts_select_policy ON business_contacts
  FOR SELECT
  USING (
    is_own_member_record(business_member_id) OR
    is_own_member_record(contact_member_id) OR
    has_any_role(ARRAY['Office Staff', 'Office Manager', 'Admin']::user_role[])
  );

-- Business Contacts: INSERT/UPDATE/DELETE
-- - Only Office Manager and Admin
CREATE POLICY business_contacts_insert_policy ON business_contacts
  FOR INSERT
  WITH CHECK (has_any_role(ARRAY['Office Manager', 'Admin']::user_role[]));

CREATE POLICY business_contacts_update_policy ON business_contacts
  FOR UPDATE
  USING (has_any_role(ARRAY['Office Manager', 'Admin']::user_role[]));

CREATE POLICY business_contacts_delete_policy ON business_contacts
  FOR DELETE
  USING (has_any_role(ARRAY['Office Manager', 'Admin']::user_role[]));

-- ============================================================================
-- MEMBERSHIPS TABLE RLS POLICIES
-- ============================================================================

-- Memberships: SELECT
-- - Members can view their own
-- - Staff can view all
CREATE POLICY memberships_select_policy ON memberships
  FOR SELECT
  USING (
    is_own_member_record(member_id) OR
    has_any_role(ARRAY['Office Staff', 'Office Manager', 'Admin']::user_role[])
  );

-- Memberships: INSERT
-- - Office Staff, Office Manager, Admin can insert
CREATE POLICY memberships_insert_policy ON memberships
  FOR INSERT
  WITH CHECK (
    has_any_role(ARRAY['Office Staff', 'Office Manager', 'Admin']::user_role[])
  );

-- Memberships: UPDATE
-- - Office Manager and Admin can update within 90 days
-- - Admin can update any
CREATE POLICY memberships_update_policy ON memberships
  FOR UPDATE
  USING (
    has_role('Admin'::user_role) OR
    (has_role('Office Manager'::user_role) AND created_at > NOW() - INTERVAL '90 days')
  );

-- Memberships: DELETE
-- - Only Admin
CREATE POLICY memberships_delete_policy ON memberships
  FOR DELETE
  USING (has_role('Admin'::user_role));

-- ============================================================================
-- USER ROLES TABLE RLS POLICIES
-- ============================================================================

-- User Roles: SELECT
-- - Users can view their own roles
-- - Admin can view all
CREATE POLICY user_roles_select_policy ON user_roles
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    has_role('Admin'::user_role)
  );

-- User Roles: INSERT/UPDATE/DELETE
-- - Only Admin
CREATE POLICY user_roles_insert_policy ON user_roles
  FOR INSERT
  WITH CHECK (has_role('Admin'::user_role));

CREATE POLICY user_roles_update_policy ON user_roles
  FOR UPDATE
  USING (has_role('Admin'::user_role));

CREATE POLICY user_roles_delete_policy ON user_roles
  FOR DELETE
  USING (has_role('Admin'::user_role));

-- ============================================================================
-- REQUESTS TABLE RLS POLICIES
-- ============================================================================

-- Requests: SELECT
-- - Members can view requests sent to them
-- - Staff can view all
CREATE POLICY requests_select_policy ON requests
  FOR SELECT
  USING (
    is_own_member_record(member_id) OR
    has_any_role(ARRAY['Office Staff', 'Office Manager', 'Admin']::user_role[])
  );

-- Requests: INSERT
-- - Office Staff, Office Manager, Admin can create
CREATE POLICY requests_insert_policy ON requests
  FOR INSERT
  WITH CHECK (
    has_any_role(ARRAY['Office Staff', 'Office Manager', 'Admin']::user_role[])
  );

-- Requests: UPDATE
-- - Office Manager and Admin can update within 90 days
-- - Admin can update any
CREATE POLICY requests_update_policy ON requests
  FOR UPDATE
  USING (
    has_role('Admin'::user_role) OR
    (has_role('Office Manager'::user_role) AND created_at > NOW() - INTERVAL '90 days')
  );

-- Requests: DELETE
-- - Only Admin can delete
CREATE POLICY requests_delete_policy ON requests
  FOR DELETE
  USING (has_role('Admin'::user_role));

-- ============================================================================
-- PAYMENTS TABLE RLS POLICIES
-- ============================================================================

-- Payments: SELECT
-- - Members can view their own payments
-- - Staff can view all
CREATE POLICY payments_select_policy ON payments
  FOR SELECT
  USING (
    is_own_member_record(member_id) OR
    has_any_role(ARRAY['Office Staff', 'Office Manager', 'Admin']::user_role[])
  );

-- Payments: INSERT
-- - Office Staff, Office Manager, Admin can insert (for manual payments)
-- - System can insert (for Stripe webhooks via service role)
CREATE POLICY payments_insert_policy ON payments
  FOR INSERT
  WITH CHECK (
    has_any_role(ARRAY['Office Staff', 'Office Manager', 'Admin']::user_role[])
  );

-- Payments: UPDATE
-- - Office Manager can update within 90 days
-- - Admin can update any
CREATE POLICY payments_update_policy ON payments
  FOR UPDATE
  USING (
    has_role('Admin'::user_role) OR
    (has_role('Office Manager'::user_role) AND created_at > NOW() - INTERVAL '90 days')
  );

-- Payments: DELETE
-- - Only Admin (should be rare, prefer reversal entries)
CREATE POLICY payments_delete_policy ON payments
  FOR DELETE
  USING (has_role('Admin'::user_role));

-- ============================================================================
-- RECEIPTS TABLE RLS POLICIES
-- ============================================================================

-- Receipts: SELECT
-- - Members can view their own receipts
-- - Staff can view all
CREATE POLICY receipts_select_policy ON receipts
  FOR SELECT
  USING (
    is_own_member_record(member_id) OR
    has_any_role(ARRAY['Office Staff', 'Office Manager', 'Admin']::user_role[])
  );

-- Receipts: INSERT
-- - Office Staff, Office Manager, Admin can insert
CREATE POLICY receipts_insert_policy ON receipts
  FOR INSERT
  WITH CHECK (
    has_any_role(ARRAY['Office Staff', 'Office Manager', 'Admin']::user_role[])
  );

-- Receipts: UPDATE
-- - Only for email_sent_at updates by Staff
-- - No deletion or modification of core fields
CREATE POLICY receipts_update_policy ON receipts
  FOR UPDATE
  USING (
    has_any_role(ARRAY['Office Staff', 'Office Manager', 'Admin']::user_role[])
  );

-- Receipts: DELETE
-- - Never delete receipts (immutable records)
-- No delete policy = no one can delete

-- ============================================================================
-- EVENTS TABLE RLS POLICIES
-- ============================================================================

-- Events: SELECT
-- - All authenticated users can view events
CREATE POLICY events_select_policy ON events
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Events: INSERT
-- - Office Staff, Office Manager, Admin can create
CREATE POLICY events_insert_policy ON events
  FOR INSERT
  WITH CHECK (
    has_any_role(ARRAY['Office Staff', 'Office Manager', 'Admin']::user_role[])
  );

-- Events: UPDATE
-- - Office Manager and Admin can update
CREATE POLICY events_update_policy ON events
  FOR UPDATE
  USING (has_any_role(ARRAY['Office Manager', 'Admin']::user_role[]));

-- Events: DELETE
-- - Only Admin can delete
CREATE POLICY events_delete_policy ON events
  FOR DELETE
  USING (has_role('Admin'::user_role));

-- ============================================================================
-- EVENT REGISTRATIONS TABLE RLS POLICIES
-- ============================================================================

-- Event Registrations: SELECT
-- - Members can view their own registrations
-- - Staff can view all
CREATE POLICY event_registrations_select_policy ON event_registrations
  FOR SELECT
  USING (
    is_own_member_record(member_id) OR
    has_any_role(ARRAY['Office Staff', 'Office Manager', 'Admin']::user_role[])
  );

-- Event Registrations: INSERT
-- - Members can register themselves
-- - Staff can register anyone
CREATE POLICY event_registrations_insert_policy ON event_registrations
  FOR INSERT
  WITH CHECK (
    is_own_member_record(member_id) OR
    has_any_role(ARRAY['Office Staff', 'Office Manager', 'Admin']::user_role[])
  );

-- Event Registrations: UPDATE
-- - Office Manager and Admin can update
CREATE POLICY event_registrations_update_policy ON event_registrations
  FOR UPDATE
  USING (has_any_role(ARRAY['Office Manager', 'Admin']::user_role[]));

-- Event Registrations: DELETE
-- - Office Manager and Admin can delete
CREATE POLICY event_registrations_delete_policy ON event_registrations
  FOR DELETE
  USING (has_any_role(ARRAY['Office Manager', 'Admin']::user_role[]));

-- ============================================================================
-- LEDGER ENTRIES TABLE RLS POLICIES
-- ============================================================================

-- Ledger Entries: SELECT
-- - Members can view their own ledger
-- - Staff can view all
CREATE POLICY ledger_entries_select_policy ON ledger_entries
  FOR SELECT
  USING (
    is_own_member_record(member_id) OR
    has_any_role(ARRAY['Office Staff', 'Office Manager', 'Admin']::user_role[])
  );

-- Ledger Entries: INSERT
-- - Staff can insert (system generated)
CREATE POLICY ledger_entries_insert_policy ON ledger_entries
  FOR INSERT
  WITH CHECK (
    has_any_role(ARRAY['Office Staff', 'Office Manager', 'Admin']::user_role[])
  );

-- Ledger Entries: UPDATE/DELETE
-- - Only Admin (ledger should be append-only)
CREATE POLICY ledger_entries_update_policy ON ledger_entries
  FOR UPDATE
  USING (has_role('Admin'::user_role));

CREATE POLICY ledger_entries_delete_policy ON ledger_entries
  FOR DELETE
  USING (has_role('Admin'::user_role));

-- ============================================================================
-- LOGIN AUDIT LOGS TABLE RLS POLICIES
-- ============================================================================

-- Login Audit Logs: SELECT
-- - Office Manager and Admin can view
CREATE POLICY login_audit_logs_select_policy ON login_audit_logs
  FOR SELECT
  USING (has_any_role(ARRAY['Office Manager', 'Admin']::user_role[]));

-- Login Audit Logs: INSERT
-- - System only (via service role)
-- No insert policy for users

-- Login Audit Logs: UPDATE/DELETE
-- - Never (append-only)
-- No update or delete policies

-- ============================================================================
-- REGISTRATION INVITATIONS TABLE RLS POLICIES
-- ============================================================================

-- Registration Invitations: SELECT
-- - Office Manager and Admin can view
CREATE POLICY registration_invitations_select_policy ON registration_invitations
  FOR SELECT
  USING (has_any_role(ARRAY['Office Manager', 'Admin']::user_role[]));

-- Registration Invitations: INSERT
-- - Office Manager and Admin can create
CREATE POLICY registration_invitations_insert_policy ON registration_invitations
  FOR INSERT
  WITH CHECK (has_any_role(ARRAY['Office Manager', 'Admin']::user_role[]));

-- Registration Invitations: UPDATE
-- - Office Manager and Admin can update
CREATE POLICY registration_invitations_update_policy ON registration_invitations
  FOR UPDATE
  USING (has_any_role(ARRAY['Office Manager', 'Admin']::user_role[]));

-- Registration Invitations: DELETE
-- - Admin can delete
CREATE POLICY registration_invitations_delete_policy ON registration_invitations
  FOR DELETE
  USING (has_role('Admin'::user_role));

-- ============================================================================
-- ELECTIONS TABLE RLS POLICIES (Phase 2)
-- ============================================================================

-- Elections: SELECT
-- - All authenticated members can view
CREATE POLICY elections_select_policy ON elections
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Elections: INSERT/UPDATE/DELETE
-- - Only Admin can manage
CREATE POLICY elections_insert_policy ON elections
  FOR INSERT
  WITH CHECK (has_role('Admin'::user_role));

CREATE POLICY elections_update_policy ON elections
  FOR UPDATE
  USING (has_role('Admin'::user_role));

CREATE POLICY elections_delete_policy ON elections
  FOR DELETE
  USING (has_role('Admin'::user_role));

-- ============================================================================
-- ELECTION OPTIONS TABLE RLS POLICIES
-- ============================================================================

-- Election Options: SELECT
-- - All authenticated members can view
CREATE POLICY election_options_select_policy ON election_options
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Election Options: INSERT/UPDATE/DELETE
-- - Only Admin can manage
CREATE POLICY election_options_insert_policy ON election_options
  FOR INSERT
  WITH CHECK (has_role('Admin'::user_role));

CREATE POLICY election_options_update_policy ON election_options
  FOR UPDATE
  USING (has_role('Admin'::user_role));

CREATE POLICY election_options_delete_policy ON election_options
  FOR DELETE
  USING (has_role('Admin'::user_role));

-- ============================================================================
-- VOTES TABLE RLS POLICIES
-- ============================================================================

-- Votes: SELECT
-- - Members can view only their own votes
-- - Admin can view results (aggregate only if results_public = false)
CREATE POLICY votes_select_policy ON votes
  FOR SELECT
  USING (
    is_own_member_record(member_id) OR
    has_role('Admin'::user_role)
  );

-- Votes: INSERT
-- - Members can insert their own vote (one per election)
CREATE POLICY votes_insert_policy ON votes
  FOR INSERT
  WITH CHECK (
    is_own_member_record(member_id)
  );

-- Votes: UPDATE/DELETE
-- - No updates or deletes (immutable ballots)
-- No update or delete policies

-- ============================================================================
-- AUDIT LOGS TABLE RLS POLICIES
-- ============================================================================

-- Audit Logs: SELECT
-- - Office Manager and Admin can view
CREATE POLICY audit_logs_select_policy ON audit_logs
  FOR SELECT
  USING (has_any_role(ARRAY['Office Manager', 'Admin']::user_role[]));

-- Audit Logs: INSERT
-- - System only (triggers)
-- No insert policy for users

-- Audit Logs: UPDATE/DELETE
-- - Never (immutable)
-- No update or delete policies

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant usage on all sequences to authenticated users
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute on functions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_roles() TO authenticated;
GRANT EXECUTE ON FUNCTION has_role(user_role) TO authenticated;
GRANT EXECUTE ON FUNCTION has_any_role(user_role[]) TO authenticated;
GRANT EXECUTE ON FUNCTION is_own_member_record(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_member_id() TO authenticated;

-- Grant execute on generation functions to authenticated users
GRANT EXECUTE ON FUNCTION generate_membership_id(membership_level) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_request_number() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_receipt_number() TO authenticated;
