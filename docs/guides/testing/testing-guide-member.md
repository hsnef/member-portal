# HSNEF Member Portal - Member Testing Guide

This guide is for testing the portal as an authenticated Member.

---

## Overview

As a Member, you can:
- View your personalized dashboard
- Access and print your digital membership pass
- Manage your profile and family members
- Register for temple events
- Request service bookings
- View payment history and download receipts
- Renew or upgrade your membership
- Make donations

---

## Test Accounts

Use these pre-configured test accounts for member testing:

| Account | Email | MembershipID | Level | Purpose |
|---------|-------|--------------|-------|---------|
| Lifetime | dev-mp+testlifetime@hsnef.org | 99993000 | Lifetime | Test member pricing, no expiry |
| Annual | dev-mp+testannual@hsnef.org | 99994000 | Annual | Test renewal flow, expiry handling |
| Community | dev-mp+testcommunity@hsnef.org | 99995000 | Community | Test non-member pricing |

**Recommended Password:** `TestPassword123!`

### First-Time Setup

If the test account shows "Not Registered":
1. Navigate to `/register`
2. Enter the test account email
3. Create a password (e.g., "TestPassword123!")
4. The system links to the existing member record

### Test Account Features

- **Purple "TEST" Badge:** Visible on dashboard and in admin views
- **Auto-Excluded:** From reports, metrics, and analytics
- **Clean Data Option:** Staff can reset all test transactions at `/admin/test-accounts`

---

## Test Cases

### TC-MEM-01: Login and View Dashboard

**Steps:**
1. Navigate to /login
2. Login with dev-mp+testlifetime@hsnef.org
3. Observe the dashboard

**Expected Results:**
- Dashboard loads with personalized greeting
- Purple "TEST" badge visible
- Membership status banner shows:
  - Membership level (Lifetime)
  - No expiration (Lifetime members)
- Digital membership pass is visible
- Quick action buttons are displayed

---

### TC-MEM-02: View Membership Pass

**Steps:**
1. From dashboard, locate the membership pass card
2. Review the information displayed

**Expected Results:**
- Pass displays:
  - Your name
  - Membership ID (99993000 for test.lifetime)
  - Membership level
  - Valid until date (or "Lifetime" for no expiry)
  - QR code
  - Family members (if applicable)
- Pass styled appropriately for membership level:
  - Lifetime: Gold/Amber gradient
  - Annual: Blue gradient
  - Community: Green gradient

---

### TC-MEM-03: Print Membership Pass

**Steps:**
1. From dashboard, click "Print Pass" button on the membership card
2. Review print preview

**Expected Results:**
- Print dialog opens
- Pass formatted for printing (single page)
- QR code clearly visible
- All text legible

---

### TC-MEM-04: Download QR Code

**Steps:**
1. From dashboard, click "Download QR" button
2. Check your downloads folder

**Expected Results:**
- PNG image downloads
- QR code is clear and scannable
- File named appropriately (e.g., "membership-qr-99993000.png")

---

### TC-MEM-05: View Profile

**Steps:**
1. Click "Edit Profile" from dashboard
2. Review your profile information

**Expected Results:**
- Profile page displays all your information:
  - Personal details (name, email, phone)
  - Address information
  - Membership details
  - Nakshatra (if provided)
  - Family Gotra (if provided)

---

### TC-MEM-06: Edit Profile

**Steps:**
1. Navigate to your profile
2. Click "Edit" or directly edit fields
3. Change your phone number
4. Click "Save"

**Expected Results:**
- Changes saved successfully
- Confirmation message displayed
- Updated information visible on profile

---

### TC-MEM-07: Manage Family Members

**Prerequisite:** Personal membership only (test.lifetime or test.annual)

**Steps:**
1. Click "Manage Family" from dashboard
2. View existing family members
3. Click "Add Family Member"
4. Fill in:
   - Name
   - Relationship (Spouse, Child, Parent, etc.)
   - Date of Birth (optional)
   - Nakshatra (optional)
5. Click "Save"

