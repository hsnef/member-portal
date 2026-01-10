# HSNEF Member Portal - Office Manager Testing Guide

This guide is for testing the portal as an Office Manager.

---

## Overview

As Office Manager, you have all Staff features plus:
- Approve and reject membership applications
- Assign MembershipIDs to new members
- Edit payments within 90 days
- View audit logs for members
- Manage services and pricing
- Manage purohits (priests)
- Configure portal settings
- Process booking approvals
- Manage test accounts and clean test data

**Note:** Office Manager is the highest role available in test accounts. For Admin-specific features, a real Admin account with database access is required.

---

## Test Account

| Field | Value |
|-------|-------|
| Role | Office Manager |
| Email | dev-mp+testmanager@hsnef.org |
| MembershipID | 99991000 |
| Membership Level | Lifetime |

**Recommended Password:** `TestPassword123!`

### First-Time Setup

If not yet registered:
1. Navigate to `/register`
2. Enter: dev-mp+testmanager@hsnef.org
3. Create password (e.g., "TestPassword123!")
4. System links auth to existing member record

### After Registration - Assign Role

The Office Manager role must be assigned by the Test Admin:
1. Test Admin logs in as `dev-mp+testadmin@hsnef.org`
2. Navigates to **Settings → Staff Role Management** (`/admin/settings/staff-roles`)
3. Searches for "testmanager"
4. Assigns the **Office Manager** role

---

## All Test Accounts

| Account | Email | MembershipID | Level | Role |
|---------|-------|--------------|-------|------|
| Admin | dev-mp+testadmin@hsnef.org | 99990000 | Lifetime | Admin |
| Manager | dev-mp+testmanager@hsnef.org | 99991000 | Lifetime | Office Manager |
| Staff | dev-mp+teststaff@hsnef.org | 99992000 | Lifetime | Office Staff |
| Lifetime | dev-mp+testlifetime@hsnef.org | 99993000 | Lifetime | Member |
| Annual | dev-mp+testannual@hsnef.org | 99994000 | Annual | Member |
| Community | dev-mp+testcommunity@hsnef.org | 99995000 | Community | Member |

All test accounts:
- Use MembershipID prefix `9` (99990000-99995000)
- Show purple "TEST" badge in UI
- Are excluded from reports and metrics
- Can be cleaned without deleting member records

---

## Test Cases

### TC-MGR-01: Approve Membership Application

**Steps:**
1. Navigate to Admin > Applications (Pending Registrations)
2. Find a "Pending" application
3. Click on the application to view details
4. Review all submitted information
5. Click "Approve" button
6. In the modal:
   - Verify or edit the auto-generated MembershipID
   - Add any approval notes (optional)
7. Click "Confirm Approval"

**Expected Results:**
- Application status changes to "Approved"
- MembershipID assigned (format: [1|2|3]XXXXX00)
- Member record created in members table
- Welcome email sent to new member
- Approval recorded in audit log

---

### TC-MGR-02: Verify MembershipID Format

**When approving applications, verify:**

| Level | Prefix | Example |
|-------|--------|---------|
| Lifetime | 1 | 10000100, 10001200 |
| Annual | 2 | 20000100, 20005600 |
| Community | 3 | 30000100, 30002300 |

**All IDs must:**
- Be 8 digits
- End with "00"
- Start with correct prefix for membership level

**Note:** Test accounts use prefix `9` (99991000-99995000) and bypass this validation.

---

### TC-MGR-03: Reject Membership Application

**Steps:**
1. Navigate to Admin > Applications
2. Find a pending application
3. Click to view details
4. Click "Reject" button
5. Enter rejection reason (required):
   - Example: "Duplicate application - member already exists"
   - Example: "Incomplete information provided"
6. Click "Confirm Rejection"

**Expected Results:**
- Application status changes to "Rejected"
- Rejection reason saved
- Rejection email sent to applicant
- No member record created

---

### TC-MGR-04: Approve Application with Custom MembershipID

