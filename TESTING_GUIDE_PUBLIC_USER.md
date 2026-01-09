# HSNEF Member Portal - Public User Testing Guide

This guide is for testing the portal as an unauthenticated (public) user.

---

## Overview

Public users can:
- View the home page and temple information
- Login using various authentication methods
- Submit membership applications
- View terms of use
- Verify membership QR codes

---

## Test Environment

**Portal URL:** https://portal.hsnef.org (or http://localhost:3000 for development)

---

## Test Accounts Reference

While public user testing doesn't require login, you may need these for verification:

| Role | Email | MembershipID |
|------|-------|--------------|
| Manager | test.manager@example.com | 99991000 |
| Staff | test.staff@example.com | 99992000 |
| Lifetime Member | test.lifetime@example.com | 99993000 |
| Annual Member | test.annual@example.com | 99994000 |
| Community Member | test.community@example.com | 99995000 |

Test accounts use prefix `9` and are marked with a purple "TEST" badge.

---

## Test Cases

### TC-PUB-01: View Home Page

**Steps:**
1. Open browser and navigate to the portal URL
2. Observe the landing page

**Expected Results:**
- Temple branding and logo displayed
- Navigation menu visible
- Login/Join options prominently displayed
- Footer with version number visible

---

### TC-PUB-02: Login with Google OAuth

**Steps:**
1. Click "Sign in with Google" button
2. Select or enter your Google account credentials
3. Click "Allow" to authorize the application

**Expected Results:**
- Redirected to Google authentication page
- After authorization, redirected back to portal
- If email matches existing member: Dashboard displays
- If email not in system: Limited access or prompt to join

---

### TC-PUB-03: Login with Magic Link (Email)

**Steps:**
1. Click "Login" or navigate to /login
2. Enter your email address in the Magic Link field
3. Click "Send Magic Link"
4. Check your email inbox (and spam folder)
5. Click the link in the email

**Expected Results:**
- Confirmation message: "Check your email for the magic link"
- Email arrives within 1-2 minutes
- Clicking link logs you into the portal
- Redirected to member dashboard

---

### TC-PUB-04: Login with Email/Password (Traditional)

**Prerequisite:** Traditional login must be enabled in Portal Settings

**Steps:**
1. Navigate to /login
2. If visible, click "Use Email/Password" or similar toggle
3. Enter email address
4. Enter password
5. Click "Sign In"

**Expected Results:**
- If credentials valid: Redirected to dashboard
- If invalid: Error message displayed
- If account not found: Appropriate error message

---

### TC-PUB-05: Submit Membership Application (Personal)

**Steps:**
1. Navigate to /join
2. Select "Personal Membership"
3. Select membership level:
   - Community (Free)
   - Annual ($251/year)
   - Lifetime ($1,001 one-time)
4. Fill in required fields:
   - First Name
   - Last Name
   - Email Address
   - Phone Number
   - Street Address, City, State, ZIP
5. Optionally fill spouse/family information
6. Check "I accept the Terms of Use"
7. Click "Submit Application"

**Expected Results:**
- Form validates all required fields
- If approval required: "Application submitted for review" message
- If auto-approve: "Welcome! Your membership is active" message
- Confirmation email sent

**Validation Checks:**
- Email format must be valid
- Phone format must be valid
- ZIP code format must be valid
- All required fields must be filled

---

### TC-PUB-06: Submit Membership Application (Business)

**Steps:**
1. Navigate to /join
2. Select "Business Membership"
3. Select membership level (Annual or Lifetime)
4. Fill in required fields:
   - Business Name
   - Contact Person Name
   - Business Email
   - Business Phone
   - Business Address
5. Check "I accept the Terms of Use"
6. Click "Submit Application"

**Expected Results:**
- Form validates all required fields
- Application submitted message displayed
- Confirmation email sent to business email

---

### TC-PUB-07: View Terms of Use

