# HSNEF Member Portal - Complete Tester Guide

> ### ⚠️ Sign-in is magic link or Google — there is no password login
>
> The login page offers exactly two options: **"Email me a sign-in link"** and
> **Sign in with Google**. It says so on the page: *"Sign in with your email — no
> password to remember."*
>
> Registration at `/register` still asks you to set a password and stores one,
> but **nothing on the login page can use it**. Any step below that asks you to
> sign in with a password cannot pass, and is marked N/A.
>
> Verified against the code 2026-09-03.

**Version:** 1.0
**Last Updated:** January 2026
**Portal URL:** https://dev.member.hsnef.org

---

## Table of Contents

1. [Initial Setup (Required First)](#1-initial-setup-required-first)
2. [Test Accounts Overview](#2-test-accounts-overview)
3. [Registration Process](#3-registration-process)
4. [Testing by Role](#4-testing-by-role)
   - [Public User Testing](#41-public-user-testing)
   - [Member Testing](#42-member-testing)
   - [Office Staff Testing](#43-office-staff-testing)
   - [Office Manager Testing](#44-office-manager-testing)
   - [Admin Testing](#45-admin-testing)
5. [Complete Test Scenarios](#5-complete-test-scenarios)
6. [Test Data Management](#6-test-data-management)
7. [Troubleshooting](#7-troubleshooting)
8. [Quick Reference](#8-quick-reference)

---

## 1. Initial Setup (Required First)

Before testers can begin, a real Admin must set up the test admin account.

### Step 1: Register the Test Admin Account

1. Open browser and navigate to: `https://dev.member.hsnef.org/register`
2. Enter email: `dev-mp+testadmin@hsnef.org`
3. Set a password when asked (`TestPassword123!` is fine) — **note it is never
   used to sign in**; registration stores one but the login page cannot use it
4. Complete registration

### Step 2: Real Admin Assigns Test Admin Role

1. Login with your **real Admin account** (not the test account)
2. Navigate to: **Settings → Staff Role Management**
   URL: `/admin/settings/staff-roles`
3. In the search box, search for "testadmin"
4. Select the test admin user from search results
5. Choose **Admin** role
6. Click **Assign Admin Role**

### Step 3: Verify Setup

1. Logout from the real Admin account
2. Login as `dev-mp+testadmin@hsnef.org`
3. Verify you can access the Admin dashboard
4. You should see all admin menu options

**Once this setup is complete, testers can use the test admin account to test all admin functionality without creating permanent data.**

---

## 2. Test Accounts Overview

Test accounts are pre-configured in the database and are automatically excluded from all production reports and metrics.

### Available Test Accounts

| Role | Email | Membership ID | Level | Purpose |
|------|-------|---------------|-------|---------|
| **Admin** | dev-mp+testadmin@hsnef.org | 99990000 | Lifetime | Full system testing |
| **Office Manager** | dev-mp+testmanager@hsnef.org | 99991000 | Lifetime | Manager functions |
| **Office Staff** | dev-mp+teststaff@hsnef.org | 99992000 | Lifetime | Staff functions |
| **Lifetime Member** | dev-mp+testlifetime@hsnef.org | 99993000 | Lifetime | Member pricing tests |
| **Annual Member** | dev-mp+testannual@hsnef.org | 99994000 | Annual | Renewal testing |
| **Community Member** | dev-mp+testcommunity@hsnef.org | 99995000 | Community | Non-paid member tests |

### Test Account Features

- **Purple TEST Badge**: All test accounts display a purple "TEST" badge in the UI
- **Auto-Filtering**: Automatically excluded from dashboard metrics, financial reports, and analytics
- **Data Isolation**: Test users only see test-created events; production users never see test data
- **Clean Data Option**: Test data can be cleaned without affecting member records

### About passwords

Registration asks for one, so use `TestPassword123!` everywhere for convenience.
**You will never sign in with it.** Sign-in is magic link or Google — see the
note at the top of this guide.

---

## 3. Registration Process

### How to Register Test Accounts

Each test account must be registered before use:

1. Navigate to: `https://dev.member.hsnef.org/register`
2. Enter the test account email (e.g., `dev-mp+testlifetime@hsnef.org`)
3. Set password: `TestPassword123!` (stored, but never used to sign in)
4. Click **Create Account**
5. The system automatically links the auth account to the existing test member record

### Assigning Staff Roles (Test Admin Only)

After registering staff test accounts, the Test Admin must assign roles:

1. Login as Test Admin (`dev-mp+testadmin@hsnef.org`)
2. Go to **Settings → Staff Role Management** (`/admin/settings/staff-roles`)
3. Search for the registered test account
4. Assign the appropriate role:
   - `dev-mp+testmanager@hsnef.org` → **Office Manager**
   - `dev-mp+teststaff@hsnef.org` → **Office Staff**

### Registration Order

For complete testing, register accounts in this order:

1. Test Admin (already done in Initial Setup)
2. Test Manager → assign Office Manager role
3. Test Staff → assign Office Staff role
4. Test Lifetime Member (no role needed)
5. Test Annual Member (no role needed)
6. Test Community Member (no role needed)

---

## 4. Testing by Role

### 4.1 Public User Testing

**No login required** - Test as an unauthenticated visitor.

#### Test Cases

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| PUB-01 | View Home Page | Navigate to portal URL | Landing page displays with temple info and login options |
| PUB-02 | Google OAuth Login | Click "Sign in with Google" → Complete auth | Redirected to dashboard or limited access page |
| PUB-03 | Magic Link Login | Enter email → Click "Send Magic Link" → Check email → Click link | Logged in and redirected to dashboard |
| PUB-04 | ~~Password Login~~ | **N/A — no password login exists.** The login page offers only magic link and Google | — |
| PUB-05 | Submit Personal Application | Go to /join → Fill form → Submit | Success message displayed |
| PUB-06 | Submit Business Application | Go to /join → Select Business → Fill form → Submit | Success message displayed |
| PUB-07 | View Terms of Use | Navigate to /terms | Terms content displays with version |
| PUB-08 | Access Protected Page | Try to access /member without login | Redirected to login page |
| PUB-09 | ~~Password Reset~~ | **N/A** — there is no "Forgot Password" link and no `/forgot-password` route | — |

#### Membership Application Fields

**Personal Membership:**
- First Name, Last Name (required)
- Email, Phone (required)
- Date of Birth, Nakshatra, Gotra (optional)
- Address: Street, City, State, ZIP (required)
- Spouse information (optional)

**Business Membership:**
- Business Name (required)
- Contact Person, Email, Phone (required)
- Business Address (required)
- EIN (optional)

---

### 4.2 Member Testing

**Login Required**: Use test member accounts

#### Test Cases

| ID | Test Case | Account | Steps | Expected Result |
|----|-----------|---------|-------|-----------------|
| MEM-01 | View Dashboard | testlifetime | Login → View dashboard | Membership status, QR code, quick actions visible |
| MEM-02 | Print Membership Pass | testlifetime | Dashboard → Click "Print Pass" | Print dialog opens |
| MEM-03 | Download QR Code | testlifetime | Dashboard → Click "Download QR" | PNG file downloads |
| MEM-04 | View Payment History | testlifetime | Navigate to Payment History | List of payments with filters |
| MEM-05 | Download Receipt | testlifetime | Payment History → Click receipt | PDF downloads |
| MEM-06 | Register for Event | testlifetime | Events → Click "Register" | Registration confirmed |
| MEM-07 | Cancel Event Registration | testlifetime | Events → Click "Cancel" | Registration removed |
| MEM-08 | Create Service Booking | testannual | Bookings → New → Fill form → Submit | Booking created (Pending) |
| MEM-09 | View Booking Status | testannual | Navigate to My Bookings | Bookings list with status |
| MEM-10 | Renew Membership | testannual | Renew → Select level → Pay | Membership updated |

#### Pricing Verification Test

1. Login as `dev-mp+testlifetime@hsnef.org`
2. Create a service booking, note the price
3. Logout
4. Login as `dev-mp+testcommunity@hsnef.org`
5. Create the same service booking
6. **Verify**: Community member sees higher (non-member) pricing

---

### 4.3 Office Staff Testing

**Login Required**: `dev-mp+teststaff@hsnef.org`

#### Test Cases

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| STF-01 | Access Admin Panel | Login → Go to /admin | Admin dashboard displays |
| STF-02 | View All Members | Admin → Members | Member list with search/filter |
| STF-03 | View Member Details | Click on member name | Detail page opens |
| STF-04 | View Pending Applications | Admin → Applications | List of pending registrations |
| STF-05 | Record Manual Payment | Admin → Payments → New | Payment recorded |
| STF-06 | Create Event | Admin → Events → New | Event created |
| STF-07 | Scan Member QR | Admin → Scan QR → Scan code | Member info displays |
| STF-08 | View Event Registrations | Admin → Events → Select event | Registration list |

#### Recording a Payment

1. Navigate to **Admin → Payments → New Payment**
2. Search and select a test member
3. Enter payment details:
   - Amount: $100
   - Method: Cash
   - Category: Donation
   - Notes: "Test donation"
4. Click **Submit**
5. **Verify**: Payment recorded, receipt available

---

### 4.4 Office Manager Testing

**Login Required**: `dev-mp+testmanager@hsnef.org`

#### Test Cases

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| MGR-01 | Approve Application | Applications → Select → Approve | Member created with ID |
| MGR-02 | Reject Application | Applications → Select → Reject | Status changed to Rejected |
| MGR-03 | Edit Payment | Payments → Find payment → Edit | Payment updated |
| MGR-04 | View Audit Logs | Member profile → Audit Log | Change history displayed |
| MGR-05 | Manage Services | Admin → Services → Add/Edit | Service saved |
| MGR-06 | Manage Purohits | Admin → Purohits → Add/Edit | Purohit saved |
| MGR-07 | Configure Portal Settings | Admin → Portal Settings | Settings saved |
| MGR-08 | Update Pricing | Portal Settings → Membership Pricing | Prices update on /join |

#### Application Approval Workflow

1. Navigate to **Admin → Pending Registrations**
2. Click on a pending application
3. Review all submitted information
4. Click **Approve**
5. System suggests Membership ID (format: X9999900)
6. Verify or modify the ID
7. Click **Confirm Approval**
8. **Verify**:
   - Status changes to Approved
   - Member record created
   - Membership ID assigned

---

### 4.5 Admin Testing

**Login Required**: `dev-mp+testadmin@hsnef.org`

#### Test Cases

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| ADM-01 | Access Staff Roles | Settings → Staff Role Management | Role management page loads |
| ADM-02 | Assign Role | Search member → Select role → Assign | Role assigned successfully |
| ADM-03 | Remove Role | Staff list → Click "Remove [Role]" | Role removed |
| ADM-04 | View Test Accounts | Admin → Test Accounts | All test accounts listed |
| ADM-05 | Clean Test Data | Test Accounts → Clean Test Data | Test transactions removed |
| ADM-06 | Import Members | Settings → Import → Upload CSV | Members imported |
| ADM-07 | View Import History | Settings → Import History | Past imports listed |
| ADM-08 | View System Info | Admin → Settings | Version and status shown |

#### Staff Role Assignment

1. Navigate to **Settings → Staff Role Management**
2. In "Assign Role to Member" section, search for a member
3. Click on the member in search results
4. Select role: Office Staff, Office Manager, or Admin
5. Click **Assign [Role] Role**
6. **Verify**: Member appears in Current Staff Members list

**Note**: Members must be registered before roles can be assigned.

---

## 5. Complete Test Scenarios

### Scenario A: New Member Journey

| Step | Actor | Action | Expected |
|------|-------|--------|----------|
| 1 | Guest | Visit /join, fill form, submit | Application submitted |
| 2 | Manager | Login, review application | Application visible |
| 3 | Manager | Approve application | Member created |
| 4 | New Member | Register at /register | Auth account linked |
| 5 | New Member | Login, view dashboard | Dashboard displays |
| 6 | New Member | Print membership pass | Pass prints correctly |

### Scenario B: Event Registration Flow

| Step | Actor | Action | Expected |
|------|-------|--------|----------|
| 1 | Staff | Create new event | Event published |
| 2 | Member | Browse events, register | Registration confirmed |
| 3 | Staff | View registration list | Member appears |
| 4 | Member | Cancel registration | Registration removed |

### Scenario C: Service Booking Flow

| Step | Actor | Action | Expected |
|------|-------|--------|----------|
| 1 | Member | Create booking request | Status: Pending |
| 2 | Staff | Review booking | Details visible |
| 3 | Manager | Approve booking | Status: Approved |
| 4 | Member | Make payment | Payment processed |
| 5 | Staff | Mark complete | Status: Completed |

### Scenario D: Payment Processing

| Step | Actor | Action | Expected |
|------|-------|--------|----------|
| 1 | Member | Initiate online payment | Stripe form displays |
| 2 | Member | Enter test card, submit | Payment succeeds |
| 3 | System | Generate receipt | Receipt available |
| 4 | Member | View payment history | Payment listed |
| 5 | Member | Download receipt | PDF downloads |

---

## 6. Test Data Management

### Staff Test Data Toggle

Staff members (Admin/Manager/Staff) have a toggle to show/hide test data:

**Location**: Admin header, top right (purple toggle)

| Toggle State | Display |
|--------------|---------|
| OFF (Default) | Production data only |
| ON (Debug) | Both production and test data (test items marked with purple badge) |

### Clean Test Data

To remove all test transactions while keeping test accounts:

1. Login as Test Admin
2. Navigate to **Admin → Test Accounts** (`/admin/test-accounts`)
3. Click **Clean Test Data**
4. Confirm the action

**What gets deleted:**
- All payments by test accounts
- All service bookings by test accounts
- All event registrations by test accounts
- All requests by test accounts

**What remains:**
- Test member records (can continue testing without re-registering)

### Stripe Test Cards

For payment testing, use these Stripe test card numbers:

| Card Number | Result |
|-------------|--------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Declined |
| 4000 0025 0000 3155 | Requires Authentication |

**For all test cards:**
- Expiry: Any future date (e.g., 12/28)
- CVC: Any 3 digits (e.g., 123)
- ZIP: Any 5 digits (e.g., 12345)

---

## 7. Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "No member found with this email" | Member record doesn't exist | Use /join to apply, or have admin create member |
| "Email already registered" | Auth account exists | Sign in with a magic link instead |
| Test account shows "Not Registered" | Auth account not created | Register at /register with test email |
| Can't access admin features | Missing role | Test Admin must assign role |
| Can't assign role to member | Member not registered | Member must register first |
| Magic link not received | Email issue | Check spam folder, verify email address |
| Test data appearing in reports | Filter not applied | Verify is_test_account flag in database |

### Error Messages

**"This member has not registered yet"**
- The member exists in database but hasn't created a portal login
- Solution: Member must register at /register

**"Invalid credentials"**
- Wrong email (there is no password to get wrong)
- Solution: Use password reset or try magic link

**"Terms must be accepted"**
- Terms checkbox not checked on application form
- Solution: Check the terms acceptance checkbox

### Browser Compatibility

Test on these browsers:
- Google Chrome (latest)
- Mozilla Firefox (latest)
- Microsoft Edge (latest)
- Safari (latest)

### Mobile Testing

Test on mobile devices for:
- Form usability on small screens
- Tap-friendly buttons (minimum 44px)
- Readable text without zooming
- Working navigation menu

---

## 8. Quick Reference

### URLs

| Page | URL |
|------|-----|
| Home | / |
| Login | /login |
| Register | /register |
| Join (Apply) | /join |
| Terms | /terms |
| Member Dashboard | /member |
| Admin Dashboard | /admin |
| Staff Roles | /admin/settings/staff-roles |
| Test Accounts | /admin/test-accounts |
| Pending Applications | /admin/pending-registrations |

### Test Account Quick Card

```
╔═══════════════════════════════════════════════════════════════╗
║              TEST ACCOUNTS - QUICK REFERENCE                  ║
╠═══════════════════════════════════════════════════════════════╣
║  Admin:      dev-mp+testadmin@hsnef.org        (99990000)     ║
║  Manager:    dev-mp+testmanager@hsnef.org      (99991000)     ║
║  Staff:      dev-mp+teststaff@hsnef.org        (99992000)     ║
║  Lifetime:   dev-mp+testlifetime@hsnef.org     (99993000)     ║
║  Annual:     dev-mp+testannual@hsnef.org       (99994000)     ║
║  Community:  dev-mp+testcommunity@hsnef.org    (99995000)     ║
╠═══════════════════════════════════════════════════════════════╣
║  Password:   TestPassword123! (unused - sign in by magic link)║
║  Management: /admin/test-accounts                             ║
║  Clean Data: Click "Clean Test Data" button                   ║
╚═══════════════════════════════════════════════════════════════╝
```

### Membership ID Format

| Level | Prefix | Example |
|-------|--------|---------|
| Lifetime | 1 | 10000100 |
| Annual | 2 | 20000100 |
| Community | 3 | 30000100 |
| Test Accounts | 9 | 99991000 |

### Reporting Bugs

When reporting issues, include:

1. **Test Account Used**: Which test account email
2. **Test Case ID**: e.g., MEM-05
3. **Steps to Reproduce**: Exact steps taken
4. **Expected Behavior**: What should happen
5. **Actual Behavior**: What actually happened
6. **Screenshots**: If applicable
7. **Browser/Device**: Browser name and version

**Contact**: info@hsnef.org

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | January 2026 | Initial release |

---

*This document is for HSNEF Member Portal testers. All test accounts and data are isolated from production systems.*