**Steps:**
1. Navigate to Admin > Applications
2. Select a pending application
3. Click "Approve"
4. In the modal, edit the MembershipID:
   - Change last 4 digits (before the 00)
   - Example: Change 20000100 to 20012300
5. Confirm approval

**Expected Results:**
- Custom MembershipID assigned
- ID validation ensures correct format
- Member created with specified ID

---

### TC-MGR-05: Edit Recent Payment

**Steps:**
1. Navigate to Admin > Payments
2. Find a payment from within the last 90 days (use test account payment)
3. Click "Edit" button
4. Modify payment details:
   - Change amount
   - Update notes
   - Correct category
5. Click "Save Changes"

**Expected Results:**
- Payment updated successfully
- Audit log entry created
- Original values preserved in audit
- Updated by and timestamp recorded

---

### TC-MGR-06: Cannot Edit Old Payment

**Steps:**
1. Navigate to Admin > Payments
2. Find a payment older than 90 days
3. Try to edit the payment

**Expected Results:**
- Edit button disabled or hidden
- If clicked, error message: "Payments older than 90 days cannot be edited"
- Must contact Admin for older corrections

---

### TC-MGR-07: View Member Audit Log

**Steps:**
1. Navigate to Admin > Members
2. Click on dev-mp+testlifetime@hsnef.org to view details
3. Click "Audit Log" or "View History" button
4. Review the audit entries

**Expected Results:**
- Chronological list of changes displayed
- Each entry shows:
  - Date and time
  - User who made the change
  - Action type (create, update, delete)
  - Fields changed
  - Old and new values
- Can filter by date range
- Can filter by action type

---

### TC-MGR-08: Export Audit Log

**Steps:**
1. View a member's audit log
2. Click "Export" button
3. Select format (CSV or PDF)

**Expected Results:**
- File downloads with audit entries
- All displayed entries included
- Properly formatted for chosen format

---

### TC-MGR-09: Create New Service

**Steps:**
1. Navigate to Admin > Services
2. Click "Add Service"
3. Fill in service details:
   - Service Name: "Satyanarayan Puja"
   - Description: "Traditional puja ceremony"
   - Base Price: $151.00
   - Duration: 2 hours
   - Category: Religious
   - Status: Active
4. Click "Save"

**Expected Results:**
- Service created successfully
- Appears in service list
- Available for booking

---

### TC-MGR-10: Edit Service

**Steps:**
1. Navigate to Admin > Services
2. Click on a service
3. Click "Edit"
4. Update the price from $151 to $175
5. Save changes

**Expected Results:**
- Service updated
- New price applies to new bookings
- Existing bookings unchanged

---

### TC-MGR-11: Deactivate Service

**Steps:**
1. Navigate to Admin > Services
2. Click on a service
3. Change status to "Inactive"
4. Save

**Expected Results:**
- Service marked inactive
- Not available for new bookings
- Existing bookings unaffected
- Still visible in admin panel

---

### TC-MGR-12: Add Purohit

**Steps:**
1. Navigate to Admin > Purohits
2. Click "Add Purohit"
3. Fill in details:
   - Name: "Pandit Sharma"
   - Phone: "904-555-1234"
   - Email: "pandit@example.com"
   - Specializations: "Vedic ceremonies, Pujas"
   - Status: Active
4. Save

**Expected Results:**
- Purohit added to system
- Available for service assignments
- Contact info accessible

---

### TC-MGR-13: Edit Purohit

**Steps:**
1. Navigate to Admin > Purohits
2. Click on a purohit
3. Click "Edit"
4. Update contact information
5. Save

**Expected Results:**
- Purohit information updated
- Changes reflected immediately

---

### TC-MGR-14: Approve Service Booking

**Steps:**
1. Navigate to Admin > Bookings
2. Find a "Pending Approval" booking (create one using dev-mp+testannual@hsnef.org first)
3. Click to view details
4. Review the request:
   - Service requested
   - Preferred dates
   - Member information
   - Special requests
