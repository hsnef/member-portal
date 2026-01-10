# HSNEF Member Portal - Office Staff Testing Guide

This guide is for testing the portal as an Office Staff member.

---

## Overview

As Office Staff, you have all Member features plus:
- Access to admin panel (limited)
- View all members in the system
- View pending membership applications
- Record manual payments (Cash, Check, Zelle)
- Create service bookings for members
- Create and manage events
- Scan member QR codes for verification

---

## Test Account

| Field | Value |
|-------|-------|
| Role | Office Staff |
| Email | dev-mp+teststaff@hsnef.org |
| MembershipID | 99992000 |
| Membership Level | Lifetime |

**Recommended Password:** `TestPassword123!`

### First-Time Setup

If not yet registered:
1. Navigate to `/register`
2. Enter: dev-mp+teststaff@hsnef.org
3. Create password (e.g., "TestPassword123!")
4. System links auth to existing member record

### After Registration - Assign Role

The Office Staff role must be assigned by the Test Admin:
1. Test Admin logs in as `dev-mp+testadmin@hsnef.org`
2. Navigates to **Settings → Staff Role Management** (`/admin/settings/staff-roles`)
3. Searches for "teststaff"
4. Assigns the **Office Staff** role

---

## Other Test Accounts for Staff Testing

| Account | Email | MembershipID | Purpose |
|---------|-------|--------------|---------|
| Admin | dev-mp+testadmin@hsnef.org | 99990000 | Full admin access |
| Manager | dev-mp+testmanager@hsnef.org | 99991000 | For approval workflows |
| Lifetime Member | dev-mp+testlifetime@hsnef.org | 99993000 | Test member interactions |
| Annual Member | dev-mp+testannual@hsnef.org | 99994000 | Test renewals, payments |
| Community Member | dev-mp+testcommunity@hsnef.org | 99995000 | Test non-member pricing |

All test accounts have purple "TEST" badge and are excluded from reports.

---

## Accessing Admin Panel

**Steps:**
1. Login with dev-mp+teststaff@hsnef.org
2. From your member dashboard, click "Admin Portal" or navigate to /admin

**Expected Results:**
- Admin dashboard loads
- Left sidebar shows available menu items
- Staff-level features accessible
- Manager/Admin-only features hidden or disabled

---

## Test Cases

### TC-STF-01: View Admin Dashboard

**Steps:**
1. Navigate to /admin
2. Review the dashboard

**Expected Results:**
- Dashboard displays summary statistics:
  - Total members (excludes test accounts)
  - Pending applications
  - Recent payments
  - Upcoming events
- Quick action buttons available
- Purple "TEST" badge on your account indicator

---

### TC-STF-02: Browse All Members

**Steps:**
1. Navigate to Admin > Members
2. Browse the member list

**Expected Results:**
- All members displayed in table format
- Test accounts show purple "TEST" badge
- Columns include: Name, MembershipID, Level, Status, Email
- Pagination works if many members
- Sort by columns works

---

### TC-STF-03: Search Members

**Steps:**
1. On Members page, use the search box
2. Search by name (e.g., "Test Lifetime")
3. Search by MembershipID (e.g., "99993000")
4. Search by email (e.g., "dev-mp+testlifetime@hsnef.org")

**Expected Results:**
- Search returns matching members
- Test accounts show "TEST" badge in results
- Search is case-insensitive
- Partial matches work
- Clear search shows all members

---

### TC-STF-04: Filter Members

**Steps:**
1. On Members page, use filter options
2. Filter by membership level (Lifetime, Annual, Community)
3. Filter by membership class (Personal, Business)
4. Filter by status (Active, Expired)

**Expected Results:**
- Filters apply correctly
- Multiple filters can combine
- Clear filters shows all members
- Count updates to show filtered results

---

### TC-STF-05: View Member Details

**Steps:**
1. Click on dev-mp+testlifetime@hsnef.org from the list
2. Review the member detail page

**Expected Results:**
- Full member information displayed:
  - Personal/Business details
  - Contact information
  - Membership information (99993000, Lifetime)
  - Family members (if applicable)
  - Payment history summary
  - Event registrations
- Purple "TEST" badge visible
- Cannot edit member details (staff restriction)

---

### TC-STF-06: View Pending Applications

**Steps:**
1. Navigate to Admin > Applications (Pending Registrations)
2. Review the list of pending applications

