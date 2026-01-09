# HSNEF Member Portal - Testing Guide by Role

This document provides testing instructions for each user role in the HSNEF Member Portal.

---

## Table of Contents

1. [Test Accounts Setup](#test-accounts-setup)
2. [Public User Testing](#public-user-testing)
3. [Member Testing](#member-testing)
4. [Office Staff Testing](#office-staff-testing)
5. [Office Manager Testing](#office-manager-testing)
6. [Admin Testing](#admin-testing)

---

## Test Accounts Setup

Before testing, ensure test accounts are created for each role:

| Role | Suggested Email | MembershipID Format |
|------|-----------------|---------------------|
| Member | member.test@example.com | 20000100 (Annual) |
| Office Staff | staff.test@example.com | 20000200 |
| Office Manager | manager.test@example.com | 10000100 (Lifetime) |
| Admin | admin.test@example.com | 10000200 (Lifetime) |

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

**Login Required:** Use member test account

### Test Case 7: View Dashboard
1. Login as member
2. **Expected:** Dashboard displays with:
   - Membership status banner (level and expiry)
   - Digital membership pass with QR code
   - Quick action buttons

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

### Test Case 13: Renew Membership
1. Navigate to Member > Renew
2. Select new membership level
3. Enter payment details (use Stripe test card: 4242 4242 4242 4242)
4. Submit payment
5. **Expected:** Payment processed, membership updated

### Test Case 14: Accept Terms Update
1. (Requires admin to update terms version first)
2. Login as member
3. **Expected:** Terms acceptance modal appears
4. Read and click "Accept Terms"
5. **Expected:** Modal closes, access granted

---

## Office Staff Testing

**Login Required:** Use staff test account

### Test Case 15: Access Admin Panel
1. Login as staff
2. Navigate to /admin
3. **Expected:** Admin dashboard displays with staff-level menu

### Test Case 16: View All Members
1. Navigate to Admin > Members
2. **Expected:** Member list displays with search/filter options
3. Click on a member name
4. **Expected:** Member detail page opens

### Test Case 17: View Pending Applications
1. Navigate to Admin > Applications (Pending Registrations)
2. **Expected:** List of pending membership applications
3. Filter by status (Pending, Contacted, Approved, Rejected)
4. **Expected:** List filters appropriately

### Test Case 18: Record Manual Payment
1. Navigate to Admin > Payments > New
2. Select member
3. Enter payment details:
   - Amount
   - Payment method (Cash, Check, Zelle)
   - Category
   - Notes
4. Submit
5. **Expected:** Payment recorded, receipt generated

### Test Case 19: Create Event
1. Navigate to Admin > Events > New
2. Fill in event details:
   - Name, Description, Date/Time
   - Location, Capacity
   - Member pricing
3. Publish event
4. **Expected:** Event created and visible to members

### Test Case 20: Scan Member QR Code
1. Navigate to Admin > Scan QR
2. Allow camera access
3. Scan a member's QR code
4. **Expected:** Member info displays with verification status

---

## Office Manager Testing

**Login Required:** Use manager test account

### Test Case 21: Approve Membership Application
1. Navigate to Admin > Applications
2. Click on a pending application
3. Review application details
4. Click "Approve"
5. Enter/confirm MembershipID
6. Click "Confirm Approval"
7. **Expected:** 
   - Status changes to Approved
   - MembershipID assigned
   - Welcome email sent

### Test Case 22: Reject Application
1. Navigate to Admin > Applications
2. Click on a pending application
3. Click "Reject"
4. Enter rejection reason
5. Confirm rejection
6. **Expected:** Status changes to Rejected

### Test Case 23: Edit Payment (Within 90 Days)
1. Navigate to Admin > Payments
2. Find a payment less than 90 days old
3. Click "Edit"
4. Modify details
5. Save changes
6. **Expected:** Payment updated, audit log entry created

### Test Case 24: View Audit Logs
1. Navigate to a member's profile
2. Click "View Audit Log"
3. **Expected:** List of changes to member record displays

### Test Case 25: Manage Services
1. Navigate to Admin > Services
2. Click "Add Service"
3. Fill in service details (name, description, pricing)
4. Save
5. **Expected:** Service created and available for booking

### Test Case 26: Manage Purohits (Priests)
1. Navigate to Admin > Purohits
2. Click "Add Purohit"
3. Fill in details
4. Save
5. **Expected:** Purohit added to system

### Test Case 27: Configure Portal Settings
1. Navigate to Admin > Portal Settings
2. Toggle "Enable Traditional Login"
3. **Expected:** Setting saved, login page updates accordingly

---

## Admin Testing

**Login Required:** Use admin test account

### Test Case 28: Full Admin Panel Access
1. Login as admin
2. Navigate to /admin
3. **Expected:** Full admin menu displays including:
   - Dashboard, Members, Applications
   - Payments, Receipts, Requests
   - Events, Bookings, Services
   - Purohits, Portal Settings, Settings

### Test Case 29: Configure Membership Pricing
1. Navigate to Admin > Portal Settings
2. Scroll to "Membership Pricing" section
3. Update prices for Community, Annual, Lifetime
4. Save changes
5. **Expected:** Prices update on /join page

### Test Case 30: Assign User Roles
1. Navigate to Admin > Members
2. Select a member
3. Edit member profile
4. Assign role (Office Staff, Office Manager, or Admin)
5. Save
6. **Expected:** User has new role on next login

### Test Case 31: Import Members (Bulk)
1. Navigate to Admin > Settings > Import Members
2. Upload CSV file matching template format
3. Review import preview
4. Confirm import
5. **Expected:** Members created with auto-generated MembershipIDs

### Test Case 32: View Import History
1. Navigate to Admin > Settings > Import History
2. **Expected:** List of past imports with status and counts

### Test Case 33: Manage Test Accounts
1. Navigate to Admin > Settings > Test Accounts
2. View/create/delete test accounts
3. **Expected:** Test accounts managed without affecting production data

### Test Case 34: View System Information
1. Navigate to Admin > Settings
2. **Expected:** System info displays:
   - Version number
   - Environment (Development/Production)
   - Database connection status

### Test Case 35: Update Terms of Use
1. Navigate to Admin > Portal Settings
2. Create new terms version with updated content
3. Set as active version
4. **Expected:** All users prompted to accept new terms on next login

### Test Case 36: Review Terms Bypasses
1. (After a user triggers escape hatch)
2. Check database or admin panel for bypass records
3. **Expected:** Bypass entry shows user, error, and timestamp
4. Mark bypass as resolved after contacting user

---

## Common Test Scenarios

### Scenario A: New Member Journey
1. Guest visits /join
2. Fills application form
3. Office reviews and approves
4. Member receives welcome email
5. Member logs in and views dashboard
6. Member prints membership pass

### Scenario B: Event Registration Flow
1. Admin creates event
2. Member logs in
3. Member browses events
4. Member registers for event
5. Staff views registration list
6. Member cancels registration

### Scenario C: Service Booking Flow
1. Member creates booking request
2. Staff reviews booking
3. Manager approves booking
4. Member makes payment
5. Service completed
6. Booking marked complete

### Scenario D: Payment Processing
1. Member initiates online payment (Stripe)
2. Payment succeeds
3. Receipt generated
4. Payment appears in history
5. Member downloads receipt

---

## Test Data Notes

### Stripe Test Cards
- Success: 4242 4242 4242 4242
- Declined: 4000 0000 0000 0002
- Requires Auth: 4000 0025 0000 3155

### Date Format
- All dates: YYYY-MM-DD or MM/DD/YYYY depending on field

### MembershipID Rules
- Lifetime: Starts with 1 (e.g., 10000100)
- Annual: Starts with 2 (e.g., 20000100)
- Community: Starts with 3 (e.g., 30000100)
- Always ends with 00

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