5. Click "Approve"
6. Add approval notes (optional)
7. Confirm total amount

**Expected Results:**
- Booking status changes to "Approved"
- Member notified via email
- "Pay Now" button appears for member
- Approval notes saved

---

### TC-MGR-15: Reject Service Booking

**Steps:**
1. Navigate to Admin > Bookings
2. Find a pending booking
3. View details
4. Click "Reject"
5. Enter rejection reason:
   - "Date not available"
   - "Service not offered on this day"
6. Confirm rejection

**Expected Results:**
- Booking status changes to "Rejected"
- Member notified with reason
- Booking removed from pending queue

---

### TC-MGR-16: Configure Portal Settings

**Steps:**
1. Navigate to Admin > Portal Settings
2. Review available settings

**Expected Results:**
- Settings page loads
- Grouped by category:
  - Authentication Settings
  - Registration Settings
  - General Settings
  - Membership Pricing

---

### TC-MGR-17: Toggle Traditional Login

**Steps:**
1. Navigate to Admin > Portal Settings
2. Find "Enable Traditional Login" toggle
3. Toggle it ON
4. Wait for save confirmation
5. Open /login in incognito window

**Expected Results:**
- Setting saved successfully
- Login page now shows email/password option
- Users can register with password

---

### TC-MGR-18: Toggle Member Approval Requirement

**Steps:**
1. Navigate to Admin > Portal Settings
2. Find "Require Office Approval" toggle
3. Toggle it ON
4. Submit a test application at /join

**Expected Results:**
- Setting saved
- New applications require manual approval
- Applications show in pending queue

---

### TC-MGR-19: Update Membership Pricing

**Steps:**
1. Navigate to Admin > Portal Settings
2. Scroll to "Membership Pricing" section
3. Update Annual Membership:
   - Price: 251 to 275
   - Display Price: "$275/year"
   - Description: Update as needed
4. Save changes
5. Check /join page

**Expected Results:**
- Pricing saved
- /join page shows updated prices
- New payments use new pricing

---

### TC-MGR-20: View Portal Settings Help

**Steps:**
1. On Portal Settings page
2. Click help icon or "?" next to a setting
3. Read the explanation

**Expected Results:**
- Clear explanation of what the setting does
- Examples provided where helpful
- Impact of change explained

---

### TC-MGR-21: Manage Test Accounts

**Steps:**
1. Navigate to Admin > Test Accounts (or /admin/test-accounts)
2. View all 5 test accounts
3. Check registration status for each
4. Use "Reset Password" if needed

**Expected Results:**
- All test accounts listed:
  - dev-mp+testmanager@hsnef.org (99991000)
  - dev-mp+teststaff@hsnef.org (99992000)
  - dev-mp+testlifetime@hsnef.org (99993000)
  - dev-mp+testannual@hsnef.org (99994000)
  - dev-mp+testcommunity@hsnef.org (99995000)
- Registration status shown
- Password reset sends email

---

### TC-MGR-22: Clean Test Data

**Steps:**
1. Navigate to Admin > Test Accounts
2. Click "Clean Test Data" button
3. Confirm the action

**Expected Results:**
- All test account transactions removed:
  - Payments
  - Service bookings
  - Event registrations
  - Requests
- Member records remain intact
- Confirmation message displayed
- Can continue testing immediately

---

### TC-MGR-23: Create Member Manually

**Steps:**
1. Navigate to Admin > Members
2. Click "Add Member"
3. Fill in all required fields:
   - Membership Type: Personal
   - Membership Level: Annual
   - Name, Email, Phone, Address
4. Click "Create Member"

**Expected Results:**
- Member created
- MembershipID auto-generated (format: 2XXXXX00 for Annual)
- Can send invitation to set up login
- Member appears in directory

---

### TC-MGR-24: Edit Member Profile

**Steps:**
1. Navigate to Admin > Members
2. Find dev-mp+testannual@hsnef.org
3. Click "Edit"
4. Update phone number
5. Save changes

**Expected Results:**
- Member profile updated
- Audit log entry created
- Member sees change on their end

