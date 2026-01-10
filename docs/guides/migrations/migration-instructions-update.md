# Database Migration Instructions - UPDATE

## New Migration Added

A new migration has been added for test accounts functionality:

### Migration 4: Test Accounts
**File:** `supabase/migrations/20260108000004_test_accounts.sql`

**What it does:**
- Adds `is_test_account` boolean column to members table
- Creates 5 test accounts with special membership numbers (prefix 9)
- Adds index for efficient filtering
- Adds helpful database comment

**Note:** Requires Migration 5 to be run first (updates constraints)

### Migration 5: Update Constraints for Test Accounts
**File:** `supabase/migrations/20260108000005_update_constraints_for_test_accounts.sql`

**What it does:**
- Updates membership_id format constraint to allow prefix 9
- Updates prefix-level constraint to bypass validation for test accounts
- Updates trigger function to skip validation for test accounts
- Required before running Migration 4

---

## How to Run Migrations

### All Migrations in Order:

```bash
# Run all migrations in sequence
# Navigate to your Supabase dashboard or use Supabase CLI

# Migration 1: Import Batch Tracking
# File: 20260108000001_import_batch_tracking.sql

# Migration 2: Service Booking System
# File: 20260108000002_service_booking_system.sql

# Migration 3: Initial Services Data
# File: 20260108000003_initial_services_data.sql

# Migration 4: Update Constraints for Test Accounts (REQUIRED FIRST)
# File: 20260108000005_update_constraints_for_test_accounts.sql

# Migration 5: Test Accounts (NEW)
# File: 20260108000004_test_accounts.sql
```

### Using Supabase Dashboard:

1. Go to your Supabase project
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the contents of the migration file
5. Click **Run** or press `Ctrl/Cmd + Enter`
6. Repeat for each migration file in order

### Using Supabase CLI:

```bash
# If you have Supabase CLI installed
supabase db push

# Or run individual migrations
supabase db execute -f supabase/migrations/20260108000004_test_accounts.sql
```

---

## Verification

### Verify Migration 5 (Constraints) Succeeded:

```sql
-- Check if format constraint allows prefix 9
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'chk_membership_id_format';

-- Check if prefix constraint allows test accounts
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'chk_membership_id_prefix';
```

### Verify Migration 4 (Test Accounts) Succeeded:

```sql
-- Check if column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'members'
AND column_name = 'is_test_account';

-- Check if test accounts were created
SELECT membership_id, first_name, last_name, primary_email, is_test_account
FROM members
WHERE is_test_account = true
ORDER BY membership_id;

-- Expected: 5 test accounts
-- 99991000 - Test Manager
-- 99992000 - Test Staff
-- 99993000 - Test Lifetime
-- 99994000 - Test Annual
-- 99995000 - Test Community
```

---

## Rollback (if needed)

If you need to rollback Migration 4:

```sql
-- Remove test accounts
DELETE FROM members WHERE is_test_account = true;

-- Drop column
ALTER TABLE members DROP COLUMN IF EXISTS is_test_account;

-- Drop index
DROP INDEX IF EXISTS idx_members_is_test_account;
```

---

## Next Steps After Migration

1. **Access Test Accounts Page:** `/admin/test-accounts`
2. **Register Test Users:** Use the emails listed or send password resets
3. **Read the Guide:** See `../features/test-accounts-guide.md` for complete instructions
4. **Start Testing:** Use test accounts for all development and QA

---

## Migration Summary

| Migration | File | Status | Purpose |
|-----------|------|--------|---------|
| 1 | 20260108000001_import_batch_tracking.sql | ✅ Required | Import history & revert |
| 2 | 20260108000002_service_booking_system.sql | ✅ Required | Service booking tables |
| 3 | 20260108000003_initial_services_data.sql | ✅ Required | 37 services + 2 purohits |
| 4 | 20260108000005_update_constraints_for_test_accounts.sql | 🆕 NEW | Allow prefix 9 for test accounts |
| 5 | 20260108000004_test_accounts.sql | 🆕 NEW | Test accounts setup (run after #4) |

---

## Important Notes

- Run migrations in order
- Test accounts won't affect production metrics
- Migration 4 is safe to run in production
- Test account emails use @example.com (not real emails)
- Test accounts can be cleaned without affecting real data
