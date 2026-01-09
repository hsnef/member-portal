-- ============================================================================
-- Login Audit Logs Data Retention (1 Year)
-- Function to delete logs older than 1 year
-- ============================================================================

-- Function to cleanup old login logs
CREATE OR REPLACE FUNCTION cleanup_old_login_logs()
RETURNS TABLE(deleted_count INTEGER) AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Delete login audit logs older than 1 year
  DELETE FROM login_audit_logs
  WHERE login_at < NOW() - INTERVAL '1 year';

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- Log the cleanup operation
  RAISE NOTICE 'Deleted % login audit log records older than 1 year', v_deleted_count;

  RETURN QUERY SELECT v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION cleanup_old_login_logs() IS
  'Deletes login audit logs older than 1 year. Should be called daily via cron job or scheduled task.';

-- Grant execute to authenticated users (will be called via API with proper auth)
GRANT EXECUTE ON FUNCTION cleanup_old_login_logs() TO authenticated;
