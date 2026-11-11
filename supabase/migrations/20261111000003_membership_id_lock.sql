-- ============================================================================
-- Membership IDs: serialise generation (decided 2026-11-11)
-- ============================================================================
-- generate_membership_id takes MAX(number)+1 for the level's prefix. Two
-- members created at the same moment could read the same MAX, and the second
-- insert then failed on the UNIQUE constraint. A transaction-scoped advisory
-- lock makes concurrent generations take turns, the same way
-- generate_booking_number does (20261111000002).
--
-- The lock protects numbers ASSIGNED BY THE TRIGGER (auto_generate_membership_id),
-- because generation and insert then share one transaction. The office approval
-- dialog therefore leaves membership_id empty when the office keeps the
-- suggested number, so the trigger assigns it under the lock.
--
-- SECURITY DEFINER so the MAX always sees every member, whoever inserts; the
-- function is then not callable by anonymous visitors.
--
-- Unchanged, by decision (Sujit, 2026-11-11): the first digit encodes the level
-- (1 Lifetime, 2 Annual, 3 Community), enforced by chk_membership_id_prefix, so
-- a member who changes level gets a new number.
--
-- Apply to dev-mp (bcujsesgrzijyisvmnwm) first; prod-mp only with approval.

CREATE OR REPLACE FUNCTION generate_membership_id(p_level membership_level)
RETURNS VARCHAR(8)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefix CHAR(1);
  v_next_number INTEGER;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('members.membership_id'));

  v_prefix := CASE p_level
    WHEN 'Lifetime' THEN '1'
    WHEN 'Annual' THEN '2'
    WHEN 'Community' THEN '3'
  END;

  SELECT COALESCE(MAX(SUBSTRING(membership_id FROM 2 FOR 5)::INTEGER), 0) + 1
  INTO v_next_number
  FROM members
  WHERE LEFT(membership_id, 1) = v_prefix;

  -- Format: prefix + 5 digits + '00' (chk_membership_id_format)
  RETURN v_prefix || LPAD(v_next_number::TEXT, 5, '0') || '00';
END;
$$ LANGUAGE plpgsql;

REVOKE EXECUTE ON FUNCTION generate_membership_id(membership_level) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION generate_membership_id(membership_level) TO authenticated, service_role;