**Expected Results:**
- Family member added to list
- Member appears on membership pass
- Up to 4 children can be added

---

### TC-MEM-08: Browse Events

**Steps:**
1. Click "Events" from dashboard or navigation
2. Browse the event listings

**Expected Results:**
- Upcoming events displayed
- Each event shows:
  - Event name and image
  - Date and time
  - Location
  - Description
  - Member price
  - Available capacity
- Category filter works (Festival, Puja, Educational, etc.)

---

### TC-MEM-09: Register for Event

**Steps:**
1. Navigate to Events page
2. Find an available event
3. Click "Register Now"

**Expected Results:**
- Registration confirmed
- Button changes to "Cancel Registration"
- You appear in the registration count
- Confirmation message displayed

---

### TC-MEM-10: Cancel Event Registration

**Steps:**
1. Navigate to Events page
2. Find an event you're registered for
3. Click "Cancel Registration"
4. Confirm cancellation

**Expected Results:**
- Registration removed
- Button changes back to "Register Now"
- Registration count decreases
- Confirmation message displayed

---

### TC-MEM-11: Event at Capacity

**Steps:**
1. Navigate to Events page
2. Find an event that's at full capacity

**Expected Results:**
- "Event Full" button displayed (disabled)
- Cannot register for the event

---

### TC-MEM-12: Event Registration Closed

**Steps:**
1. Navigate to Events page
2. Find an event past its registration deadline

**Expected Results:**
- "Registration Closed" button displayed (disabled)
- Cannot register for the event

---

### TC-MEM-13: View Payment History

**Steps:**
1. Click "Payment History" from dashboard
2. Review your payments

**Expected Results:**
- Payment list displays with:
  - Payment date
  - Amount
  - Category (Membership, Donation, Service, Event)
  - Payment method
- Statistics section shows:
  - Total payments for year
  - Total amount paid
  - Tax-deductible donations

---

### TC-MEM-14: Filter Payments by Year

**Steps:**
1. On Payment History page
2. Select a different year from dropdown
3. Observe the list

**Expected Results:**
- List filters to show only selected year
- Statistics update for that year
- If no payments, empty state shown

---

### TC-MEM-15: Download Payment Receipt

**Steps:**
1. On Payment History page
2. Click "Download Receipt" on any payment
3. Check downloads folder

**Expected Results:**
- PDF receipt downloads
- Receipt contains:
  - HSNEF header and logo
  - Payment details
  - Receipt number
  - Tax ID for donations
  - Date and amount

---

### TC-MEM-16: Create Service Booking

**Steps:**
1. Click "Bookings" from navigation
2. Click "New Booking"
3. Select service type (e.g., Puja, Hall Rental)
4. Fill in:
   - Preferred date(s)
   - Time preference
   - Special requests/notes
   - Contact information
5. Click "Submit Request"

**Expected Results:**
- Booking request created
- Status: "Pending Approval"
- Confirmation message displayed
- Booking appears in your list

---

### TC-MEM-17: View Booking Status

**Steps:**
1. Navigate to Bookings page
2. Use status filter (All, Pending, Approved, etc.)
3. Click on a booking to view details

**Expected Results:**
- Booking list displays with status badges
- Filtering works correctly
- Details show all submitted information
- Status-specific messages shown

---

### TC-MEM-18: Pay for Approved Booking

**Prerequisites:** Have an approved booking

**Steps:**
1. Navigate to Bookings page
2. Find an approved booking
3. Click "Pay Now"
4. Enter payment details:
   - Card number: 4242 4242 4242 4242
   - Expiry: Any future date
   - CVV: Any 3 digits
5. Click "Pay"

**Expected Results:**
- Payment processed successfully
- Booking status changes to "Paid"
- Receipt generated
- Confirmation email sent

---

### TC-MEM-19: Renew Membership (Annual Member)

**Prerequisites:** Login as dev-mp+testannual@hsnef.org

**Steps:**
1. Click "Renew" from dashboard or navigate to /member/renew
2. Select new membership level (Annual or Lifetime)
3. Enter payment details (Stripe test card)
4. Click "Renew Membership"

