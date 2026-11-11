-- ============================================================================
-- Booking numbers are assigned by the database (#40)
-- ============================================================================
-- service_bookings.booking_number is NOT NULL with no default, and nothing
-- generated it, so every booking insert failed. Decided 2026-11-11 (Sujit):
-- the database assigns it, like membership_id, request_number and
-- receipt_number.
--
-- Format: BK-<year>-<sequence>, e.g. BK-2026-00001. The sequence restarts each
-- year and is at least five digits; past 99999 in a year it simply grows a
-- digit (BK-2026-100000) instead of wrapping or truncating. The column is
-- VARCHAR(20), which leaves room for 12 digits.
--
-- Unlike the older generators, this one takes a transaction-scoped advisory
-- lock, so two bookings submitted at the same moment cannot read the same MAX
-- and collide on the UNIQUE constraint.
--
-- SECURITY DEFINER matters here: members insert their own bookings, and RLS
-- lets a member see only their own rows. Run as the caller, the MAX below
-- would see one member's bookings and hand out a number already in use.
--
-- Apply to dev-mp (bcujsesgrzijyisvmnwm) first; prod-mp only with approval.

CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TEXT
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year TEXT := TO_CHAR(NOW(), 'YYYY');
  v_prefix TEXT := 'BK-' || TO_CHAR(NOW(), 'YYYY') || '-';
  v_next BIGINT;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('service_bookings.booking_number'));

  SELECT COALESCE(MAX(SUBSTRING(booking_number FROM LENGTH(v_prefix) + 1)::BIGINT), 0) + 1
  INTO v_next
  FROM service_bookings
  WHERE booking_number ~ ('^BK-' || v_year || '-[0-9]+$');

  -- LPAD would truncate a longer number; only pad when it is shorter.
  RETURN v_prefix || CASE
    WHEN LENGTH(v_next::TEXT) >= 5 THEN v_next::TEXT
    ELSE LPAD(v_next::TEXT, 5, '0')
  END;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION auto_generate_booking_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_number IS NULL OR NEW.booking_number = '' THEN
    NEW.booking_number := generate_booking_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_generate_booking_number ON service_bookings;

CREATE TRIGGER trigger_auto_generate_booking_number
  BEFORE INSERT ON service_bookings
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_booking_number();