**Steps:**
1. Navigate to /terms
2. Read the terms content
3. Note the version number and effective date

**Expected Results:**
- Full terms of use content displayed
- Version number shown (e.g., "Version 1.0")
- Effective date shown
- "Back" button functional
- Content formatted and readable

---

### TC-PUB-08: Print Terms of Use

**Steps:**
1. Navigate to /terms
2. Click "Print" button

**Expected Results:**
- Browser print dialog opens
- Terms formatted appropriately for printing
- Headers and footers included

---

### TC-PUB-09: Verify Membership QR Code

**Prerequisite:** Have a valid QR code from a test member's pass (e.g., test.lifetime@example.com)

**Steps:**
1. Scan a member's QR code with your phone camera
2. Or navigate to /verify-qr?token=[token-value]

**Expected Results:**
- Member verification page displays
- Shows: Member name, Membership level, Valid status
- Test accounts show "TEST" badge
- If invalid token: "Invalid or expired" message

---

### TC-PUB-10: Attempt to Access Protected Page

**Steps:**
1. Without logging in, navigate to /member
2. Or navigate to /admin

**Expected Results:**
- Redirected to /login page
- Message: "Please log in to continue"
- Original destination remembered for post-login redirect

---

### TC-PUB-11: Password Reset Request

**Steps:**
1. Navigate to /login
2. Click "Forgot Password?" link
3. Enter your email address
4. Click "Send Reset Link"

**Expected Results:**
- Confirmation: "Password reset email sent"
- Email arrives with reset link
- Link opens password reset form

---

### TC-PUB-12: Failed Login Attempts

**Steps:**
1. Navigate to /login
2. Enter a valid email
3. Enter an incorrect password
4. Click "Sign In"
5. Repeat 3 times with wrong password

**Expected Results:**
- Each attempt shows "Invalid credentials" error
- After multiple failures, may show additional security measures
- Account not locked (can still use magic link)

---

### TC-PUB-13: Register Existing Test Account

**Steps:**
1. Navigate to /register
2. Enter test.lifetime@example.com (or another test account email)
3. Create a password (e.g., "TestPassword123!")
4. Submit registration

**Expected Results:**
- System finds existing member record with that email
- Auth account created and linked to member record
- Redirected to member dashboard
- Member sees their test account data

---

## Common Error Scenarios

### Error: "Email already registered"
- **Cause:** Email already has an auth account
- **Solution:** Use login instead of registration, or use password reset

### Error: "Invalid email format"
- **Cause:** Email doesn't match expected format
- **Solution:** Correct the email address format

### Error: "Terms must be accepted"
- **Cause:** Terms checkbox not checked
- **Solution:** Check the "I accept the Terms of Use" checkbox

### Error: "Required field missing"
- **Cause:** A required field is empty
- **Solution:** Fill in all fields marked with *

### Error: "No member found with this email"
- **Cause:** Trying to register at /register with email not in database
- **Solution:** Use /join to submit a new membership application

---

## Browser Compatibility

Test on the following browsers:
- Google Chrome (latest)
- Mozilla Firefox (latest)
- Microsoft Edge (latest)
- Safari (latest, macOS/iOS)

---

## Mobile Testing

Test on mobile devices:
- iOS Safari
- Android Chrome
- Responsive design at various breakpoints

**Check:**
- Forms are usable on small screens
- Buttons are tap-friendly (minimum 44px)
- Text is readable without zooming
- Navigation menu works on mobile

---

## Accessibility Checks

- All form fields have labels
- Error messages are descriptive
- Color contrast meets WCAG standards
- Keyboard navigation works
- Screen reader compatible

---

## Reporting Issues

When reporting bugs, include:
1. Test case ID (e.g., TC-PUB-05)
2. Steps to reproduce
3. Expected vs actual behavior
4. Browser and version
5. Screenshots if applicable

**Contact:** info@hsnef.org
