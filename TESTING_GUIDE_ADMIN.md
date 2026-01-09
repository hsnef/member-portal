# HSNEF Member Portal - Admin Testing Guide

This guide is for testing the portal as an Administrator.

---

## Overview

As Admin, you have complete system access including:
- All Manager capabilities without restrictions
- Full portal settings configuration
- User role management
- Bulk member import
- Test account management
- System settings and version info
- Unrestricted payment corrections
- Terms of use management
- Database/system health monitoring

---

## Test Account

| Field | Value |
|-------|-------|
| Role | Admin |
| Email | admin.test@example.com |
| MembershipID | 10000200 |
| Membership Level | Lifetime |

---

## Test Cases

### TC-ADM-01: Access Full Admin Panel

**Steps:**
1. Login with admin credentials
2. Navigate to /admin
3. Review the sidebar menu

**Expected Results:**
- All menu items visible and accessible:
  - Dashboard
  - Members
  - Applications
  - Payments
  - Receipts
  - Requests
  - Events
  - Bookings
  - Services
  - Purohits
  - Portal Settings
  - Settings (System)

---

### TC-ADM-02: View System Settings

**Steps:**
1. Navigate to Admin > Settings
2. Review the system information panel

**Expected Results:**
- System Information displays:
  - Application Version (e.g., 1.0.0)
  - Environment (Development/Production)
  - Database Status (Connected/Error)
  - Last Deploy Date
- Configuration categories available:
  - Portal Settings
  - Test Accounts
  - Import History
  - Member Import
  - Services Management
  - Purohits Management
  - Event Management

---

### TC-ADM-03: Assign User Role

**Steps:**
1. Navigate to Admin > Members
2. Select a member
3. Click "Edit" or "Manage Roles"
4. Assign a new role:
   - Select "Office Staff"
   - Click "Add Role"
5. Save changes

**Expected Results:**
- Role assigned to user
- User sees new capabilities on next login
- Role appears in member's profile
- Audit log records role change

---

### TC-ADM-04: Assign Multiple Roles

**Steps:**
1. Select a member
2. Add role: "Office Staff"
3. Add role: "Office Manager"
4. Save

**Expected Results:**
- Multiple roles assigned
- User has combined permissions
- Highest role determines access level

---

### TC-ADM-05: Remove User Role

**Steps:**
1. Find a member with roles
2. Edit their roles
3. Remove "Office Staff" role
4. Save

**Expected Results:**
- Role removed
- User loses associated permissions
- Change logged in audit

---

### TC-ADM-06: Promote to Admin

**Steps:**
1. Select a trusted member
2. Add "Admin" role
3. Confirm the action (may require extra confirmation)
4. Save

**Expected Results:**
- Admin role assigned
- Warning displayed about full access
- User now has complete system access

---

### TC-ADM-07: Access Test Accounts

**Steps:**
1. Navigate to Admin > Settings
2. Click "Test Accounts"
3. Review the test accounts page

**Expected Results:**
- List of test accounts displayed
- Each shows: Email, Role, MembershipID
- Options to create, edit, delete test accounts
- Test accounts clearly marked

---

### TC-ADM-08: Create Test Account

**Steps:**
1. On Test Accounts page
2. Click "Create Test Account"
3. Fill in:
   - Email: tester1@test.hsnef.org
   - Password: TestPassword123!
   - Name: Test User One
   - Role: Member
   - Membership Level: Annual
4. Click "Create"

**Expected Results:**
- Test account created
- Marked as test account in database
- Can login immediately
- Won't interfere with production data

---

### TC-ADM-09: Delete Test Account

**Steps:**
1. Find a test account
2. Click "Delete"
3. Confirm deletion

**Expected Results:**
- Test account removed
- All associated data deleted
- Cannot login with deleted account

---

### TC-ADM-10: Bulk Member Import

**Steps:**
1. Navigate to Admin > Settings
2. Click "Member Import"
3. Download the CSV template
4. Fill in member data:
   ```csv
   first_name,last_name,email,phone,address,city,state,zip,membership_level
   John,Doe,john@example.com,904-555-0001,123 Main St,Jacksonville,FL,32256,Annual
   Jane,Smith,jane@example.com,904-555-0002,456 Oak Ave,Jacksonville,FL,32257,Lifetime
   ```
