-- ============================================================================
-- Request numbers: every request after a year's first failed (2026-11-12)
-- ============================================================================
-- generate_request_number read the sequence FROM position 5 ('2026-000001'),
-- which does not cast to an integer, so once a year had one request every
-- further request insert failed. The same defect as receipt numbers (fixed in
-- 20261112000003); found by supabase/tests/settle_payment.sql. Also takes a
-- lock, and runs as definer so the MAX sees every request whoever inserts.
-- No existing number changes.
--
-- Apply to dev-mp (bcujsesgrzijyisvmnwm) first; prod-mp only with approval.

CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TEXT
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year TEXT := TO_CHAR(NOW() AT TIME ZONE 'America/New_York', 'YYYY');
  v_sequence INTEGER;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('requests.request_number'));
  SELECT COALESCE(MAX(SUBSTRING(request_number FROM 10)::INTEGER), 0) + 1
  INTO v_sequence
  FROM requests
  WHERE request_number LIKE 'REQ-' || v_year || '-%';
  RETURN 'REQ-' || v_year || '-' || LPAD(v_sequence::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

REVOKE EXECUTE ON FUNCTION generate_request_number() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION generate_request_number() TO authenticated, service_role;
