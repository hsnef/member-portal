# Test Accounts Migration Instructions

## Important: Run Migrations in Order

You must run **Migration 5** BEFORE **Migration 4** because Migration 4 (test accounts) requires the updated constraints from Migration 5.

---

## Step 1: Update Constraints (Migration 5)

**File:** `supabase/migrations/20260108000005_update_constraints_for_test_accounts.sql`

**What it does:**
- Allows membership IDs with prefix `9` for test accounts
- Updates constraints to bypass level-prefix matching for test accounts
- Updates trigger function to skip validation for test accounts

**How to Run:**
1. Open Supabase Dashboard → SQL Editor
2. Copy entire contents of `20260108000005_update_constraints_for_test_accounts.sql`
3. Paste into SQL Editor
4. Click **Run**

**Verify Success:**
```sql
-- Check constraints were updated
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name IN ('chk_membership_id_format', 'chk_membership_id_prefix');
```

---

## Step 2: Create Test Accounts (Migration 4)

**File:** `supabase/migrations/20260108000004_test_accounts.sql`

**What it does:**
- Adds `is_test_account` column to members table
- Creates 5 test accounts with prefix 9 membership IDs
- Adds index for filtering

**How to Run:**
1. Open Supabase Dashboard → SQL Editor
2. Copy entire contents of `20260108000004_test_accounts.sql`
3. Paste into SQL Editor
4. Click **Run**

**Verify Success:**
```sql
-- Check if test accounts were created
SELECT membership_id, first_name, last_name, primary_email, current_level, is_test_account
FROM members
WHERE is_test_account = true
ORDER BY membership_id;

-- Expected results:
-- 99991000 - Test Manager (Lifetime)
-- 99992000 - Test Staff (Lifetime)
-- 99993000 - Test Lifetime (Lifetime)
-- 99994000 - Test Annual (Annual)
-- 99995000 - Test Community (Community)
```

---

## Test Account Membership IDs

| Account | Membership ID | Pattern | Level |
|---------|---------------|---------|-------|
| Test Manager | `99991000` | `9` + `1` (Manager) + `000` + `00` | Lifetime |
| Test Staff | `99992000` | `9` + `2` (Staff) + `000` + `00` | Lifetime |
| Test Lifetime | `99993000` | `9` + `3` (Lifetime) + `000` + `00` | Lifetime |
| Test Annual | `99994000` | `9` + `4` (Annual) + `000` + `00` | Annual |
| Test Community | `99995000` | `9` + `5` (Community) + `000` + `00` | Community |

**Pattern Explanation:**
- First digit: `9` = Test account
- Second digit: `1-2` = Staff accounts, `3-5` = Member accounts (3=Lifetime, 4=Annual, 5=Community)
- Next 3 digits: Sequence number
- Last 2 digits: `00` (required suffix)

---

## Troubleshooting

### Error: "constraint violation"
**Solution:** Make sure you ran Migration 5 BEFORE Migration 4.

### Error: "membership_id already exists"
**Solution:** The test accounts already exist. You can either:
- Delete existing test accounts: `DELETE FROM members WHERE is_test_account = true;`
- Or the migration will skip duplicates (ON CONFLICT DO NOTHING)

### Error: "prefix does not match level"
**Solution:** Migration 5 didn't run successfully. Re-run Migration 5 first.

---

## Next Steps

After running both migrations:

1. **Register Test Users:**
   - Go to `/register` and register with test account emails
   - Or use `/admin/test-accounts` to reset passwords

2. **Access Test Accounts Page:**
   - Navigate to `/admin/test-accounts`
   - View all test accounts and their status

3. **Start Testing:**
   - Use test accounts for all development and QA
   - Test accounts are automatically filtered from reports

---

## Rollback (if needed)

If you need to remove test accounts:

```sql
-- Remove test accounts
DELETE FROM members WHERE is_test_account = true;

-- Remove column (optional)
ALTER TABLE members DROP COLUMN IF EXISTS is_test_account;

-- Remove index (optional)
DROP INDEX IF EXISTS idx_members_is_test_account;
```

**Note:** To rollback constraints, you would need to restore the original constraints from the initial schema migration.