5. Upload the CSV file
6. Review the import preview
7. Click "Import Members"

**Expected Results:**
- Preview shows parsed data
- Validation errors highlighted
- Import progress displayed
- Summary shows: Imported, Skipped, Errors
- MembershipIDs auto-generated

---

### TC-ADM-11: Handle Import Errors

**Steps:**
1. Upload CSV with intentional errors:
   - Invalid email format
   - Missing required field
   - Duplicate email
2. Review validation results

**Expected Results:**
- Each error clearly identified
- Row number and column shown
- Specific error message provided
- Can fix and re-upload

---

### TC-ADM-12: View Import History

**Steps:**
1. Navigate to Admin > Settings > Import History
2. Review past imports

**Expected Results:**
- List of all imports displayed
- Each shows: Date, File name, Count, Status
- Can view details of each import
- Can download original file

---

### TC-ADM-13: Edit Payment (No Time Limit)

**Steps:**
1. Navigate to Admin > Payments
2. Find a payment older than 90 days
3. Click "Edit"
4. Make changes
5. Save

**Expected Results:**
- Admin can edit any payment regardless of age
- No 90-day restriction
- Audit log captures change
- Reason for change recorded

---

### TC-ADM-14: Delete Payment Record

**Steps:**
1. Find a payment record
2. Click "Delete" (if available)
3. Enter reason for deletion
4. Confirm

**Expected Results:**
- Payment marked as deleted (soft delete)
- Not visible in normal views
- Audit trail preserved
- Can be restored if needed

---

### TC-ADM-15: Configure All Portal Settings

**Steps:**
1. Navigate to Admin > Portal Settings
2. Review all available settings:

**Authentication Settings:**
- Enable Traditional Login (toggle)
- Allow Google OAuth (toggle)
- Require Email Verification (toggle)

**Registration Settings:**
- Require Office Approval (toggle)
- Allow Self-Registration (toggle)
- Default Membership Level (dropdown)

**Membership Pricing:**
- Community Price
- Annual Price
- Lifetime Price

**Organization Settings:**
- Organization Name
- Contact Email
- Contact Phone

3. Test changing each setting

**Expected Results:**
- All settings accessible
- Changes save successfully
- Immediate effect on portal behavior

---

### TC-ADM-16: Update Terms of Use

**Steps:**
1. Navigate to Admin > Portal Settings
2. Find "Terms of Use" section
3. Click "Create New Version"
4. Update terms content (markdown supported)
5. Set version number (e.g., 2.0)
6. Set effective date
7. Save as draft
8. Preview the terms
9. Activate the new version

**Expected Results:**
- New version created
- Preview shows formatted content
- When activated:
  - All users prompted to accept on next login
  - Old version archived
  - Acceptance tracking reset

---

### TC-ADM-17: View Terms Acceptance Statistics

**Steps:**
1. Navigate to Admin > Portal Settings
2. View terms acceptance metrics

**Expected Results:**
- Statistics displayed:
  - Current version
  - Total users
  - Accepted count
  - Pending count
  - Bypass count
- Can export acceptance report

---

### TC-ADM-18: Review Terms Bypasses

**Steps:**
1. Check for terms bypass records
2. Navigate to bypass review section
3. Review each bypass:
   - User who bypassed
   - Error message
   - Retry count
   - Date/time
4. Contact user if needed
5. Mark as resolved

**Expected Results:**
- All bypasses listed
- User contact info available
- Can mark resolved after follow-up
- Resolved bypasses archived

---

### TC-ADM-19: View All Audit Logs

**Steps:**
1. Navigate to Admin > Audit Logs (if direct access)
2. Or access via member profiles
3. Search across all audit logs
4. Filter by:
   - Date range
   - User
   - Action type
   - Table/entity

**Expected Results:**
- Comprehensive audit search
- System-wide visibility
- Export capability
- Detailed change history

---

### TC-ADM-20: Check Database Health

