# HSNEF Member Portal - Quick Start Testing Guide

**For Testers at dev.member.hsnef.org**

---

## Getting Started

### Step 1: Access the Portal

Open your browser and go to: **https://dev.member.hsnef.org**

---

## Test Account Credentials

> ### ⚠️ Sign-in is magic link or Google — there is no password login
>
> The login page offers exactly two options: **"Email me a sign-in link"**
> (Supabase `signInWithOtp`) and **Sign in with Google** (`signInWithOAuth`).
> It says so on the page: *"Sign in with your email — no password to remember."*
>
> Registration no longer sets a password (changed 2026-09-03); `/register` is now a
> page explaining how to sign in. There is no "Forgot password" link either. Any test case below that
> asks you to sign in with a password cannot pass, and is marked N/A.
>
> Verified against the code 2026-09-03: `signInWithPassword` appears only inside
> `loginWithMembershipNumber()` in `lib/auth/helpers.ts`, which nothing calls.

All test accounts sign in with **"Email me a sign-in link"**. There are no
passwords to request — see the note above. You need access to the inbox for the
address you are testing with; they are `+` aliases of `dev-mp@hsnef.org`.

| Account Type | Email | What to Test |
|--------------|-------|--------------|
| **Test Admin** | dev-mp+testadmin@hsnef.org | Full admin features, settings, all permissions |
| **Office Manager** | dev-mp+testmanager@hsnef.org | Staff management, approvals, reports |
| **Office Staff** | dev-mp+teststaff@hsnef.org | Day-to-day staff features |
| **Lifetime Member** | dev-mp+testlifetime@hsnef.org | Member pricing, no renewal needed |
| **Annual Member** | dev-mp+testannual@hsnef.org | Annual pricing, renewal flow |
| **Community Member** | dev-mp+testcommunity@hsnef.org | Higher (non-member) pricing |

**Note:** All these emails are delivered to devmp@hsnef.org (using email + addressing).

**IMPORTANT:** Always use these test accounts for testing. Data created by or for these accounts can be easily cleaned up. If you register with your own email, that data cannot be automatically cleaned.

---

## Testing Scenarios

### Scenario 1: New User Registration (Fresh Experience)

Test the complete registration flow:

1. Go to https://dev.member.hsnef.org
2. Click **"Sign Up"** or **"Register"**
3. Try registering with your own email (or a test email)
4. Complete the registration form
5. Check your email for verification (if required)
6. Login and complete your profile

**What to look for:**
- Is the registration form clear and easy to use?
- Are error messages helpful?
- Does email verification work?

---

### Scenario 2: Login Methods

Test different ways to login:

1. **Magic link (the normal path):**
   - Go to https://dev.member.hsnef.org/login
   - Enter the test account email
   - Click "Email me a sign-in link", then open the link in the inbox

2. **Google Sign-In:**
   - Click "Sign in with Google"
   - Use your Google account
   - Note: First time may require linking to existing member record

**What to look for:**
- Do both login methods work smoothly?
- Are error messages clear if something goes wrong?

---

### Scenario 3: Member Dashboard (Main Experience)

After logging in as a member, explore the dashboard:

1. **Login** using: `dev-mp+testlifetime@hsnef.org`

2. **Dashboard Overview** - Look at:
   - [ ] Member name and greeting
   - [ ] Membership status (Lifetime, Annual, etc.)
   - [ ] Membership validity/expiry date
   - [ ] Quick action cards/buttons

3. **Membership Pass** - Find and test:
   - [ ] View your digital membership pass
   - [ ] QR code is visible and scannable
   - [ ] Member photo (if uploaded)
   - [ ] Membership ID number
   - [ ] Print/Download pass option

**What to look for:**
- Is the dashboard welcoming and easy to understand?
- Is important information visible at a glance?
- Does the QR code generate correctly?

---

### Scenario 4: Profile & Personal Information

Test viewing and editing member information:

1. Navigate to **Profile** or **My Information**

2. **View Personal Information:**
   - [ ] Full name
   - [ ] Email address
   - [ ] Phone number
   - [ ] Address
   - [ ] Date of birth
   - [ ] Photo

