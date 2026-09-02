# Test Accounts Guide

## Overview

Test accounts allow you to test all functionality without affecting real member data, metrics, or accounting. They are automatically filtered from reports and clearly marked in the UI.

---

## Initial Setup (Required First)

Before testers can begin, a real Admin must set up the test admin account.

### Step 1: Register the Test Admin Account
1. Navigate to `https://dev.member.hsnef.org/register`
2. Register using email: `dev-mp+testadmin@hsnef.org`
3. Create a password (e.g., "TestPassword123!")

### Step 2: Real Admin Assigns Test Admin Role
1. Login with your **real Admin account** (not the test account)
2. Go to **Settings → Staff Role Management** (`/admin/settings/staff-roles`)
3. Search for "testadmin"
4. Assign the **Admin** role

### Step 3: Test Admin Assigns Other Roles
Once the Test Admin has the Admin role, they can assign roles to other registered test accounts via the UI.

**Once this setup is complete, testers can use the test admin account to test all admin functionality without creating permanent data.**

---

## Test Accounts Created

After running the migration, these test accounts will be available:

| Email | Membership ID | Role | Level | Purpose |
|-------|---------------|------|-------|---------|
| dev-mp+testadmin@hsnef.org | 99990000 | Admin | Lifetime | Full system testing |
| dev-mp+testmanager@hsnef.org | 99991000 | Office Manager | Lifetime | Manager functions |
| dev-mp+teststaff@hsnef.org | 99992000 | Office Staff | Lifetime | Staff functions |
| dev-mp+testlifetime@hsnef.org | 99993000 | Member | Lifetime | Lifetime member pricing |
| dev-mp+testannual@hsnef.org | 99994000 | Member | Annual | Annual member pricing |
| dev-mp+testcommunity@hsnef.org | 99995000 | Member | Community | Non-paid member pricing |

**Recommended Password:** `TestPassword123!`

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

### Three-Tier Access Model

**🔒 Regular Members (Production Users):**
- NEVER see test-created data (events, bookings, etc.)
- Events page shows ONLY production events
- Complete protection from test data pollution
- Clean, production-only experience

**🧪 Test Users (Test Accounts):**
- See ONLY test-created events (isolated sandbox)
- Cannot see production events
- Perfect isolation for safe testing
- Full workflow testing without affecting production

**⚙️ Staff (Admin/Manager/Office Staff):**
- Default: See production data only (test data hidden)
- Toggle ON: See both production AND test data (marked with 🧪 badges)
- Can switch between views for debugging
- Full control over data visibility

### Staff Test Data Toggle

Look for the **purple toggle in the admin header** (top right):
- **Toggle OFF (Default):** Production data only, test data hidden
- **Toggle ON (Debug):** Shows test data with 🧪 TEST badges
- Persists across sessions (localStorage)
- Only visible to Admin/Manager/Staff roles

**Toggle States:**
```
🧪 SHOWING  (Toggle ON - purple background)
🧪 HIDDEN   (Toggle OFF - gray background)
```

### Automatic Filtering

Test accounts are **automatically excluded** from:

✅ Dashboard metrics (total members, active members, etc.)
✅ Financial reports and totals
✅ Analytics and insights
✅ Events lists (when staff toggle is OFF)
✅ Bookings lists (when staff toggle is OFF)
✅ Payments lists (when staff toggle is OFF)

Test accounts **ARE visible** in:
- Admin member lists (for management)
- Search results (clearly marked with "TEST" badge)
- Events/Bookings/Payments (when staff toggle is ON, marked with 🧪)
- Test Accounts management page

### Visual Indicators

Test accounts and test data are marked with a **purple 🧪 TEST badge** throughout the UI:
- Member lists (always visible)
- Search results (always visible)
- Events (when toggle is ON)
- Bookings (when toggle is ON)
- Payments (when toggle is ON)

### Clean Test Data

The "Clean Test Data" button removes:
- All payments by test accounts
- All service bookings by test accounts
- All event registrations by test accounts
- All requests by test accounts

**Member records remain intact** so you can continue testing without re-registering.

---

## Testing Scenarios

### 1. Staff Workflows (use dev-mp+testmanager@hsnef.org)
- Record payments for members
- Approve/reject service bookings
- Manage member records
- Create bookings on behalf of members
- **Toggle test data** to see test events/bookings/payments with 🧪 badges

### 2. Member Experience - Lifetime (use dev-mp+testlifetime@hsnef.org)
- Book services (get member pricing)
- Register for events
- Make donations
- View membership pass/QR code
- **Verify isolation:** Should ONLY see test-created events

### 3. Member Experience - Annual (use dev-mp+testannual@hsnef.org)
- Same as Lifetime but with Annual pricing
- Test membership renewal flow
- **Verify isolation:** Should NOT see production events

### 4. Community Member (use dev-mp+testcommunity@hsnef.org)
- Book services (get community pricing - higher rates)
- Register for events
- No membership pass (not a paid member)
- **Verify isolation:** Should ONLY see test-created events

### 5. Pricing Verification
Compare service booking prices between:
- dev-mp+testlifetime@hsnef.org (member rates)
- dev-mp+testcommunity@hsnef.org (community rates)
- Temple vs External location pricing