---

### TC-MGR-25: View Registration Statistics

**Steps:**
1. Navigate to Admin > Applications
2. View summary statistics at top

**Expected Results:**
- Counts displayed:
  - Total pending
  - Total approved this month
  - Total rejected this month
  - Average approval time

---

### TC-MGR-26: View Import History

**Steps:**
1. Navigate to Admin > Settings > Import History
2. Review past imports

**Expected Results:**
- List of all imports displayed
- Each shows: Date, File name, Count, Status
- Can view details of each import

---

### TC-MGR-27: Import Members (Bulk)

**Steps:**
1. Navigate to Admin > Settings > Import Members
2. Download CSV template
3. Fill with test data (non-test account members)
4. Upload CSV file
5. Review import preview
6. Confirm import

**Expected Results:**
- Preview shows parsed data
- Validation errors highlighted
- Members created with auto-generated MembershipIDs
- Import recorded in history

---

## Manager Workflow Scenarios

### Scenario A: New Member Approval Flow

1. Application submitted via /join (use new email)
2. Login as dev-mp+testmanager@hsnef.org
3. Navigate to Applications
4. Review application details
5. Verify information (call if needed)
6. Approve and assign MembershipID
7. System sends welcome email with login instructions
8. Member activates account and logs in

### Scenario B: Service Booking Approval

1. Login as dev-mp+testannual@hsnef.org
2. Create service booking request
3. Logout, login as dev-mp+testmanager@hsnef.org
4. Navigate to Bookings
5. Review and approve the booking
6. Logout, login as dev-mp+testannual@hsnef.org
7. Pay for the approved booking
8. Manager marks service complete

### Scenario C: Payment Correction

1. Staff recorded incorrect amount
2. Login as dev-mp+testmanager@hsnef.org
3. Navigate to Payments
4. Locate payment (within 90 days)
5. Edit payment with correct amount
6. Audit log captures change with reason
7. Updated receipt available if needed

### Scenario D: Clean Testing Environment

1. Login as dev-mp+testmanager@hsnef.org
2. Navigate to /admin/test-accounts
3. Click "Clean Test Data"
4. All test transactions removed
5. Ready for fresh testing scenarios

---

## Things Manager CANNOT Do

- Assign Admin roles to users
- Delete member records permanently
- Edit payments older than 90 days
- Access system configuration beyond portal settings
- Full role management (can view but limited edits)

---

## Audit Trail Awareness

As a Manager, you have audit log access. Be aware that:
- All your actions are logged
- Payment edits require justification
- Approval/rejection reasons are permanent
- Export functions track who exported what

---

## Quick Reference Card

```
+------------------------------------------------------------------+
|               OFFICE MANAGER QUICK REFERENCE                      |
+------------------------------------------------------------------+
| Login:        dev-mp+testmanager@hsnef.org                       |
| Password:     TestPassword123!                                   |
| MembershipID: 99991000                                           |
| Role:         Office Manager                                     |
+------------------------------------------------------------------+
| APPROVALS                                                        |
| - Applications: Admin > Applications > Approve/Reject            |
| - Bookings: Admin > Bookings > Approve/Reject                    |
+------------------------------------------------------------------+
| SETTINGS                                                         |
| - Portal Settings: Admin > Portal Settings                       |
| - Membership Pricing: Portal Settings > Pricing                  |
| - Services: Admin > Services                                     |
| - Purohits: Admin > Purohits                                     |
+------------------------------------------------------------------+
| TEST ACCOUNTS                                                    |
| - Manage: /admin/test-accounts                                   |
| - Clean Data: Click "Clean Test Data" button                     |
+------------------------------------------------------------------+
```

---

## Reporting Issues

When reporting bugs, include:
1. Test case ID (e.g., TC-MGR-05)
2. Test account: dev-mp+testmanager@hsnef.org
3. Steps to reproduce
4. Expected vs actual behavior
5. Screenshots if applicable

**Contact:** info@hsnef.org