3. **Edit Information:**
   - [ ] Try editing some fields
   - [ ] Save changes
   - [ ] Verify changes are saved

**What to look for:**
- Can you easily view all your information?
- Can you edit and save changes?
- Are required fields clearly marked?

---

### Scenario 5: Family Members

Test managing family member information:

1. Navigate to **Family** or **Family Members**

2. **View Family Members:**
   - [ ] Spouse information
   - [ ] Children information

3. **Add Family Member:**
   - [ ] Click "Add Family Member" or similar
   - [ ] Fill in details (name, relationship, DOB)
   - [ ] Save

4. **Edit Family Member:**
   - [ ] Select an existing family member
   - [ ] Edit their information
   - [ ] Save changes

**What to look for:**
- Is it easy to add/edit family members?
- Are all family relationships supported?
- Is children's information properly captured?

---

### Scenario 6: Services and Bookings

Test booking temple services:

1. Navigate to **Services** or **Book a Service**

2. **Browse Services:**
   - [ ] View list of available services
   - [ ] See service descriptions
   - [ ] See pricing (member vs non-member rates)

3. **Create a Booking:**
   - [ ] Select a service
   - [ ] Choose date/time
   - [ ] Select location (Temple or External)
   - [ ] Add to cart
   - [ ] Review booking summary
   - [ ] Submit booking request

4. **Check Booking Status:**
   - [ ] Go to "My Bookings"
   - [ ] See pending/approved/completed bookings
   - [ ] Check booking details

**What to look for:**
- Are service prices correct for your membership level?
- Is the booking process clear?
- Can you track your booking status?

---

### Scenario 7: Events

Test event registration:

1. Navigate to **Events**

2. **Browse Events:**
   - [ ] View upcoming events
   - [ ] See event details (date, time, location, description)
   - [ ] See capacity/availability

3. **Register for Event:**
   - [ ] Click on an event
   - [ ] Select number of attendees
   - [ ] Complete registration
   - [ ] Receive confirmation

4. **Manage Registrations:**
   - [ ] View your registered events
   - [ ] Cancel a registration (if needed)

**What to look for:**
- Are events easy to find and understand?
- Is registration straightforward?
- Can you manage your registrations?

---

### Scenario 8: Payments & Donations

Test payment functionality:

1. **Make a Donation:**
   - [ ] Navigate to "Donate"
   - [ ] Enter donation amount
   - [ ] Choose donation category
   - [ ] Complete payment (use test card if in test mode)
   - [ ] Receive receipt

2. **View Payment History:**
   - [ ] Navigate to "Payments" or "Payment History"
   - [ ] See list of all payments
   - [ ] Download/view receipts

**Test Card (for Stripe test mode):**
- Card Number: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., `12/25`)
- CVC: Any 3 digits (e.g., `123`)

**What to look for:**
- Is the payment process smooth?
- Do you receive proper receipts?
- Is payment history accurate?

---

### Scenario 9: Membership Renewal (Annual Members)

Test renewal for annual memberships:

1. **Login** as: `dev-mp+testannual@hsnef.org`

2. Navigate to **Renew** or **Membership Renewal**

3. **Renew Membership:**
   - [ ] See current membership status
   - [ ] See renewal pricing
   - [ ] Complete renewal payment
   - [ ] Verify new expiry date

**What to look for:**
- Is the renewal process clear?
- Are prices correct?
- Does the expiry date update after renewal?

---

### Scenario 10: Membership Pass with QR Code

This is a key visual feature to test thoroughly:

1. Navigate to **Membership Pass** or find it on the Dashboard

2. **Check Pass Details:**
   - [ ] Temple logo visible
   - [ ] Member name correct
   - [ ] Membership ID displayed
   - [ ] Membership level shown (Lifetime/Annual)
   - [ ] Validity dates shown
   - [ ] Member photo (if uploaded)
   - [ ] **QR Code visible and clear**

3. **Print/Download:**
   - [ ] Try printing the pass
   - [ ] Try downloading as image/PDF