### 6. Approval Workflow
1. Login as dev-mp+testannual@hsnef.org
2. Create a service booking
3. Logout and login as dev-mp+testmanager@hsnef.org
4. Go to `/admin/bookings`
5. **Toggle test data ON** to see the test booking with 🧪 badge
6. Review and approve the booking
7. Logout and login as dev-mp+testannual@hsnef.org
8. Pay for the approved booking

### 7. Test Data Isolation Testing
1. Login as dev-mp+testmanager@hsnef.org (staff)
2. Create an event (it will be marked as test-created)
3. Logout and login as regular production member
4. **Verify:** Production member should NOT see the test event
5. Logout and login as dev-mp+testlifetime@hsnef.org
6. **Verify:** Test user SHOULD see ONLY the test event
7. Logout and login as dev-mp+testmanager@hsnef.org
8. **Verify:** With toggle OFF, test event is hidden
9. **Verify:** With toggle ON, test event shows with 🧪 badge

### 8. Staff Toggle Testing
1. Login as dev-mp+testmanager@hsnef.org or dev-mp+teststaff@hsnef.org
2. Look for purple toggle in admin header (top right)
3. Click toggle to turn ON → Should see 🧪 SHOWING
4. Go to Events/Bookings/Payments pages
5. **Verify:** Test items show with 🧪 TEST badges
6. Click toggle to turn OFF → Should see 🧪 HIDDEN
7. **Verify:** Test items are now hidden
8. Refresh page → **Verify:** Toggle state persists

---

## Best Practices

### DO:
✅ Use test accounts for all development and testing
✅ Keep staff toggle OFF during normal operations
✅ Toggle ON only when debugging or verifying test data
✅ Clean test data regularly to start fresh
✅ Test pricing differences between member types
✅ Verify workflows from start to finish (including isolation)
✅ Use test accounts for demo/training purposes
✅ Verify test user isolation (they should ONLY see test events)
✅ Verify production members NEVER see test events
✅ Check that toggle state persists across sessions

### DON'T:
❌ Mix real and test data in production testing
❌ Use test accounts for real transactions
❌ Leave staff toggle ON during production operations
❌ Forget to clean test data before important reports
❌ Delete test account member records (just clean their data)
❌ Share test account passwords in production
❌ Ignore 🧪 badges (they indicate test data)
❌ Test with production accounts when test accounts are available

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

### Staff Toggle Not Visible
**Solution:**
1. Verify you're logged in as Admin, Office Manager, or Office Staff
2. Check that you're on an admin page (not member portal)
3. Look in the top right of the admin header (next to user menu)
4. Toggle only appears for authorized staff roles

### Test User Seeing Production Events
**Solution:**
1. Verify the member has `is_test_account = true` in database
2. Check that member is properly authenticated
3. Verify test isolation logic in member events page
4. Check browser console for errors

### Production Member Seeing Test Events
**Solution:**
1. **CRITICAL:** This should NEVER happen - report immediately
2. Verify member has `is_test_account = false` in database
3. Check test filtering logic in member events page
4. Verify test data filtering is working correctly

### Toggle Not Persisting
**Solution:**
1. Check browser localStorage is enabled
2. Look for `hsnef_show_test_data` key in localStorage
3. Try clearing localStorage and setting toggle again
4. Check browser console for errors

### Test Badges Not Showing
**Solution:**
1. Verify staff toggle is ON (🧪 SHOWING)
2. Check that test items have proper flags (`is_test_event`, `is_test_booking`, etc.)
3. Verify you're viewing Events/Bookings/Payments pages (not dashboard)
4. Refresh the page after toggling

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
╔═══════════════════════════════════════════════════════════════╗
║                TEST ACCOUNTS QUICK REFERENCE                   ║
╠═══════════════════════════════════════════════════════════════╣
║ Admin:       dev-mp+testadmin@hsnef.org       (99990000)      ║
║ Manager:     dev-mp+testmanager@hsnef.org     (99991000)      ║
║ Staff:       dev-mp+teststaff@hsnef.org       (99992000)      ║
║ Lifetime:    dev-mp+testlifetime@hsnef.org    (99993000)      ║
║ Annual:      dev-mp+testannual@hsnef.org      (99994000)      ║
║ Community:   dev-mp+testcommunity@hsnef.org   (99995000)      ║
╠═══════════════════════════════════════════════════════════════╣
║ Password:    TestPassword123!                                 ║
║ Management:  /admin/test-accounts                             ║
║ Staff Roles: /admin/settings/staff-roles                      ║
║ Clean Data:  Click "Clean Test Data" button                   ║
╠═══════════════════════════════════════════════════════════════╣
║ STAFF TOGGLE (Admin Header - Top Right):                      ║
║   🧪 HIDDEN  = Production data only (DEFAULT)                 ║
║   🧪 SHOWING = Test data visible with badges                  ║
║                                                               ║
║ TEST USER ISOLATION:                                          ║
║   • Test users see ONLY test events                           ║
║   • Regular members see ONLY production events                ║
║   • No cross-contamination                                    ║
╚═══════════════════════════════════════════════════════════════╝
```
