-- ============================================================================
-- Login Audit Logs RLS Policies
-- Restricts access to Admin and Office Manager roles only
-- ============================================================================

-- Enable RLS on login_audit_logs table
ALTER TABLE login_audit_logs ENABLE ROW LEVEL SECURITY;

-- Admin and Office Manager can view all login logs
CREATE POLICY login_audit_log_select_admin_manager ON login_audit_logs
  FOR SELECT
  USING (
    has_role('Admin') OR
    has_role('Office Manager')
  );

-- No insert, update, or delete policies
-- Only system/API can write to this table via service role
-- User-facing inserts should go through API endpoints that use server-side auth

COMMENT ON POLICY login_audit_log_select_admin_manager ON login_audit_logs IS
  'Allows Admin and Office Manager to view all login activity logs';