**Expected Results:**
- List of submitted applications displayed
- Each shows: Name, Email, Type, Level, Date submitted
- Status badges (Pending, Contacted, Approved, Rejected)
- Filter by status works

---

### TC-STF-07: View Application Details

**Steps:**
1. On Applications page, click on an application
2. Review the application details

**Expected Results:**
- Full application information shown:
  - All submitted form data
  - Contact information
  - Requested membership type/level
  - Submission date
  - Current status
- For Staff: Can view but cannot approve/reject

---

### TC-STF-08: Mark Application as Contacted

**Steps:**
1. Find a pending application
2. Click "Mark as Contacted" or similar button
3. Optionally add notes

**Expected Results:**
- Status changes to "Contacted"
- Contact date/time recorded
- Notes saved if provided

---

### TC-STF-09: Record Cash Payment

**Steps:**
1. Navigate to Admin > Payments > New (or Record Payment)
2. Search and select dev-mp+testannual@hsnef.org
3. Fill in payment details:
   - Amount: $251.00
   - Payment Method: Cash
   - Category: Membership
   - Notes: "2026 Annual Membership - TEST"
4. Click "Record Payment"

**Expected Results:**
- Payment recorded successfully
- Receipt generated
- Payment appears in member's history
- Confirmation message displayed
- Payment marked as test data (excluded from reports)

---

### TC-STF-10: Record Check Payment

**Steps:**
1. Navigate to Admin > Payments > New
2. Select dev-mp+testlifetime@hsnef.org
3. Fill in:
   - Amount: $100.00
   - Payment Method: Check
   - Check Number: 1234
   - Category: Donation
   - Notes: "Temple renovation fund - TEST"
4. Click "Record Payment"

**Expected Results:**
- Payment recorded with check number
- Check number appears in payment record
- Receipt generated

---

### TC-STF-11: Record Zelle Payment

**Steps:**
1. Navigate to Admin > Payments > New
2. Select dev-mp+testannual@hsnef.org
3. Fill in:
   - Amount: $50.00
   - Payment Method: Zelle
   - Transaction ID: ABC123XYZ
   - Category: Event
   - Notes: "Diwali celebration registration - TEST"
4. Click "Record Payment"

**Expected Results:**
- Payment recorded with transaction ID
- Transaction ID appears in payment record
- Receipt generated

---

### TC-STF-12: View Payment List

**Steps:**
1. Navigate to Admin > Payments
2. Browse the payment list

**Expected Results:**
- Recent payments displayed
- Test account payments may be filtered or marked
- Columns: Date, Member, Amount, Method, Category, Status
- Can filter by date range
- Can filter by payment method
- Can filter by category

---

### TC-STF-13: Create New Event

**Steps:**
1. Navigate to Admin > Events
2. Click "New Event"
3. Fill in event details:
   - Event Name: "Test Festival Event"
   - Description: "Description of the event"
   - Date: [Future date]
   - Start Time: 10:00 AM
   - End Time: 2:00 PM
   - Location: "Temple Main Hall"
   - Category: Festival
   - Member Price: $25.00
   - Non-Member Price: $35.00
   - Capacity: 100
   - Registration Deadline: [Day before event]
4. Upload event image (optional)
5. Click "Create Event"

**Expected Results:**
- Event created successfully
- Event appears in event list
- Status: Draft (not yet published)

---

### TC-STF-14: Publish Event

**Steps:**
1. Navigate to Admin > Events
2. Find the draft event
3. Click "Publish" or toggle publish status

**Expected Results:**
- Event status changes to Published
- Event now visible to members on /member/events
- Members can register

---

### TC-STF-15: Edit Event

**Steps:**
1. Navigate to Admin > Events
2. Click on an event
3. Click "Edit"
4. Change the capacity from 100 to 150
5. Save changes

**Expected Results:**
- Event updated successfully
- New capacity reflected
- Existing registrations unaffected

---

### TC-STF-16: View Event Registrations

**Steps:**
1. Navigate to Admin > Events
2. Click on an event
3. Click "View Registrations"

**Expected Results:**
- List of registered members displayed
- Test account registrations show "TEST" badge
- Shows: Member name, MembershipID, Registration date
- Total count matches event display
- Can export list (if available)

---

### TC-STF-17: Create Booking for Member

**Steps:**
1. Navigate to Admin > Bookings
2. Click "New Booking"
3. Search and select dev-mp+testannual@hsnef.org
4. Select service type
5. Fill in booking details:
   - Preferred date
   - Time
   - Special requests
