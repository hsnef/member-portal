-- ============================================================================
-- Office Staff can add members (#43)
-- ============================================================================
-- `/admin/members/new`, `/admin/members/import` and the approve button on
-- `/admin/pending-registrations` are open to every staff role (the /admin
-- section gate, see CLAUDE.md "Roles"). The INSERT policy only admitted
-- Office Manager and Admin, so for Office Staff every one of those failed at
-- the database. Decided 2026-10-09: Office Staff can add members.
--
-- This aligns the policy with the route gate. SELECT and UPDATE already include
-- Office Staff; DELETE stays Admin-only.
--
-- Apply to dev-mp (bcujsesgrzijyisvmnwm) first; prod-mp only with approval.

DROP POLICY IF EXISTS members_insert_policy ON members;

CREATE POLICY members_insert_policy ON members
  FOR INSERT
  WITH CHECK (
    has_any_role(ARRAY['Office Staff', 'Office Manager', 'Admin']::user_role[])
  );
