-- Align the events table with the application that reads and writes it.
--
-- Every events page -- /member/events, /admin/events, event creation, editing
-- and registration -- queried columns that exist in no migration in this repo
-- and in no deployed database. PostgREST answered every one of them with 400:
--
--   GET /events?status=eq.Published  ->  column events.status does not exist
--   GET /events?select=event_name    ->  column events.event_name does not exist
--
-- The feature has therefore never worked. It looked merely empty rather than
-- broken, because the pages catch their own errors and fall through to an
-- empty state, and because next.config.ts sets ignoreBuildErrors so the type
-- checker never got to say so.
--
-- Direction of the fix: the DATABASE moves to the application, not the other
-- way round. The application's column set is the richer one -- categories, a
-- draft/published lifecycle, an image, contact details, separate member and
-- non-member prices -- and matching the database instead would mean deleting
-- working UI. Both events and event_registrations are empty (verified against
-- the dev project before writing this), and no production database exists yet
-- (DEC-006), so there is nothing to migrate and the renames are free.
--
-- Renamed columns are renamed rather than duplicated so there is exactly one
-- name per concept. The only code that referenced the old names was the
-- generated lib/supabase/database.types.ts, never application code.

-- 1. Renames: same concept, the name the application uses.
ALTER TABLE events RENAME COLUMN name TO event_name;
ALTER TABLE events RENAME COLUMN max_attendees TO max_capacity;
ALTER TABLE events RENAME COLUMN registration_closes_at TO registration_deadline;

-- 2. The publication lifecycle. Members must only ever see Published events;
--    without this column the member list had no way to exclude a draft.
DO $$ BEGIN
  CREATE TYPE event_status AS ENUM ('Draft', 'Published', 'Cancelled', 'Completed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE events ADD COLUMN IF NOT EXISTS status event_status NOT NULL DEFAULT 'Draft';

-- 3. Categorisation, matching the options the admin create form offers.
DO $$ BEGIN
  CREATE TYPE event_category AS ENUM
    ('Festival', 'Puja', 'Educational', 'Social', 'Cultural', 'Fundraiser', 'Other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE events ADD COLUMN IF NOT EXISTS category event_category NOT NULL DEFAULT 'Other';

-- 4. Two explicit prices. The old price_per_person + member_discount_percent
--    pair expressed the same idea by arithmetic; the application asks for the
--    two figures directly. The old columns are left in place -- both are
--    nullable, so they cost nothing, and dropping them is a separate decision.
ALTER TABLE events ADD COLUMN IF NOT EXISTS member_price NUMERIC(10,2);
ALTER TABLE events ADD COLUMN IF NOT EXISTS non_member_price NUMERIC(10,2);

-- 5. Presentation and contact details shown on the event detail page.
ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- 6. Members filter on status constantly; every list query uses it.
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);

COMMENT ON COLUMN events.status IS
  'Draft is invisible to members. Only Published appears in /member/events.';
COMMENT ON COLUMN events.price_per_person IS
  'Superseded by member_price / non_member_price. Retained, unused by the app.';
COMMENT ON COLUMN events.member_discount_percent IS
  'Superseded by member_price / non_member_price. Retained, unused by the app.';

-- 7. Two further columns the application writes to that did not exist, each
--    found the same way -- by asking the live database and getting a 400:
--
--      GET /events?select=is_test_event               -> 400
--      GET /event_registrations?select=attended       -> 400
--
--    is_test_event mirrors members.is_test_account, so the admin list can hide
--    seeded events the same way it hides seeded members. Same name shape, same
--    default, same index.
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_test_event BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_events_is_test_event ON events(is_test_event);

--    attended backs the check-in toggle on /admin/events/[id]/registrations,
--    which counts attendees and writes the flag per registration.
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS attended BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN events.is_test_event IS
  'Seeded/demo event. Hidden by the admin list when test data is toggled off.';
COMMENT ON COLUMN event_registrations.attended IS
  'Set from the check-in toggle on the event registrations page.';
