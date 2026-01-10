# Test Accounts Setup Complete! ✅

## What Was Created

### Database Changes:
- ✅ `is_test_account` column added to `members` table
- ✅ Constraints updated to allow prefix `9` for test accounts
- ✅ Trigger function updated to skip validation for test accounts
- ✅ Index created for efficient filtering

### Test Accounts Created:

| Account | Email | Membership ID | Level | Role |
|---------|-------|---------------|-------|------|
| Test Manager | test.manager@example.com | 99991000 | Lifetime | Office Manager |
| Test Staff | test.staff@example.com | 99992000 | Lifetime | Office Staff |
| Test Lifetime | test.lifetime@example.com | 99993000 | Lifetime | Member |
| Test Annual | test.annual@example.com | 99994000 | Annual | Member |
| Test Community | test.community@example.com | 99995000 | Community | Member |

---

## Next Steps

### 1. Register Test Users

Test accounts exist in the database but need to be registered in Supabase Auth.

**Option A: Self-Registration (Recommended)**
1. Go to `/register` on your member portal
2. Register using each test account email:
   - test.manager@example.com
   - test.staff@example.com
   - test.lifetime@example.com
   - test.annual@example.com
   - test.community@example.com
3. Use any password you'll remember (e.g., "TestPassword123!")
4. The system will automatically link the auth account to the existing member record

**Option B: Admin Password Reset**
1. Go to `/admin/test-accounts` (if this page exists)
2. Click "Reset Password" for each account
3. Check email inbox for reset links
4. Complete password setup

### 2. Assign Roles to Staff Accounts

After registering test.manager@example.com and test.staff@example.com, assign their roles:

```sql
-- Get the auth_user_id for test accounts
SELECT id, membership_id, primary_email, auth_user_id
FROM members
WHERE is_test_account = true
AND primary_email IN ('test.manager@example.com', 'test.staff@example.com');

-- Then assign roles (replace USER_ID with actual auth_user_id)
INSERT INTO user_roles (user_id, role)
VALUES 
  ('USER_ID_FOR_MANAGER', 'Office Manager'),
  ('USER_ID_FOR_STAFF', 'Office Staff')
ON CONFLICT (user_id, role) DO NOTHING;
```

### 3. Verify Test Accounts

```sql
-- Check all test accounts
SELECT 
  membership_id,
  first_name,
  last_name,
  primary_email,
  current_level,
  is_test_account,
  auth_user_id IS NOT NULL as is_registered
FROM members
WHERE is_test_account = true
ORDER BY membership_id;
```

---

## Using Test Accounts

### Access Test Accounts Page
Navigate to: `/admin/test-accounts`

This page shows:
- All test accounts and their registration status
- Quick password reset functionality
- "Clean Test Data" button to remove all test transactions
- Complete usage instructions

### Testing Scenarios

**1. Staff Workflows (use test.manager@example.com)**
- Record payments for members
- Approve/reject service bookings
- Manage member records
- Create bookings on behalf of members

**2. Member Experience - Lifetime (use test.lifetime@example.com)**
- Book services (get member pricing)
- Register for events
- Make donations
- View membership pass/QR code

**3. Member Experience - Annual (use test.annual@example.com)**
- Same as Lifetime but with Annual pricing
- Test membership renewal flow

**4. Community Member (use test.community@example.com)**
- Book services (get community pricing - higher rates)
- Register for events
- No membership pass (not a paid member)

**5. Pricing Verification**
Compare service booking prices between:
- test.lifetime@example.com (member rates)
- test.community@example.com (community rates)
- Temple vs External location pricing

---

## Important Notes

### Automatic Filtering
Test accounts are **automatically excluded** from:
- ✅ Dashboard metrics (total members, active members, etc.)
- ✅ Financial reports and totals
- ✅ Analytics and insights
- ✅ Receipts page (unless explicitly included)

Test accounts **ARE visible** in:
- Admin member lists (for management)
- Search results (clearly marked with "TEST" badge)
- Direct queries (when needed)

### Visual Indicators
Test accounts are marked with a **purple "TEST" badge** throughout the UI:
- Member lists
- Search results
- Payment records
- Booking details

### Clean Test Data
Use the "Clean Test Data" button to remove:
- All payments by test accounts
- All service bookings by test accounts
- All event registrations by test accounts
- All requests by test accounts

**Member records remain intact** so you can continue testing without re-registering.

---

## Troubleshooting

### Test Account Shows "Not Registered"
**Solution:** The account exists in the database but needs to be registered in Supabase Auth.
- Use the "Reset Password" button or register at `/register`

### Test Data Appearing in Reports
**Solution:**
1. Verify `is_test_account = true` for the member
2. Ensure report queries filter `is_test_account = false`

### Can't Login to Test Account
**Solution:**
1. Use the "Reset Password" button on `/admin/test-accounts`
2. Check your email for the reset link
3. Set a new password

---

## Quick Reference

```
╔══════════════════════════════════════════════════════════╗
║               TEST ACCOUNTS QUICK REFERENCE               ║
╠══════════════════════════════════════════════════════════╣
║ Manager:     test.manager@example.com    (99991000)     ║
║ Staff:       test.staff@example.com      (99992000)     ║
║ Lifetime:    test.lifetime@example.com   (99993000)     ║
║ Annual:      test.annual@example.com     (99994000)     ║
║ Community:   test.community@example.com  (99995000)     ║
╠══════════════════════════════════════════════════════════╣
║ Management:  /admin/test-accounts                        ║
║ Clean Data:  Click "Clean Test Data" button             ║
║ Password:    Use "Reset Password" on management page    ║
╚══════════════════════════════════════════════════════════╝
```

---

## Success! 🎉

Your test accounts are now set up and ready to use. Start testing your application with confidence knowing test data won't affect production metrics!