6. Submit booking

**Expected Results:**
- Booking created on behalf of member
- Status: Pending Approval
- Member can see booking in their portal
- Staff recorded as creator

---

### TC-STF-18: View All Bookings

**Steps:**
1. Navigate to Admin > Bookings
2. Browse the booking list

**Expected Results:**
- All bookings displayed
- Test account bookings show "TEST" badge
- Can filter by status
- Can filter by service type
- Can filter by date range
- Booking details accessible

---

### TC-STF-19: Scan Member QR Code

**Steps:**
1. Navigate to Admin > Scan QR
2. Allow camera access when prompted
3. Point camera at dev-mp+testlifetime@hsnef.org's QR code
4. Observe the result

**Expected Results:**
- Camera activates
- QR code scanned successfully
- Member information displayed:
  - Name: Test Lifetime Member
  - MembershipID: 99993000
  - Membership level: Lifetime
  - Status: Active
  - "TEST" badge visible
- Verification timestamp recorded

---

### TC-STF-20: Manual QR Token Entry

**Steps:**
1. On Scan QR page
2. Click "Enter Code Manually"
3. Type the token from a member's QR code
4. Click "Verify"

**Expected Results:**
- Token verified
- Same member information displayed
- Works when camera unavailable

---

### TC-STF-21: View Service List

**Steps:**
1. Navigate to Admin > Services
2. Browse available services

**Expected Results:**
- List of all services displayed
- Shows: Service name, Description, Price, Status
- Cannot add/edit services (staff restriction)

---

### TC-STF-22: View Purohit List

**Steps:**
1. Navigate to Admin > Purohits
2. Browse the list of priests

**Expected Results:**
- List of purohits displayed
- Shows: Name, Specialization, Contact
- Cannot add/edit purohits (staff restriction)

---

### TC-STF-23: Access Denied - Portal Settings

**Steps:**
1. Try to navigate to Admin > Portal Settings
2. Or try URL /admin/portal-settings

**Expected Results:**
- Access denied message
- Redirected to admin dashboard
- Or menu item not visible

---

### TC-STF-24: Access Denied - Role Management

**Steps:**
1. Try to edit a member's roles
2. Or access role management pages

**Expected Results:**
- Cannot change roles
- Feature not available to staff

---

### TC-STF-25: View Test Accounts Page

**Steps:**
1. Navigate to Admin > Test Accounts (or /admin/test-accounts)

**Expected Results:**
- List of all 5 test accounts displayed
- Registration status shown for each
- "Clean Test Data" button available
- Password reset functionality

---

## Staff Workflow Scenarios

### Scenario A: Member Walks In to Pay

1. Member (use dev-mp+testannual@hsnef.org) arrives at office
2. Staff (dev-mp+teststaff@hsnef.org) searches for member
3. Staff verifies member identity
4. Staff records cash/check payment
5. Staff provides receipt (print or email)
6. Member's status updated automatically

### Scenario B: Phone Registration Assistance

1. Caller wants to join as member
2. Staff explains membership options
3. Staff directs caller to /join
4. Or staff notes application details
5. Staff marks application status appropriately

### Scenario C: Event Day Check-In

1. Member (dev-mp+testlifetime@hsnef.org) arrives at event
2. Staff opens QR scanner
3. Member shows digital pass or printed pass
4. Staff scans QR code
5. Verification confirms member is registered
6. Member admitted to event
7. "TEST" badge appears (for test accounts)

---

## Things Staff CANNOT Do

- Approve or reject membership applications
- Edit existing payments (only record new ones)
- Modify member profiles
- Access audit logs
- Change portal settings
- Manage user roles
- Delete records
- Manage services or purohits

---

## Cleaning Test Data

To reset test transactions for fresh testing:
1. Login as dev-mp+testmanager@hsnef.org (or ask manager)
2. Navigate to /admin/test-accounts
3. Click "Clean Test Data"
4. Confirm the action
5. All test payments, bookings, registrations removed
6. Member records remain intact

---

## Reporting Issues

When reporting bugs, include:
1. Test case ID (e.g., TC-STF-09)
2. Test account: dev-mp+teststaff@hsnef.org
3. Steps to reproduce
4. Expected vs actual behavior
5. Screenshots if applicable

**Contact:** info@hsnef.org
