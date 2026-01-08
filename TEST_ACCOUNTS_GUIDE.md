# Test Accounts Guide

## Overview

Test accounts allow you to test all functionality without affecting real member data, metrics, or accounting. They are automatically filtered from reports and clearly marked in the UI.

---

## Test Accounts Created

After running the migration, these test accounts will be available:

| Email | Membership ID | Role | Level | Purpose |
|-------|---------------|------|-------|---------|
| test.manager@example.com | 99991000 | Office Manager | Lifetime | Full admin access |
| test.staff@example.com | 99992000 | Office Staff | Lifetime | Staff functions |
| test.lifetime@example.com | 99993000 | Member | Lifetime | Lifetime member pricing |
| test.annual@example.com | 99994000 | Member | Annual | Annual member pricing |
| test.community@example.com | 99995000 | Member | Community | Non-paid member pricing |

---

## Setup Instructions

### 1. Run the Migrations (IN ORDER)

**IMPORTANT:** You must run Migration 5 BEFORE Migration 4

```bash
# FIRST: Apply the constraint update migration
# This allows prefix 9 for test accounts
# File: supabase/migrations/20260108000005_update_constraints_for_test_accounts.sql

# SECOND: Apply the test accounts migration
# This adds the is_test_account column and creates the 5 test accounts
# File: supabase/migrations/20260108000004_test_accounts.sql
```

### 2. Register Test Users

Test accounts are created in the database but need to be registered in Supabase Auth:

**Option A: Self-Registration (Recommended)**
1. Go to `/register` on the member portal
2. Register using the email addresses above
3. Use any password you'll remember (e.g., "TestPassword123!")
4. The system will automatically link the auth account to the existing member record

**Option B: Admin Password Reset**
1. Go to `/admin/test-accounts`
2. Click "Reset Password" for each account
3. Check the email inbox (use a test email service if needed)
4. Complete the password setup

### 3. Access Test Accounts Page

Navigate to: `/admin/test-accounts`

This page shows:
- All test accounts and their registration status
- Quick password reset functionality
- "Clean Test Data" button to remove all test transactions
- Complete usage instructions

---

## Key Features

### Automatic Filtering

Test accounts are **automatically excluded** from:

✅ Dashboard metrics (total members, active members, etc.)
✅ Financial reports and totals
✅ Analytics and insights
✅ Receipts page (unless explicitly included)

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

The "Clean Test Data" button removes:
- All payments by test accounts
- All service bookings by test accounts
- All event registrations by test accounts
- All requests by test accounts

**Member records remain intact** so you can continue testing without re-registering.

---

## Testing Scenarios

### 1. Staff Workflows (use test.manager@example.com)
- Record payments for members
- Approve/reject service bookings
- Manage member records
- Create bookings on behalf of members

### 2. Member Experience - Lifetime (use test.lifetime@example.com)
- Book services (get member pricing)
- Register for events
- Make donations
- View membership pass/QR code

### 3. Member Experience - Annual (use test.annual@example.com)
- Same as Lifetime but with Annual pricing
- Test membership renewal flow

### 4. Community Member (use test.community@example.com)
- Book services (get community pricing - higher rates)
- Register for events
- No membership pass (not a paid member)

### 5. Pricing Verification
Compare service booking prices between:
- test.lifetime@example.com (member rates)
- test.community@example.com (community rates)
- Temple vs External location pricing

### 6. Approval Workflow
1. Login as test.annual@example.com
2. Create a service booking
3. Logout and login as test.manager@example.com
4. Go to `/admin/bookings`
5. Review and approve the booking
6. Logout and login as test.annual@example.com
7. Pay for the approved booking

---

## Best Practices

### DO:
✅ Use test accounts for all development and testing
✅ Clean test data regularly to start fresh
✅ Test pricing differences between member types
✅ Verify workflows from start to finish
✅ Use test accounts for demo/training purposes

### DON'T:
❌ Mix real and test data in production testing
❌ Use test accounts for real transactions
❌ Forget to clean test data before important reports
❌ Delete test account member records (just clean their data)
❌ Share test account passwords in production

---

## Troubleshooting

### Test Account Shows "Not Registered"
**Solution:** The account exists in the database but needs to be registered in Supabase Auth.
Use the "Reset Password" button or register at `/register`.

### Test Data Appearing in Reports
**Solution:**
1. Verify the migration ran successfully
2. Check that `is_test_account = true` for the member
3. Ensure report queries filter `is_test_account = false`

### Can't Login to Test Account
**Solution:**
1. Use the "Reset Password" button on `/admin/test-accounts`
2. Check your email for the reset link
3. Set a new password

### Need More Test Accounts
**Solution:**
1. Create new member records with membership numbers in 9999xxxx range
2. Set `is_test_account = true`
3. Register them normally

---

## Accessing Features

### Admin Features
- **Test Accounts Management:** `/admin/test-accounts`
- **Import History:** `/admin/members/import-history`
- **CSV Import:** `/admin/members/import`
- **Settings:** `/admin/settings`
- **Receipts:** `/admin/receipts`

### Member Features (login as test member)
- **Dashboard:** `/member`
- **Book Services:** `/member/bookings/new`
- **My Bookings:** `/member/bookings`
- **Donate:** `/member/donate`
- **Membership Pass:** `/member/pass`

---

## Data Cleanup

### Clean Test Data Only
1. Go to `/admin/test-accounts`
2. Click "Clean Test Data"
3. Confirm the action
4. All test transactions are deleted
5. Member records remain for future testing

### Full Reset (if needed)
If you need to completely remove test accounts:
```sql
DELETE FROM members WHERE is_test_account = true;
```
Then re-run the migration to recreate them.

---

## Security Notes

- Test account emails use @example.com domain (not real)
- Use strong passwords even for test accounts in production
- Consider using a separate Supabase project for testing if needed
- Test accounts can be disabled by setting `is_active = false`

---

## Support

If you encounter issues with test accounts:
1. Check the `/admin/test-accounts` page for status
2. Verify the migration ran successfully
3. Check Supabase logs for authentication issues
4. Use the database directly to verify `is_test_account` flags

---

## Quick Reference Card

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
