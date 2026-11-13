-- ============================================================================
-- Paid levels are only ever reached by paying (2026-11-12)
-- ============================================================================
-- Spec: docs/architecture/payments.md, "Membership". Joining, approval and the
-- office's Add member used to create a member AT the level they asked for, so
-- Annual and Lifetime were granted without payment. Now a member starts as
-- Community and the level they asked for is remembered in requested_level;
-- their dashboard offers "Complete your membership" until a membership payment
-- settles, which sets the level (set_member_level) and clears the request.
--
-- Apply to dev-mp (bcujsesgrzijyisvmnwm) first; prod-mp only with approval.

ALTER TABLE members ADD COLUMN IF NOT EXISTS requested_level membership_level;
DO $$ BEGIN
  ALTER TABLE members ADD CONSTRAINT chk_requested_level_paid
    CHECK (requested_level IS NULL OR requested_level IN ('Annual', 'Lifetime'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

COMMENT ON COLUMN members.requested_level IS
  'The paid level the member asked for (join, approval, Add member) and has not yet paid for. Cleared when a membership payment settles.';

-- Same as 20261112000003, plus: a settled membership clears the request it
-- satisfies (Lifetime satisfies either).
CREATE OR REPLACE FUNCTION set_member_level(p_member_id UUID, p_level membership_level)
RETURNS VOID
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_member members%ROWTYPE;
BEGIN
  SELECT * INTO v_member FROM members WHERE id = p_member_id FOR UPDATE;

  IF v_member.requested_level IS NOT NULL
     AND (v_member.requested_level = p_level OR p_level = 'Lifetime') THEN
    UPDATE members SET requested_level = NULL WHERE id = p_member_id;
  END IF;

  IF v_member.current_level = p_level THEN RETURN; END IF;
  IF v_member.is_test_account THEN
    UPDATE members SET current_level = p_level WHERE id = p_member_id;
  ELSE
    UPDATE members
      SET current_level = p_level, membership_id = generate_membership_id(p_level)
      WHERE id = p_member_id;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION set_member_level(UUID, membership_level) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION set_member_level(UUID, membership_level) TO service_role;
