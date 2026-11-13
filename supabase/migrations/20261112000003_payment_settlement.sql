-- ============================================================================
-- Payment settlement: ONE step that marks anything paid (2026-11-12)
-- ============================================================================
-- Spec: docs/architecture/payments.md. Card (Stripe webhook), Zelle (staff
-- confirmation, bank import) and office-recorded payments all call
-- settle_payment(), from the server, with the service role. In one transaction
-- it records the payment, marks the item paid, writes membership dates and
-- creates the numbered receipt. Before this, card payments were never recorded
-- (payments INSERT is staff-only under RLS and the card paths ran as the
-- member, or as nobody).
--
-- Apply to dev-mp (bcujsesgrzijyisvmnwm) first; prod-mp only with approval.

-- 1. A card payment taken on the temple's own machine at the counter
--    (Sujit, 2026-11-12). 'Stripe' stays the online card payment.
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'Card';

-- 2. Settling twice is impossible: every caller passes a key that names its
--    source (stripe:<intent>, zelle:<request>, office:<form submission>).
ALTER TABLE payments ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_idempotency_key
  ON payments(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_stripe_intent
  ON payments(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;

-- 3. Event registrations can wait for payment (a place held while a Zelle
--    payment is pending, or between card checkout and the webhook).
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Confirmed';
DO $$ BEGIN
  ALTER TABLE event_registrations ADD CONSTRAINT chk_event_registration_status
    CHECK (status IN ('Pending Payment', 'Confirmed', 'Cancelled'));
EXCEPTION WHEN duplicate_object THEN null; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS uq_event_registrations_live
  ON event_registrations(event_id, member_id) WHERE status <> 'Cancelled';

-- 3b. Receipt numbers, RCP-<year>-<6 digits>. The original generator read the
--     sequence FROM position 5 ('2026-000001'), so every receipt after a year's
--     first failed to cast; and it took no lock. Same shape as the booking
--     number fix (20261111000002). Receipts were never inserted before this
--     migration, so no number in use changes.
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TEXT
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year TEXT := TO_CHAR(NOW() AT TIME ZONE 'America/New_York', 'YYYY');
  v_sequence INTEGER;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('receipts.receipt_number'));
  SELECT COALESCE(MAX(SUBSTRING(receipt_number FROM 10)::INTEGER), 0) + 1
  INTO v_sequence
  FROM receipts
  WHERE receipt_number LIKE 'RCP-' || v_year || '-%';
  RETURN 'RCP-' || v_year || '-' || LPAD(v_sequence::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;
REVOKE EXECUTE ON FUNCTION generate_receipt_number() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION generate_receipt_number() TO authenticated, service_role;

-- 4. The membership term a payment buys (temple brief §2.2): the year runs
--    Jan 1 - Dec 31, no prorating; paid Oct 1 or later -> next year. A member
--    who already holds that year (renewing early) gets the year after.
CREATE OR REPLACE FUNCTION membership_term_year(p_member_id UUID, p_paid_on DATE)
RETURNS INTEGER
LANGUAGE plpgsql STABLE
SET search_path = public
AS $$
DECLARE
  v_year INTEGER := EXTRACT(YEAR FROM p_paid_on)::INTEGER
                    + CASE WHEN EXTRACT(MONTH FROM p_paid_on) >= 10 THEN 1 ELSE 0 END;
  v_held INTEGER;
BEGIN
  SELECT MAX(year) INTO v_held
  FROM memberships
  WHERE member_id = p_member_id AND level = 'Annual' AND status = 'Active';
  IF v_held IS NOT NULL AND v_held >= v_year THEN
    v_year := v_held + 1;
  END IF;
  RETURN v_year;
END;
$$;

-- 5. Change a member's level, with a number in that level's series (the first
--    digit encodes the level; decided 2026-11-11). Test accounts keep theirs.
CREATE OR REPLACE FUNCTION set_member_level(p_member_id UUID, p_level membership_level)
RETURNS VOID
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_member members%ROWTYPE;
BEGIN
  SELECT * INTO v_member FROM members WHERE id = p_member_id FOR UPDATE;
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

-- 6. The settlement step.
--    p_target_kind: 'membership' (p_level Annual|Lifetime), 'booking',
--    'request', 'event_registration' (p_target_id), or 'donation'.
--    Amounts are decided by the server before calling; this checks them
--    against the item where the item carries a price.
CREATE OR REPLACE FUNCTION settle_payment(
  p_idempotency_key TEXT,
  p_member_id UUID,
  p_purpose payment_purpose,
  p_method payment_method,
  p_amount NUMERIC,
  p_target_kind TEXT,
  p_target_id UUID DEFAULT NULL,
  p_level membership_level DEFAULT NULL,
  p_stripe_payment_intent_id TEXT DEFAULT NULL,
  p_stripe_charge_id TEXT DEFAULT NULL,
  p_check_number TEXT DEFAULT NULL,
  p_zelle_reference TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL,
  p_paid_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (payment_id UUID, receipt_id UUID, receipt_number TEXT, already_settled BOOLEAN)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_payment_id UUID;
  v_receipt_id UUID;
  v_receipt_number TEXT;
  v_request_id UUID;
  v_member members%ROWTYPE;
  v_due NUMERIC;
  v_status TEXT;
  v_owner UUID;
  v_paid_on DATE := (p_paid_at AT TIME ZONE 'America/New_York')::DATE;
  v_year INTEGER;
BEGIN
  IF p_idempotency_key IS NULL OR p_idempotency_key = '' THEN
    RAISE EXCEPTION 'settle_payment: idempotency key is required';
  END IF;

  -- Serialise settlements of the same source, then return the earlier result.
  PERFORM pg_advisory_xact_lock(hashtext('settle:' || p_idempotency_key));
  SELECT p.id INTO v_payment_id FROM payments p WHERE p.idempotency_key = p_idempotency_key;
  IF v_payment_id IS NOT NULL THEN
    SELECT r.id, r.receipt_number INTO v_receipt_id, v_receipt_number
      FROM receipts r WHERE r.payment_id = v_payment_id;
    RETURN QUERY SELECT v_payment_id, v_receipt_id, v_receipt_number, TRUE;
    RETURN;
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'settle_payment: amount must be positive';
  END IF;
  SELECT * INTO v_member FROM members WHERE id = p_member_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'settle_payment: member % not found', p_member_id;
  END IF;

  -- Check the item before writing anything.
  CASE p_target_kind
    WHEN 'membership' THEN
      IF p_purpose <> 'Membership' OR p_level NOT IN ('Annual', 'Lifetime') THEN
        RAISE EXCEPTION 'settle_payment: a membership payment needs purpose Membership and level Annual or Lifetime';
      END IF;
      IF v_member.current_level = 'Lifetime' THEN
        RAISE EXCEPTION 'settle_payment: member is already Lifetime';
      END IF;
    WHEN 'booking' THEN
      SELECT b.total_amount, b.status::TEXT, b.member_id INTO v_due, v_status, v_owner
        FROM service_bookings b WHERE b.id = p_target_id FOR UPDATE;
      IF NOT FOUND THEN RAISE EXCEPTION 'settle_payment: booking not found'; END IF;
      IF v_status <> 'Approved' THEN
        RAISE EXCEPTION 'settle_payment: booking is %, not Approved', v_status;
      END IF;
    WHEN 'request' THEN
      SELECT r.amount, r.status::TEXT, r.member_id INTO v_due, v_status, v_owner
        FROM requests r WHERE r.id = p_target_id FOR UPDATE;
      IF NOT FOUND THEN RAISE EXCEPTION 'settle_payment: request not found'; END IF;
      IF v_status NOT IN ('Sent', 'Partially Paid') THEN
        RAISE EXCEPTION 'settle_payment: request is %, not payable', v_status;
      END IF;
      v_request_id := p_target_id;
    WHEN 'event_registration' THEN
      SELECT e.status, e.member_id INTO v_status, v_owner
        FROM event_registrations e WHERE e.id = p_target_id FOR UPDATE;
      IF NOT FOUND THEN RAISE EXCEPTION 'settle_payment: registration not found'; END IF;
      IF v_status <> 'Pending Payment' THEN
        RAISE EXCEPTION 'settle_payment: registration is %, not Pending Payment', v_status;
      END IF;
    WHEN 'donation' THEN
      IF p_purpose NOT IN ('Donation', 'Sponsorship') THEN
        RAISE EXCEPTION 'settle_payment: a donation needs purpose Donation or Sponsorship';
      END IF;
    ELSE
      RAISE EXCEPTION 'settle_payment: unknown target kind %', p_target_kind;
  END CASE;

  IF v_owner IS NOT NULL AND v_owner <> p_member_id THEN
    RAISE EXCEPTION 'settle_payment: the item belongs to another member';
  END IF;
  IF v_due IS NOT NULL AND p_amount <> v_due THEN
    RAISE EXCEPTION 'settle_payment: amount % does not match the % due', p_amount, v_due;
  END IF;

  INSERT INTO payments (
    member_id, request_id, amount, method, purpose,
    stripe_payment_intent_id, stripe_charge_id, check_number, zelle_reference,
    notes, payment_date, created_by, idempotency_key
  ) VALUES (
    p_member_id, v_request_id, p_amount, p_method, p_purpose,
    p_stripe_payment_intent_id, p_stripe_charge_id, p_check_number, p_zelle_reference,
    p_notes, p_paid_at, p_created_by, p_idempotency_key
  ) RETURNING id INTO v_payment_id;

  CASE p_target_kind
    WHEN 'membership' THEN
      IF p_level = 'Lifetime' THEN
        INSERT INTO memberships (member_id, level, status, year, start_date, end_date, payment_id, amount)
        VALUES (p_member_id, 'Lifetime', 'Active', NULL, v_paid_on, NULL, v_payment_id, p_amount);
      ELSE
        v_year := membership_term_year(p_member_id, v_paid_on);
        INSERT INTO memberships (member_id, level, status, year, start_date, end_date, payment_id, amount)
        VALUES (p_member_id, 'Annual', 'Active', v_year, v_paid_on, make_date(v_year, 12, 31), v_payment_id, p_amount);
      END IF;
      PERFORM set_member_level(p_member_id, p_level);
    WHEN 'booking' THEN
      UPDATE service_bookings SET status = 'Paid', payment_id = v_payment_id, paid_at = p_paid_at
        WHERE id = p_target_id;
    WHEN 'request' THEN
      UPDATE requests SET status = 'Paid' WHERE id = p_target_id;
    WHEN 'event_registration' THEN
      UPDATE event_registrations SET status = 'Confirmed', payment_id = v_payment_id, amount_paid = p_amount
        WHERE id = p_target_id;
    ELSE
      NULL;
  END CASE;

  INSERT INTO receipts (receipt_number, payment_id, member_id, amount, payment_method, purpose, receipt_date)
  VALUES ('', v_payment_id, p_member_id, p_amount, p_method, p_purpose, p_paid_at)
  RETURNING id, receipts.receipt_number INTO v_receipt_id, v_receipt_number;

  RETURN QUERY SELECT v_payment_id, v_receipt_id, v_receipt_number, FALSE;
END;
$$;

-- Only the server (service role) settles payments.
REVOKE EXECUTE ON FUNCTION settle_payment(TEXT, UUID, payment_purpose, payment_method, NUMERIC, TEXT, UUID, membership_level, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION settle_payment(TEXT, UUID, payment_purpose, payment_method, NUMERIC, TEXT, UUID, membership_level, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TIMESTAMPTZ) TO service_role;
REVOKE EXECUTE ON FUNCTION set_member_level(UUID, membership_level) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION set_member_level(UUID, membership_level) TO service_role;
REVOKE EXECUTE ON FUNCTION membership_term_year(UUID, DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION membership_term_year(UUID, DATE) TO authenticated, service_role;
