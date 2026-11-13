-- Tests for the Zelle tables and zelle_record_transfer (migration 20261112000006).
-- Run with: npm run db:sql -- test bcujsesgrzijyisvmnwm supabase/tests/zelle.sql
-- Runs in a transaction that is always rolled back.

DO $$
DECLARE
  m UUID; req UUID; r RECORD; v_failed BOOLEAN; v_count INTEGER;
BEGIN
  INSERT INTO members (first_name, last_name, primary_email, membership_id)
    VALUES ('Test', 'Zelle', 'zelle-test@example.org', '') RETURNING id INTO m;
  INSERT INTO zelle_requests (reference_code, member_id, target_kind, purpose, description, notes, amount_due, expires_at)
    VALUES ('HSNEF-TEST01', m, 'donation', 'Donation', 'Donation: General', 'Donation - General', 51, NOW() + INTERVAL '7 days')
    RETURNING id INTO req;

  -- A short transfer: recorded, request waits for the rest.
  SELECT * INTO r FROM zelle_record_transfer(req, 30, '2026-11-12', 'BANK1', NULL, 'form-1', NULL);
  IF r.received_total <> 30 OR r.amount_due <> 51 OR r.status <> 'sent' OR r.duplicate THEN
    RAISE EXCEPTION 'short transfer: %', row_to_json(r);
  END IF;

  -- The same form again adds nothing.
  SELECT * INTO r FROM zelle_record_transfer(req, 30, '2026-11-12', 'BANK1', NULL, 'form-1', NULL);
  IF NOT r.duplicate OR r.received_total <> 30 THEN RAISE EXCEPTION 'double submit counted: %', row_to_json(r); END IF;

  -- The same bank row twice adds nothing either.
  SELECT * INTO r FROM zelle_record_transfer(req, 21, '2026-11-13', NULL, 'row-abc', NULL, NULL);
  IF r.received_total <> 51 THEN RAISE EXCEPTION 'balance transfer: %', row_to_json(r); END IF;
  SELECT * INTO r FROM zelle_record_transfer(req, 21, '2026-11-13', NULL, 'row-abc', NULL, NULL);
  IF NOT r.duplicate OR r.received_total <> 51 THEN RAISE EXCEPTION 'bank row counted twice'; END IF;

  -- Once paid, no more money can be recorded against it.
  UPDATE zelle_requests SET status = 'paid' WHERE id = req;
  v_failed := FALSE;
  BEGIN PERFORM zelle_record_transfer(req, 5, NULL, NULL, NULL, 'form-2', NULL);
  EXCEPTION WHEN OTHERS THEN v_failed := TRUE; END;
  IF NOT v_failed THEN RAISE EXCEPTION 'recorded money against a paid request'; END IF;

  -- Money arriving after expiry reopens the request for the office.
  UPDATE zelle_requests SET status = 'expired', close_reason = 'Not paid in time' WHERE id = req;
  DELETE FROM zelle_transfers WHERE request_id = req;
  SELECT * INTO r FROM zelle_record_transfer(req, 51, NULL, NULL, NULL, 'form-3', NULL);
  IF r.status <> 'sent' THEN RAISE EXCEPTION 'late money did not reopen: %', row_to_json(r); END IF;

  -- One open request per item (donations excepted).
  INSERT INTO zelle_requests (reference_code, member_id, target_kind, level, purpose, description, amount_due, expires_at)
    VALUES ('HSNEF-TEST02', m, 'membership', 'Annual', 'Membership', 'Annual', 101, NOW() + INTERVAL '7 days');
  v_failed := FALSE;
  BEGIN
    INSERT INTO zelle_requests (reference_code, member_id, target_kind, level, purpose, description, amount_due, expires_at)
      VALUES ('HSNEF-TEST03', m, 'membership', 'Annual', 'Membership', 'Annual', 101, NOW() + INTERVAL '7 days');
  EXCEPTION WHEN unique_violation THEN v_failed := TRUE; END;
  IF NOT v_failed THEN RAISE EXCEPTION 'two open requests for the same membership'; END IF;
  INSERT INTO zelle_requests (reference_code, member_id, target_kind, purpose, description, amount_due, expires_at)
    VALUES ('HSNEF-TEST04', m, 'donation', 'Donation', 'Second donation', 10, NOW() + INTERVAL '7 days');

  -- Settings are in place, Zelle starts switched off.
  SELECT COUNT(*) INTO v_count FROM portal_settings
    WHERE setting_key IN ('zelle_reminder_days', 'zelle_expiry_days', 'zelle_qr_image_path', 'office_alert_emails');
  IF v_count <> 4 THEN RAISE EXCEPTION 'settings missing'; END IF;
  IF (SELECT setting_value->>'enabled' FROM portal_settings WHERE setting_key = 'zelle_enabled') <> 'false' THEN
    RAISE EXCEPTION 'Zelle should start switched off';
  END IF;
END;
$$;

SELECT 'ok' AS zelle_tests;