4. **QR Code Test:**
   - [ ] Use a QR code scanner app on your phone
   - [ ] Scan the QR code
   - [ ] Verify it contains correct member information

**What to look for:**
- Does the pass look professional?
- Is all information accurate?
- Is the QR code scannable?
- Does print/download work?

---

### Scenario 11: Admin Features (Test Admin Account)

Test admin functionality using the test Admin account:

1. **Login** as: `dev-mp+testadmin@hsnef.org`

2. **Dashboard Overview:**
   - [ ] View admin dashboard with statistics
   - [ ] See member counts, recent activity
   - [ ] Check quick action buttons

3. **Member Management:**
   - [ ] Navigate to "Members" list
   - [ ] Search for a member
   - [ ] View member details
   - [ ] Edit member information
   - [ ] Add notes to a member

4. **Event Management:**
   - [ ] Create a new event
   - [ ] Edit an existing event
   - [ ] View event registrations
   - [ ] (Events created here will be cleaned with "Clean Test Data")

5. **Booking Approvals:**
   - [ ] View pending service bookings
   - [ ] Approve or reject a booking
   - [ ] Record a payment

6. **Payment Recording:**
   - [ ] Record an offline payment (check, cash)
   - [ ] View payment reports
   - [ ] Download receipts

7. **Reports & Activity:**
   - [ ] View activity log
   - [ ] Check audit trail
   - [ ] Export data if available

8. **Staff Role Management (Admin Only):**
   - [ ] Go to Settings > Staff Role Management
   - [ ] View current staff members with roles
   - [ ] Search for a test member (e.g., testmanager)
   - [ ] Assign a role to the member
   - [ ] Verify the role appears in the list
   - [ ] Test removing a role

**What to look for:**
- Are admin controls intuitive?
- Do approvals work correctly?
- Are reports accurate?
- Can you easily assign/remove roles without SQL?

---

## Reporting Issues

When you find an issue, please note:

1. **What you were trying to do** (step by step)
2. **What happened** (the actual result)
3. **What you expected** (the expected result)
4. **Screenshots** (if possible)
5. **Which test account** you were using

Send feedback to: devmp@hsnef.org

---

## Quick Reference: Key Pages

### Member Pages

| Page | URL | Description |
|------|-----|-------------|
| Home | / | Landing page |
| Login | /login | Sign in page |
| Register | /register | New user registration |
| Dashboard | /member | Member home page |
| Profile | /member/profile | View/edit personal info |
| Family | /member/family | Manage family members |
| Payments | /member/payments | Payment history |
| Events | /member/events | Event registration |
| Services | /member/bookings | Service bookings |
| Donate | /member/donate | Make donations |
| Renew | /member/renew | Membership renewal |

### Admin Pages (requires Admin/Staff login)

| Page | URL | Description |
|------|-----|-------------|
| Admin Dashboard | /admin | Admin home with statistics |
| Members | /admin/members | Member list and search |
| Events | /admin/events | Event management |
| Bookings | /admin/bookings | Service booking approvals |
| Payments | /admin/payments | Payment management |
| Test Accounts | /admin/test-accounts | Manage test accounts, clean test data |
| Settings | /admin/settings | Portal settings |
| Staff Roles | /admin/settings/staff-roles | Assign/manage staff roles (Admin only) |

---

## Tips for Testers

1. **Test on different devices** - Try on phone, tablet, and desktop
2. **Test different browsers** - Chrome, Safari, Firefox, Edge
3. **Try to break things** - Enter invalid data, skip steps, etc.
4. **Note confusing areas** - If something isn't clear, it's worth noting
5. **Check visual appearance** - Fonts, colors, spacing, alignment
6. **Test error handling** - What happens when things go wrong?

---

## Important Notes

- This is a TEST environment connected to the PRODUCTION database
- Test data can be cleared by the admin without affecting real members
- Test accounts are specially marked and filtered from real statistics
- Feel free to create test bookings, payments, etc. - they can be cleaned up

---

**Thank you for helping test the HSNEF Member Portal!**

*Your feedback helps make the portal better for all members.*
