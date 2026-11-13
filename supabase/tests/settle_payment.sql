-- Tests for settle_payment (migration 20261112000003).
-- Run with: npm run db:sql -- test bcujsesgrzijyisvmnwm supabase/tests/settle_payment.sql
-- Runs inside a transaction that is always rolled back; it never runs on prod.
-- Each check raises with a message on failure; the last statement returns 'ok'.

DO $$
DECLARE
  m1 UUID; m2 UUID; m3 UUID;
  r RECORD; r2 RECORD;
  v_bk UUID; v_req UUID; v_ev UUID; v_reg UUID;
  v_count INTEGER; v_text TEXT; v_failed BOOLEAN;
BEGIN
  INSERT INTO members (first_name, last_name, primary_email, membership_id)
    VALUES ('Test', 'Settle', 'settle-1@example.org', '') RETURNING id INTO m1;
  INSERT INTO members (first_name, last_name, primary_email, membership_id)
    VALUES ('Test', 'October', 'settle-2@example.org', '') RETURNING id INTO m2;
  INSERT INTO members (first_name, last_name, primary_email, membership_id)
    VALUES ('Test', 'Other', 'settle-3@example.org', '') RETURNING id INTO m3;

  -- Annual paid in March: valid to Dec 31 of the same year; level and number change.
  SELECT * INTO r FROM settle_payment('test:a1', m1, 'Membership', 'Stripe', 150, 'membership',
    p_level => 'Annual', p_stripe_payment_intent_id => 'pi_test_a1', p_paid_at => '2026-03-01 12:00-05');
  IF r.already_settled THEN RAISE EXCEPTION 'first settle reported already_settled'; END IF;
  SELECT year::TEXT || '|' || end_date::TEXT INTO v_text FROM memberships WHERE payment_id = r.payment_id;
  IF v_text <> '2026|2026-12-31' THEN RAISE EXCEPTION 'March annual term wrong: %', v_text; END IF;
  SELECT current_level::TEXT || '|' || LEFT(membership_id, 1) INTO v_text FROM members WHERE id = m1;
  IF v_text <> 'Annual|2' THEN RAISE EXCEPTION 'level/number not updated: %', v_text; END IF;
  IF r.receipt_number !~ '^RCP-[0-9]{4}-[0-9]{6}$' THEN RAISE EXCEPTION 'receipt number %', r.receipt_number; END IF;

  -- Same key again: no second payment, same receipt.
  SELECT * INTO r2 FROM settle_payment('test:a1', m1, 'Membership', 'Stripe', 150, 'membership',
    p_level => 'Annual', p_stripe_payment_intent_id => 'pi_test_a1');
  IF NOT r2.already_settled OR r2.payment_id <> r.payment_id OR r2.receipt_number <> r.receipt_number THEN
    RAISE EXCEPTION 'repeat settle was not idempotent';
  END IF;
  SELECT COUNT(*) INTO v_count FROM payments WHERE member_id = m1;
  IF v_count <> 1 THEN RAISE EXCEPTION 'expected 1 payment, got %', v_count; END IF;

  -- Renewing early: the year already held is skipped. Second receipt numbers on (the old generator failed here).
  SELECT * INTO r2 FROM settle_payment('test:a2', m1, 'Membership', 'Cash', 150, 'membership',
    p_level => 'Annual', p_paid_at => '2026-04-01 12:00-05');
  SELECT year INTO v_count FROM memberships WHERE payment_id = r2.payment_id;
  IF v_count <> 2027 THEN RAISE EXCEPTION 'early renewal should buy 2027, got %', v_count; END IF;
  IF r2.receipt_number = r.receipt_number THEN RAISE EXCEPTION 'receipt numbers repeated'; END IF;

  -- Annual paid in October: next year.
  SELECT * INTO r FROM settle_payment('test:a3', m2, 'Membership', 'Zelle', 150, 'membership',
    p_level => 'Annual', p_paid_at => '2026-10-15 12:00-04');
  SELECT year INTO v_count FROM memberships WHERE payment_id = r.payment_id;
  IF v_count <> 2027 THEN RAISE EXCEPTION 'October annual should be 2027, got %', v_count; END IF;

  -- Lifetime: no end date; a Lifetime member cannot buy Annual.
  SELECT * INTO r FROM settle_payment('test:l1', m2, 'Membership', 'Check', 1000, 'membership',
    p_level => 'Lifetime', p_check_number => '1001');
  SELECT (end_date IS NULL)::TEXT INTO v_text FROM memberships WHERE payment_id = r.payment_id;
  IF v_text <> 'true' THEN RAISE EXCEPTION 'lifetime has an end date'; END IF;
  v_failed := FALSE;
  BEGIN
    PERFORM settle_payment('test:l2', m2, 'Membership', 'Cash', 150, 'membership', p_level => 'Annual');
  EXCEPTION WHEN OTHERS THEN v_failed := TRUE; END;
  IF NOT v_failed THEN RAISE EXCEPTION 'Lifetime member bought Annual'; END IF;

  -- Booking: must be Approved, the amount must match, and it becomes Paid.
  INSERT INTO service_bookings (member_id, requester_name, requester_phone, requester_email, total_amount, status)
    VALUES (m1, 'Test Settle', '9045550100', 'settle-1@example.org', 51, 'Pending Approval') RETURNING id INTO v_bk;
  v_failed := FALSE;
  BEGIN PERFORM settle_payment('test:b0', m1, 'Service', 'Stripe', 51, 'booking', v_bk, p_stripe_payment_intent_id => 'pi_test_b0');
  EXCEPTION WHEN OTHERS THEN v_failed := TRUE; END;
  IF NOT v_failed THEN RAISE EXCEPTION 'settled a booking that was not Approved'; END IF;
  UPDATE service_bookings SET status = 'Approved' WHERE id = v_bk;
  v_failed := FALSE;
  BEGIN PERFORM settle_payment('test:b1', m1, 'Service', 'Stripe', 50, 'booking', v_bk, p_stripe_payment_intent_id => 'pi_test_b1');
  EXCEPTION WHEN OTHERS THEN v_failed := TRUE; END;
  IF NOT v_failed THEN RAISE EXCEPTION 'settled a booking with the wrong amount'; END IF;
  v_failed := FALSE;
  BEGIN PERFORM settle_payment('test:b2', m3, 'Service', 'Cash', 51, 'booking', v_bk);
  EXCEPTION WHEN OTHERS THEN v_failed := TRUE; END;
  IF NOT v_failed THEN RAISE EXCEPTION 'settled another member''s booking'; END IF;
  SELECT * INTO r FROM settle_payment('test:b3', m1, 'Service', 'Stripe', 51, 'booking', v_bk,
    p_stripe_payment_intent_id => 'pi_test_b3');
  SELECT status::TEXT || '|' || (payment_id = r.payment_id)::TEXT || '|' || (paid_at IS NOT NULL)::TEXT
    INTO v_text FROM service_bookings WHERE id = v_bk;
  IF v_text <> 'Paid|true|true' THEN RAISE EXCEPTION 'booking not marked paid: %', v_text; END IF;

  -- Request: Sent -> Paid, linked on the payment.
  INSERT INTO requests (request_number, member_id, purpose, description, amount, status)
    VALUES ('', m1, 'Request', 'Test invoice', 25, 'Sent') RETURNING id INTO v_req;
  SELECT * INTO r FROM settle_payment('test:q1', m1, 'Request', 'Zelle', 25, 'request', v_req, p_zelle_reference => 'HSNEF-TEST01');
  SELECT status::TEXT INTO v_text FROM requests WHERE id = v_req;
  IF v_text <> 'Paid' THEN RAISE EXCEPTION 'request not Paid: %', v_text; END IF;
  SELECT (request_id = v_req)::TEXT INTO v_text FROM payments WHERE id = r.payment_id;
  IF v_text <> 'true' THEN RAISE EXCEPTION 'payment not linked to request'; END IF;

  -- Event registration: Pending Payment -> Confirmed.
  INSERT INTO events (event_name, event_date) VALUES ('Test settle event', '2026-12-01') RETURNING id INTO v_ev;
  INSERT INTO event_registrations (event_id, member_id, status) VALUES (v_ev, m1, 'Pending Payment') RETURNING id INTO v_reg;
  SELECT * INTO r FROM settle_payment('test:e1', m1, 'Event', 'Stripe', 20, 'event_registration', v_reg,
    p_stripe_payment_intent_id => 'pi_test_e1');
  SELECT status || '|' || amount_paid::TEXT INTO v_text FROM event_registrations WHERE id = v_reg;
  IF v_text <> 'Confirmed|20.00' THEN RAISE EXCEPTION 'registration not confirmed: %', v_text; END IF;

  -- Donation: just a payment and a receipt.
  SELECT * INTO r FROM settle_payment('test:d1', m3, 'Donation', 'Card', 11, 'donation', p_notes => 'Donation - General');
  SELECT COUNT(*) INTO v_count FROM receipts WHERE payment_id = r.payment_id;
  IF v_count <> 1 THEN RAISE EXCEPTION 'donation receipt missing'; END IF;

  -- One Stripe intent can never be recorded twice, even under a different key.
  v_failed := FALSE;
  BEGIN PERFORM settle_payment('test:d2', m3, 'Donation', 'Stripe', 11, 'donation', p_stripe_payment_intent_id => 'pi_test_e1');
  EXCEPTION WHEN unique_violation THEN v_failed := TRUE; END;
  IF NOT v_failed THEN RAISE EXCEPTION 'a Stripe intent was recorded twice'; END IF;
END;
$$;

SELECT 'ok' AS settle_payment_tests;
