-- ============================================================================
-- Zelle, built for real use (2026-11-12)
-- ============================================================================
-- Spec: docs/architecture/payments.md (agreed by Sujit). Replaces the
-- prototype from 20260111000003, which members could not complete (RLS
-- refused their "I've sent it"), auto-confirmed $50-and-under unchecked,
-- could be confirmed twice, and sent no receipts. Its table was empty on both
-- databases (checked 2026-11-12), so it is replaced rather than altered.
--
-- A member (or the office) opens a request for an item: the amount is the
-- item's own, set by the server. The member sends the money from their bank
-- with the request's reference code in the memo and says "I've sent it". The
-- office confirms what actually arrived (by hand, or from the bank's CSV);
-- when the full amount is in, the request is settled through settle_payment,
-- like every payment. Members never write to these tables: everything goes
-- through server routes using the service role.
--
-- Apply to dev-mp (bcujsesgrzijyisvmnwm) first; prod-mp only with approval.

DROP TABLE IF EXISTS zelle_payment_requests CASCADE;
DROP FUNCTION IF EXISTS generate_zelle_reference_code() CASCADE;
DROP TYPE IF EXISTS zelle_request_status CASCADE;

DO $$ BEGIN
  CREATE TYPE zelle_status AS ENUM (
    'awaiting',      -- opened; the member has not said they sent it
    'sent',          -- the member says they sent it (or part has arrived)
    'paid',          -- the full amount arrived and was settled
    'not_received',  -- the office found nothing; the member may pay again
    'cancelled',     -- withdrawn by the member or the office
    'expired'        -- not paid in time; any held place released
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS zelle_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_code TEXT NOT NULL UNIQUE,   -- HSNEF-XXXXXX, goes in the Zelle memo
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,

  -- What it pays for (the same shape settle_payment takes).
  target_kind TEXT NOT NULL CHECK (target_kind IN ('membership', 'booking', 'request', 'event_registration', 'donation')),
  target_id UUID,
  level membership_level,
  purpose payment_purpose NOT NULL,
  description TEXT NOT NULL,
  notes TEXT,                            -- e.g. the donation fund
  amount_due NUMERIC(10, 2) NOT NULL CHECK (amount_due > 0),

  status zelle_status NOT NULL DEFAULT 'awaiting',
  member_sent_at TIMESTAMPTZ,
  member_bank_reference TEXT,
  reminder_sent_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES auth.users(id),
  close_reason TEXT,
  payment_id UUID REFERENCES payments(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_zelle_requests_member ON zelle_requests(member_id);
CREATE INDEX IF NOT EXISTS idx_zelle_requests_status ON zelle_requests(status);
-- One open request per item: asking again returns the same one.
CREATE UNIQUE INDEX IF NOT EXISTS uq_zelle_requests_open_item
  ON zelle_requests(member_id, target_kind, target_id, level) NULLS NOT DISTINCT
  WHERE status IN ('awaiting', 'sent') AND target_kind <> 'donation';

CREATE TRIGGER update_zelle_requests_updated_at
  BEFORE UPDATE ON zelle_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Money that actually arrived, possibly in more than one transfer.
CREATE TABLE IF NOT EXISTS zelle_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES zelle_requests(id) ON DELETE RESTRICT,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  received_on DATE NOT NULL,
  bank_reference TEXT,
  bank_row_hash TEXT UNIQUE,             -- set when it came from a bank file
  submission_id TEXT UNIQUE,             -- the office form, so a double submit adds nothing
  recorded_by UUID REFERENCES auth.users(id),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_zelle_transfers_request ON zelle_transfers(request_id);

-- Rows already read from the bank's file, so an overlapping upload is safe.
CREATE TABLE IF NOT EXISTS zelle_bank_rows (
  hash TEXT PRIMARY KEY,
  posted_on DATE,
  amount NUMERIC(10, 2),
  memo TEXT,
  sender TEXT,
  outcome TEXT NOT NULL CHECK (outcome IN ('confirmed', 'ignored')),
  request_id UUID REFERENCES zelle_requests(id),
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  imported_by UUID REFERENCES auth.users(id)
);

-- Row-level security: members read their own requests; staff read
-- everything. Nobody writes except the server (service role).
ALTER TABLE zelle_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE zelle_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE zelle_bank_rows ENABLE ROW LEVEL SECURITY;

CREATE POLICY zelle_requests_member_read ON zelle_requests FOR SELECT TO authenticated
  USING (is_own_member_record(member_id));
CREATE POLICY zelle_requests_staff_read ON zelle_requests FOR SELECT TO authenticated
  USING (has_any_role(ARRAY['Office Staff', 'Office Manager', 'Admin']::user_role[]));
CREATE POLICY zelle_transfers_member_read ON zelle_transfers FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM zelle_requests r WHERE r.id = request_id AND is_own_member_record(r.member_id)));
CREATE POLICY zelle_transfers_staff_read ON zelle_transfers FOR SELECT TO authenticated
  USING (has_any_role(ARRAY['Office Staff', 'Office Manager', 'Admin']::user_role[]));
CREATE POLICY zelle_bank_rows_staff_read ON zelle_bank_rows FOR SELECT TO authenticated
  USING (has_any_role(ARRAY['Office Staff', 'Office Manager', 'Admin']::user_role[]));

-- Record money that arrived for a request. Locks the request, so two staff
-- (or a staff member and a bank file) cannot both count the same request
-- past paid. Returns the running total. Settling (when the total reaches the
-- amount due) is done by the server through settle_payment.
CREATE OR REPLACE FUNCTION zelle_record_transfer(
  p_request_id UUID,
  p_amount NUMERIC,
  p_received_on DATE,
  p_bank_reference TEXT,
  p_bank_row_hash TEXT,
  p_submission_id TEXT,
  p_staff UUID
)
RETURNS TABLE (received_total NUMERIC, amount_due NUMERIC, status zelle_status, duplicate BOOLEAN)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_req zelle_requests%ROWTYPE;
BEGIN
  SELECT * INTO v_req FROM zelle_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'zelle: request not found'; END IF;
  IF v_req.status = 'paid' THEN RAISE EXCEPTION 'zelle: this request is already paid'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'zelle: amount must be positive'; END IF;

  -- The same form or the same bank row again: nothing new.
  IF (p_submission_id IS NOT NULL AND EXISTS (SELECT 1 FROM zelle_transfers WHERE submission_id = p_submission_id))
     OR (p_bank_row_hash IS NOT NULL AND EXISTS (SELECT 1 FROM zelle_transfers WHERE bank_row_hash = p_bank_row_hash)) THEN
    RETURN QUERY SELECT COALESCE(SUM(t.amount), 0), v_req.amount_due, v_req.status, TRUE
      FROM zelle_transfers t WHERE t.request_id = p_request_id;
    RETURN;
  END IF;

  INSERT INTO zelle_transfers (request_id, amount, received_on, bank_reference, bank_row_hash, submission_id, recorded_by)
  VALUES (p_request_id, p_amount, COALESCE(p_received_on, CURRENT_DATE), p_bank_reference, p_bank_row_hash, p_submission_id, p_staff);

  -- Money has arrived: whatever the state was (even expired or "not
  -- received"), it is now with the office until the full amount is in.
  UPDATE zelle_requests SET status = 'sent', closed_at = NULL, close_reason = NULL
    WHERE id = p_request_id AND zelle_requests.status <> 'sent';

  RETURN QUERY SELECT COALESCE(SUM(t.amount), 0), v_req.amount_due, 'sent'::zelle_status, FALSE
    FROM zelle_transfers t WHERE t.request_id = p_request_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION zelle_record_transfer(UUID, NUMERIC, DATE, TEXT, TEXT, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION zelle_record_transfer(UUID, NUMERIC, DATE, TEXT, TEXT, TEXT, UUID) TO service_role;

-- Settings (Portal Settings -> Zelle; Office alerts). An event place is always
-- held while a Zelle request is open (released when it expires): with no hold,
-- an event could fill while the member's money was on its way. Values use the shapes
-- the settings table already uses: {"enabled": bool} or {"value": ...}.
DELETE FROM portal_settings WHERE setting_key IN ('zelle_auto_confirm_threshold', 'zelle_request_expiry_hours');
UPDATE portal_settings SET setting_value = '{"enabled": false}'::jsonb,
  description = 'Offer Zelle at checkout. It can only be switched on once a Zelle email or phone is set.'
  WHERE setting_key = 'zelle_enabled';

INSERT INTO portal_settings (setting_key, setting_value, setting_type, display_name, description, category) VALUES
  ('zelle_recipient_name', '{"value": "Hindu Society of North East Florida"}', 'string', 'Zelle recipient name',
   'The name the member''s bank shows when they send to the temple.', 'payments'),
  ('zelle_reminder_days', '{"value": 3}', 'number', 'Days before a Zelle reminder',
   'A member who has not paid gets one reminder after this many days.', 'payments'),
  ('zelle_expiry_days', '{"value": 7}', 'number', 'Days before a Zelle request expires',
   'An unpaid request expires after this many days, and any held booking or event place is released.', 'payments'),
  ('zelle_qr_image_path', '{"value": ""}', 'string', 'Zelle QR code image',
   'The temple''s Zelle QR code from its banking app, shown to members at checkout.', 'payments'),
  ('zelle_csv_mapping', '{"value": null}', 'json', 'Bank file columns',
   'Which columns of the bank''s transaction file hold the date, amount, memo and sender.', 'payments'),
  ('office_alert_emails', '{"value": ["dev-mp@hsnef.org"]}', 'json', 'Office alerts',
   'Everyone on this list is emailed when something needs the office: a Zelle payment sent, a registration or booking awaiting approval.', 'general')
ON CONFLICT (setting_key) DO NOTHING;

-- A public bucket for the QR image (staff upload it in Portal Settings).
INSERT INTO storage.buckets (id, name, public)
  VALUES ('portal-assets', 'portal-assets', true)
  ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS portal_assets_staff_write ON storage.objects;
CREATE POLICY portal_assets_staff_write ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'portal-assets' AND has_any_role(ARRAY['Office Manager', 'Admin']::user_role[]))
  WITH CHECK (bucket_id = 'portal-assets' AND has_any_role(ARRAY['Office Manager', 'Admin']::user_role[]));