**Steps:**
1. Navigate to Admin > Settings
2. View database status indicator
3. If available, run health check

**Expected Results:**
- Connection status shown
- Query performance metrics (if available)
- No errors in healthy state
- Alerts for any issues

---

### TC-ADM-21: Version Management

**Steps:**
1. Check current version in footer
2. Navigate to Admin > Settings
3. View version information

**Expected Results:**
- Version number displayed (e.g., 1.0.0)
- Build date/timestamp
- Environment (dev/prod)
- Consistent across all pages

---

### TC-ADM-22: Full Member Edit Access

**Steps:**
1. Navigate to Admin > Members
2. Select any member
3. Edit all fields including:
   - Membership level change
   - MembershipID correction
   - Founding member designation
4. Save changes

**Expected Results:**
- All fields editable
- No restrictions on changes
- Proper validation enforced
- Audit log captures all changes

---

### TC-ADM-23: Designate Founding Member

**Steps:**
1. Find a Lifetime member
2. Edit their profile
3. Check "Founding Member" box
4. Save

**Expected Results:**
- Founding member flag set
- Badge appears on member pass
- Only valid for Lifetime members

---

### TC-ADM-24: Generate Reports

**Steps:**
1. Navigate to reporting section (if available)
2. Generate:
   - Membership summary report
   - Financial summary report
   - Event attendance report
3. Export as CSV or PDF

**Expected Results:**
- Reports generate correctly
- Data accurate and current
- Export in chosen format

---

## Admin-Only Workflow Scenarios

### Scenario A: Emergency Access Recovery

1. User locked out of account
2. Admin locates user in member list
3. Admin resets password or sends magic link
4. User regains access
5. Incident logged

### Scenario B: Data Correction Request

1. Member reports incorrect data
2. Admin verifies correct information
3. Admin edits member record
4. Documents change reason
5. Notifies member of correction

### Scenario C: Role Assignment for New Staff

1. Temple hires new office staff
2. Admin creates member account (if not exists)
3. Admin assigns "Office Staff" role
4. Admin provides login instructions
5. Staff begins with appropriate access

### Scenario D: Annual Pricing Update

1. Board approves new membership rates
2. Admin navigates to Portal Settings
3. Updates all pricing tiers
4. Verifies /join page shows new prices
5. Announces changes to members

---

## Security Responsibilities

As Admin, you are responsible for:
- Protecting system access credentials
- Reviewing unusual audit log entries
- Managing role assignments carefully
- Responding to security incidents
- Ensuring data accuracy
- Terms of use compliance

---

## Best Practices

1. **Least Privilege**: Only assign roles that users need
2. **Audit Review**: Regularly check audit logs for anomalies
3. **Backup Awareness**: Understand backup/recovery procedures
4. **Test in Dev**: Test major changes in development first
5. **Document Changes**: Note reasons for unusual actions
6. **Two-Person Rule**: For critical changes, have another admin verify

---

## Troubleshooting

### User Cannot Login
1. Check if account exists
2. Verify email address correct
3. Check if account is locked
4. Try password reset
5. Check auth provider status

### Payment Not Showing
1. Check payment date range filter
2. Verify member association
3. Check for soft-deleted status
4. Review audit log for changes

### Import Failing
1. Validate CSV format
2. Check for special characters
3. Verify all required columns
4. Check for duplicate emails
5. Review detailed error messages

---

## Reporting Issues

When reporting bugs, include:
1. Test case ID (e.g., TC-ADM-10)
2. Admin test account used
3. Complete steps to reproduce
4. Expected vs actual behavior
5. Error messages and screenshots
6. Browser console errors if applicable

**Contact:** info@hsnef.org

---

## Quick Reference Card

| Action | Location |
|--------|----------|
| Add User Role | Members > [Member] > Edit > Roles |
| Import Members | Settings > Member Import |
| Test Accounts | Settings > Test Accounts |
| Portal Config | Portal Settings |
| Update Terms | Portal Settings > Terms |
| View All Audits | Member profiles or Audit Logs |
| System Info | Settings |
| Edit Any Payment | Payments > [Payment] > Edit |