**Expected Results:**
- Payment processed
- Membership extended/upgraded
- New expiration date shown
- Confirmation email sent

---

### TC-MEM-20: Upgrade to Lifetime

**Steps:**
1. Login as dev-mp+testannual@hsnef.org
2. Navigate to /member/renew
3. Select "Lifetime" membership
4. Confirm the $1,001 one-time payment
5. Enter payment details
6. Complete payment

**Expected Results:**
- Payment processed
- Membership changed to Lifetime
- No expiration date shown
- Confirmation email sent

---

### TC-MEM-21: Make a Donation

**Steps:**
1. Click "Donate" from dashboard
2. Select or enter donation amount
3. Choose donation purpose (if applicable)
4. Enter payment details
5. Complete donation

**Expected Results:**
- Donation processed
- Receipt generated (tax-deductible)
- Thank you message displayed
- Donation appears in payment history

---

### TC-MEM-22: Accept Updated Terms

**Prerequisites:** Manager has updated terms since your last acceptance

**Steps:**
1. Login to the portal
2. Terms modal appears automatically
3. Read the updated terms
4. Click "I Accept"

**Expected Results:**
- Modal closes
- Access to dashboard granted
- Acceptance recorded in system

---

### TC-MEM-23: Terms Acceptance Error (Escape Hatch)

**Steps:**
1. When terms modal appears
2. Click "I Accept" but simulate an error
3. Retry 3 times
4. After 3 failures, "Continue Anyway" option appears
5. Click "Continue Anyway"

**Expected Results:**
- Bypass recorded for admin review
- Access granted temporarily
- Admin notified of the issue

---

### TC-MEM-24: Pricing Comparison (Member vs Community)

**Steps:**
1. Login as dev-mp+testlifetime@hsnef.org
2. Navigate to Bookings > New Booking
3. Select a service, note the price
4. Logout
5. Login as dev-mp+testcommunity@hsnef.org
6. Navigate to Bookings > New Booking
7. Select the same service, note the price

**Expected Results:**
- test.lifetime (Lifetime member): Lower member pricing
- test.community (Community): Higher non-member pricing
- Price difference clearly visible

---

### TC-MEM-25: Logout

**Steps:**
1. Click your name/avatar in header
2. Click "Sign Out"

**Expected Results:**
- Logged out successfully
- Redirected to home or login page
- Cannot access protected pages

---

## Edge Cases

### EC-MEM-01: Expired Annual Membership
- Login as dev-mp+testannual@hsnef.org (if expired in test data)
- Dashboard shows "Membership Expired"
- Renewal prominently displayed
- Limited access until renewed

### EC-MEM-02: Community Member Limitations
- Login as dev-mp+testcommunity@hsnef.org
- Higher pricing on services
- May not have full membership pass
- Upgrade prompts displayed

### EC-MEM-03: Test Account Visibility
- All test transactions excluded from:
  - Dashboard metrics
  - Financial reports
  - Member counts
- Staff can see test accounts with "TEST" badge

---

## Mobile Testing Checklist

- [ ] Dashboard renders correctly on mobile
- [ ] Membership pass is readable on mobile
- [ ] QR code scannable from mobile display
- [ ] Forms are usable with mobile keyboard
- [ ] Navigation menu works (hamburger menu)
- [ ] Payment forms work on mobile

---

## Clean Test Data

After testing, staff can clean all test transactions:
1. Login as dev-mp+testmanager@hsnef.org
2. Navigate to /admin/test-accounts
3. Click "Clean Test Data"
4. All test payments, bookings, registrations removed
5. Member records remain for future testing

---

## Reporting Issues

When reporting bugs, include:
1. Test case ID (e.g., TC-MEM-05)
2. Test account used (e.g., dev-mp+testlifetime@hsnef.org)
3. Steps to reproduce
4. Expected vs actual behavior
5. Screenshots if applicable

**Contact:** info@hsnef.org
