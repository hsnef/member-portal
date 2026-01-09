# HSNEF Member Portal - Testing Guide by Role

This document provides testing instructions for each user role in the HSNEF Member Portal.

---

## Table of Contents

1. [Test Accounts Setup](#test-accounts-setup)
2. [Public User Testing](#public-user-testing)
3. [Member Testing](#member-testing)
4. [Office Staff Testing](#office-staff-testing)
5. [Office Manager Testing](#office-manager-testing)

---

## Test Accounts Setup

The portal includes pre-configured test accounts that are automatically excluded from reports and metrics. Test accounts use MembershipID prefix `9` (99991000-99995000) and are marked with a purple "TEST" badge in the UI.

### Available Test Accounts

| Role | Email | MembershipID | Level |
|------|-------|--------------|-------|
| Office Manager | test.manager@example.com | 99991000 | Lifetime |
| Office Staff | test.staff@example.com | 99992000 | Lifetime |
| Member (Lifetime) | test.lifetime@example.com | 99993000 | Lifetime |
| Member (Annual) | test.annual@example.com | 99994000 | Annual |
| Member (Community) | test.community@example.com | 99995000 | Community |

### Registering Test Accounts

Test accounts exist in the database but need to be registered in Supabase Auth:

1. Navigate to `/register`
2. Enter the test account email (e.g., test.lifetime@example.com)
3. Create a password (e.g., "TestPassword123!")
4. The system links the auth account to the existing member record

### Test Account Features

- **Automatic Filtering:** Excluded from dashboard metrics, financial reports, and analytics
- **Visual Indicator:** Purple "TEST" badge appears next to test accounts
- **Clean Test Data:** Use `/admin/test-accounts` to reset all test transactions
- **Member records persist** when cleaning data (no need to re-register)

### Test Account Management Page

Navigate to: `/admin/test-accounts`

This page shows:
- All test accounts and registration status
- Password reset functionality
- "Clean Test Data" button
- Usage instructions

---

## Public User Testing

**URL:** https://portal.hsnef.org (or localhost:3000)

### Test Case 1: View Home Page
1. Navigate to the home page
2. **Expected:** Landing page displays with temple information and login options

### Test Case 2: Login with Google OAuth
1. Click "Sign in with Google"
2. Select/enter Google account
3. Authorize the application
4. **Expected:** Redirect to member dashboard (if member exists) or limited access page

### Test Case 3: Login with Magic Link
1. Enter email address
2. Click "Send Magic Link"
3. Check email inbox for link
4. Click the magic link
5. **Expected:** Logged in and redirected to appropriate dashboard

### Test Case 4: Submit Membership Application
1. Navigate to /join
2. Select membership type (Personal or Business)
3. Select membership level (Community, Annual, or Lifetime)
4. Fill in all required fields:
   - Personal: First Name, Last Name, Email, Phone, Address
   - Business: Business Name, Contact Person, Email, Phone
5. Check "I accept the Terms of Use"
6. Click "Submit Application"
7. **Expected:** 
   - If approval required: Success message, status = Pending
   - If auto-approve: Success message, MembershipID assigned

### Test Case 5: View Terms of Use
1. Navigate to /terms
2. **Expected:** Terms content displays with version number and effective date
3. Click "Print" button
4. **Expected:** Print dialog opens

### Test Case 6: Verify QR Code
1. Navigate to /verify-qr?token=[valid-token]
2. **Expected:** Member verification info displays

---

## Member Testing

**Login Required:** Use test.lifetime@example.com, test.annual@example.com, or test.community@example.com

### Test Case 7: View Dashboard
1. Login as test.lifetime@example.com
2. **Expected:** Dashboard displays with:
   - Membership status banner (level and expiry)
   - Digital membership pass with QR code
   - Quick action buttons
   - Purple "TEST" badge visible

### Test Case 8: View/Print Membership Pass
1. From dashboard, locate the membership pass
2. Click "Print Pass" button
3. **Expected:** Print dialog opens with formatted pass
4. Click "Download QR" button
5. **Expected:** QR code PNG downloads

### Test Case 9: View Payment History
1. Click "Payment History" in dashboard
2. **Expected:** List of past payments with:
   - Payment date, amount, method
   - Category badges
   - Year filter dropdown
3. Click "Download Receipt" on a payment
4. **Expected:** PDF receipt downloads

### Test Case 10: Register for Event
1. Navigate to Member > Events
2. Browse available events
3. Click "Register" on an open event
4. **Expected:** Registration confirmed, button changes to "Cancel Registration"
5. Click "Cancel Registration"
6. **Expected:** Registration removed

### Test Case 11: Create Service Booking
1. Navigate to Member > Bookings
2. Click "New Booking"
3. Select service type
4. Fill in details and preferred dates
5. Submit booking
6. **Expected:** Booking created with status "Pending Approval"

### Test Case 12: View Booking Status
1. Navigate to Member > Bookings
2. View booking list with status filters
3. **Expected:** Bookings display with appropriate status badges

### Test Case 13: Renew Membership (Annual Member)
1. Login as test.annual@example.com
2. Navigate to Member > Renew
3. Select new membership level
4. Enter payment details (use Stripe test card: 4242 4242 4242 4242)
5. Submit payment
6. **Expected:** Payment processed, membership updated

### Test Case 14: Accept Terms Update
1. (Requires manager to update terms version first)
2. Login as member
3. **Expected:** Terms acceptance modal appears
4. Read and click "Accept Terms"
5. **Expected:** Modal closes, access granted

### Test Case 15: Pricing Verification
1. Login as test.lifetime@example.com, create a service booking, note the price
2. Logout, login as test.community@example.com
3. Create the same service booking, note the price
4. **Expected:** Community member sees higher (non-member) pricing

---

## Office Staff Testing

**Login Required:** Use test.staff@example.com

### Test Case 16: Access Admin Panel
1. Login as test.staff@example.com
2. Navigate to /admin
3. **Expected:** Admin dashboard displays with staff-level menu

### Test Case 17: View All Members
1. Navigate to Admin > Members
2. **Expected:** Member list displays with search/filter options
3. Test accounts show purple "TEST" badge
4. Click on a member name
5. **Expected:** Member detail page opens

### Test Case 18: View Pending Applications
1. Navigate to Admin > Applications (Pending Registrations)
2. **Expected:** List of pending membership applications
3. Filter by status (Pending, Contacted, Approved, Rejected)
4. **Expected:** List filters appropriately

### Test Case 19: Record Manual Payment
1. Navigate to Admin > Payments > New
2. Select a test member (e.g., test.annual@example.com)
3. Enter payment details:
   - Amount: $100
   - Payment method: Cash
   - Category: Donation
   - Notes: "Test donation"
4. Submit
5. **Expected:** Payment recorded, receipt generated

### Test Case 20: Create Event
1. Navigate to Admin > Events > New
2. Fill in event details:
   - Name, Description, Date/Time
   - Location, Capacity
   - Member pricing
3. Publish event
4. **Expected:** Event created and visible to members

### Test Case 21: Scan Member QR Code
1. Navigate to Admin > Scan QR
2. Allow camera access
3. Scan a test member's QR code (e.g., from test.lifetime@example.com)
4. **Expected:** Member info displays with verification status and "TEST" badge

---

## Office Manager Testing

**Login Required:** Use test.manager@example.com

### Test Case 22: Approve Membership Application
1. Navigate to Admin > Applications
2. Click on a pending application
3. Review application details
4. Click "Approve"
5. Enter/confirm MembershipID (system auto-generates)
6. Click "Confirm Approval"
7. **Expected:** 
   - Status changes to Approved
   - MembershipID assigned (format: [1|2|3]XXXXX00)
   - Welcome email sent

### Test Case 23: Reject Application
1. Navigate to Admin > Applications
2. Click on a pending application
3. Click "Reject"
4. Enter rejection reason
5. Confirm rejection
6. **Expected:** Status changes to Rejected

### Test Case 24: Edit Payment (Within 90 Days)
1. Navigate to Admin > Payments
2. Find a payment less than 90 days old
3. Click "Edit"
4. Modify details
5. Save changes
6. **Expected:** Payment updated, audit log entry created

### Test Case 25: View Audit Logs
1. Navigate to a member's profile
2. Click "View Audit Log"
3. **Expected:** List of changes to member record displays

### Test Case 26: Manage Services
1. Navigate to Admin > Services
2. Click "Add Service"
3. Fill in service details (name, description, pricing)
4. Save
5. **Expected:** Service created and available for booking

### Test Case 27: Manage Purohits (Priests)
1. Navigate to Admin > Purohits
2. Click "Add Purohit"
3. Fill in details
4. Save
5. **Expected:** Purohit added to system

### Test Case 28: Configure Portal Settings
1. Navigate to Admin > Portal Settings
2. Toggle "Enable Traditional Login"
3. **Expected:** Setting saved, login page updates accordingly

### Test Case 29: Configure Membership Pricing
1. Navigate to Admin > Portal Settings
2. Scroll to "Membership Pricing" section
3. Update prices for Community, Annual, Lifetime
4. Save changes
5. **Expected:** Prices update on /join page

### Test Case 30: Manage Test Accounts
1. Navigate to Admin > Test Accounts (or Admin > Settings > Test Accounts)
2. View all test accounts and their registration status
3. Click "Clean Test Data"
4. **Expected:** All test transactions removed, member records remain

### Test Case 31: View Import History
1. Navigate to Admin > Settings > Import History
2. **Expected:** List of past imports with status and counts

### Test Case 32: Import Members (Bulk)
1. Navigate to Admin > Settings > Import Members
2. Download CSV template
3. Fill with test data
4. Upload CSV file
5. Review import preview
6. Confirm import
7. **Expected:** Members created with auto-generated MembershipIDs

### Test Case 33: View System Information
1. Navigate to Admin > Settings
2. **Expected:** System info displays:
   - Version number
   - Environment (Development/Production)
   - Database connection status

---

## Common Test Scenarios

### Scenario A: New Member Journey
1. Guest visits /join
2. Fills application form
3. Office reviews and approves (login as test.manager@example.com)
4. Member receives welcome email
5. Member logs in and views dashboard
6. Member prints membership pass

### Scenario B: Event Registration Flow
1. Staff creates event (login as test.staff@example.com)
2. Member logs in (test.lifetime@example.com)
3. Member browses events
4. Member registers for event
5. Staff views registration list
6. Member cancels registration

### Scenario C: Service Booking Flow
1. Member creates booking request (test.annual@example.com)
2. Staff reviews booking (test.staff@example.com)
3. Manager approves booking (test.manager@example.com)
4. Member makes payment
5. Service completed
6. Booking marked complete

### Scenario D: Payment Processing
1. Member initiates online payment (Stripe)
2. Payment succeeds
3. Receipt generated
4. Payment appears in history
5. Member downloads receipt

### Scenario E: Pricing Verification
1. Login as test.lifetime@example.com (member pricing)
2. Create service booking, note price
3. Login as test.community@example.com (community pricing)
4. Create same service booking
5. **Verify:** Community sees higher rates than member

---

## Test Data Notes

### Stripe Test Cards
- Success: 4242 4242 4242 4242
- Declined: 4000 0000 0000 0002
- Requires Auth: 4000 0025 0000 3155

### Date Format
- All dates: YYYY-MM-DD or MM/DD/YYYY depending on field

### MembershipID Rules

**Production Accounts:**
- Lifetime: Starts with 1 (e.g., 10000100)
- Annual: Starts with 2 (e.g., 20000100)
- Community: Starts with 3 (e.g., 30000100)
- Always ends with 00

**Test Accounts:**
- All start with 9 (e.g., 99991000, 99992000, etc.)
- Bypass level-prefix matching constraint
- Clearly identifiable and filterable

### Clean Test Data

Before generating reports or demos:
1. Navigate to `/admin/test-accounts`
2. Click "Clean Test Data"
3. Confirm the action
4. All test payments, bookings, registrations removed
5. Test member records remain for continued testing

---

## Quick Reference Card

```
+----------------------------------------------------------+
|               TEST ACCOUNTS QUICK REFERENCE               |
+----------------------------------------------------------+
| Manager:     test.manager@example.com    (99991000)      |
| Staff:       test.staff@example.com      (99992000)      |
| Lifetime:    test.lifetime@example.com   (99993000)      |
| Annual:      test.annual@example.com     (99994000)      |
| Community:   test.community@example.com  (99995000)      |
+----------------------------------------------------------+
| Management:  /admin/test-accounts                         |
| Clean Data:  Click "Clean Test Data" button              |
| Password:    Use "Reset Password" on management page     |
+----------------------------------------------------------+
```

---

## Reporting Issues

When reporting bugs, include:
1. User role and test account used
2. Steps to reproduce
3. Expected behavior
4. Actual behavior
5. Screenshots if applicable
6. Browser and device info

Contact: info@hsnef.org
