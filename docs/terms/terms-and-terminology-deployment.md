# Terms of Use & Terminology Update - Deployment Guide

## 🎉 Implementation Complete!

This guide covers the deployment and testing of the Terms of Use system and updated terminology ("Magic Link" → "Email Me a Link to Login").

---

## 📋 What Was Implemented

### **1. Terms of Use System**

#### **Database (3 Migrations)**
- **Migration 8:** `20260108000008_terms_system.sql`
  - `terms_content` table - Versioned terms storage
  - `terms_acceptances` table - Tracks acceptances with IP, user agent, timestamp
  - RLS policies for public viewing, authenticated acceptance
  - Initial terms content (version 1.0) loaded from your reference file

- **Migration 9:** `20260108000009_add_terms_to_pending.sql`
  - Added terms tracking fields to `pending_member_registrations`
  - Stores acceptance info for applicants awaiting approval

#### **Backend/API**
- **Terms Service:** `lib/utils/termsService.ts`
  - Get active terms
  - Check acceptance status
  - Record acceptance (with server-side IP)
  - Admin functions for version management

- **API Route:** `app/api/accept-terms/route.ts`
  - Records terms acceptance with accurate server-side IP address
  - Captures user agent from request headers
  - Links to member and auth user records

#### **UI Components**
- **Terms Page:** `app/terms/page.tsx`
  - Public-facing terms display
  - Markdown rendering with react-markdown
  - Print functionality
  - Responsive layout

- **Terms Checkbox:** `components/TermsCheckbox.tsx`
  - Reusable component with proper formatting
  - Required field indicator
  - Opens terms in new tab

- **Terms Acceptance Modal:** `components/TermsAcceptanceModal.tsx`
  - Modal overlay for first-login enforcement
  - Cannot be dismissed until accepted
  - Scrollable terms content
  - Records acceptance via server API

#### **Integration Points**
- **`/join` Page:**
  - Terms checkbox before submit
  - Validates acceptance before submission
  - Records acceptance for auto-approved members
  - Stores acceptance flag for pending approvals

- **`/register` Page:**
  - Terms checkbox before submit (only shown if traditional login enabled)
  - Validates acceptance
  - Records acceptance during registration

- **PortalShell** (`components/layout/PortalShell.tsx`):
  - TermsAcceptanceModal rendered here
  - Automatically checks on mount; renders nothing once accepted
  - Blocks portal access until terms accepted
  - _Was `components/admin/AdminLayout.tsx`, which covered only `/admin`.
    PortalShell replaced it in the 2026-08 design-system port and now covers
    both `/member` and `/admin`._

### **2. Terminology Updates**

Updated throughout the application:
- "Send Magic Link" → "Email Me a Link to Login"
- "Check your email for the magic link" → "Check your email for the login link!"
- "Use the Magic Link" → "Use Email Login Link"
- Comments updated from "Magic Link Form" → "Email Login Form"

**Files Updated:**
- `app/login/page.tsx` - All button text, messages, and help text

---

## 🚀 Deployment Steps

### **Step 1: Run Database Migrations**

```bash
# Navigate to project directory
cd C:\Repos\personal_gsujit\gsujit_hsnef\member-portal

# Run all pending migrations
supabase db push

# OR run individually:
supabase migration up --include 20260108000008_terms_system.sql
supabase migration up --include 20260108000009_add_terms_to_pending.sql
```

### **Step 2: Verify Database Setup**

```sql
-- 1. Check terms_content table and initial data
SELECT * FROM terms_content WHERE is_active = true;

-- Should return:
-- version: 1.0
-- title: HSNEF Membership Portal - Terms of Use
-- is_active: true

-- 2. Check terms_acceptances table structure
\d terms_acceptances

-- 3. Check RLS policies
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename IN ('terms_content', 'terms_acceptances');

-- 4. Check pending_member_registrations has new fields
\d pending_member_registrations
-- Should show: terms_accepted, terms_version, terms_content_id
```

### **Step 3: Install Dependencies**

```bash
# react-markdown was already installed during implementation
npm install
```

### **Step 4: Build and Test**

```bash
# Run development server
npm run dev

# Open browser to http://localhost:3000
```

---

## 🧪 Testing Checklist

### **Test 1: Terms Page (`/terms`)**

- [ ] Navigate to `http://localhost:3000/terms`
- [ ] Terms display correctly in formatted markdown
- [ ] Version and effective date shown
- [ ] Back button works
- [ ] Print button works
- [ ] Links open in new tab
- [ ] Responsive on mobile

### **Test 2: Public Member Registration (`/join`)**

**With Auto-Approval ON (Default):**

1. **Navigate to `/join`**
2. **Fill out registration form**
3. **Scroll to bottom - verify terms checkbox appears**
   - [ ] Checkbox with text: "I have read and agree to the [HSNEF Membership Portal Terms of Use](/terms)."
   - [ ] Link opens `/terms` in new tab
   - [ ] Submit button disabled until checkbox checked

4. **Try to submit without checking**
   - [ ] Shows error: "You must accept the Terms of Use to continue"

5. **Check the box and submit**
   - [ ] Application submits successfully
   - [ ] Member record created
   - [ ] Success message shows membership ID

6. **Verify in database:**
   ```sql
   SELECT
     m.membership_id,
     m.primary_email,
     ta.terms_version,
     ta.accepted_at,
     ta.ip_address,
     ta.acceptance_method
   FROM members m
   LEFT JOIN terms_acceptances ta ON ta.member_id = m.id
   WHERE m.primary_email = 'test@example.com'
   ORDER BY m.created_at DESC
   LIMIT 1;
   ```
   - [ ] Acceptance record exists
   - [ ] `acceptance_method` = 'registration'
   - [ ] IP address captured
   - [ ] User agent captured

**With Approval Required ON:**

1. **Enable in `/admin/portal-settings`:**
   - Toggle "Require Office Approval" ON

2. **Submit another application**
3. **Verify in database:**
   ```sql
   SELECT
     primary_email,
     status,
     terms_accepted,
     terms_version,
     terms_content_id
   FROM pending_member_registrations
   ORDER BY submitted_at DESC
   LIMIT 1;
   ```
   - [ ] `terms_accepted` = true
   - [ ] `terms_version` = '1.0'
   - [ ] `terms_content_id` is set

### **Test 3: Traditional Registration (`/register`)**

**With Traditional Login ENABLED:**

1. **Enable in `/admin/portal-settings`:**
   - Toggle "Enable Traditional Login" ON

2. **Navigate to `/register`**
3. **Fill out email/password form**
4. **Verify terms checkbox appears**
   - [ ] Checkbox shown before submit button
   - [ ] Submit button disabled until checked

5. **Try to submit without checking**
   - [ ] Shows error: "You must accept the Terms of Use to continue"

6. **Check box and submit**
   - [ ] Account created successfully
   - [ ] Member linked

7. **Verify acceptance recorded:**
   ```sql
   SELECT
     m.membership_id,
     m.auth_user_id,
     ta.terms_version,
     ta.accepted_at,
     ta.ip_address,
     ta.acceptance_method
   FROM members m
   JOIN terms_acceptances ta ON ta.member_id = m.id
   WHERE m.auth_user_id = 'YOUR_AUTH_USER_ID'
   ORDER BY ta.accepted_at DESC
   LIMIT 1;
   ```
   - [ ] Acceptance method = 'registration'
   - [ ] IP address captured

**With Traditional Login DISABLED (Default):**

1. **Disable in `/admin/portal-settings`**
2. **Navigate to `/register`**
3. **Verify redirects to `/login` with message**
   - [ ] Shows "Traditional Registration Disabled" message
   - [ ] Auto-redirects after 3 seconds

### **Test 4: First-Login Terms Enforcement**

**Test with member created via office (no prior acceptance):**

1. **Create member via SQL (simulating office entry):**
   ```sql
   INSERT INTO members (
     membership_id,
     first_name,
     last_name,
     primary_email,
     member_class,
     current_level
   ) VALUES (
     '30000100',
     'Test',
     'FirstLogin',
     'firstlogin@test.com',
     'Personal',
     'Community'
   );
   ```

2. **Login as that member:**
   - Go to `/login`
   - Use "Email Me a Link to Login" with `firstlogin@test.com`
   - Click link in email

3. **Verify modal appears:**
   - [ ] Modal overlay appears (cannot click outside)
   - [ ] Shows full terms content
   - [ ] Checkbox: "I have read and agree to..."
   - [ ] "Accept and Continue" button disabled until checked
   - [ ] Error shown if trying to proceed without checking

4. **Accept terms:**
   - [ ] Check the box
   - [ ] Click "Accept and Continue"
   - [ ] Modal closes
   - [ ] Can access portal normally

5. **Verify acceptance recorded:**
   ```sql
   SELECT * FROM terms_acceptances
   WHERE member_id = (SELECT id FROM members WHERE membership_id = '30000100')
   ORDER BY accepted_at DESC
   LIMIT 1;
   ```
   - [ ] `acceptance_method` = 'first_login'
   - [ ] IP address captured
   - [ ] User agent captured

6. **Logout and login again:**
   - [ ] Modal does NOT appear (already accepted)

### **Test 5: Terminology Updates**

**Login Page:**

1. **Navigate to `/login`**
2. **Verify button text:**
   - [ ] Button says "Email Me a Link to Login" (not "Send Magic Link")

3. **Submit email:**
   - [ ] Success message: "Check your email for the login link!" (not "magic link")

4. **Check help text:**
   - [ ] Says "Use Email Login Link or Google Sign-In" (not "Magic Link")

### **Test 6: Admin Portal Access**

**Test authenticated user with acceptance:**

1. **Login as Office Manager** (dev-mp+testmanager@hsnef.org)
2. **Navigate to any admin page** (`/admin/members`, `/admin/settings`, etc.)
3. **Verify:**
   - [ ] Modal does NOT appear if already accepted
   - [ ] Portal loads normally

**Test authenticated user without acceptance:**

1. **Use member from Test 4** (firstlogin@test.com)
2. **Clear their acceptance:**
   ```sql
   DELETE FROM terms_acceptances
   WHERE member_id = (SELECT id FROM members WHERE primary_email = 'firstlogin@test.com');
   ```

3. **Login and navigate to dashboard:**
   - [ ] Modal appears immediately
   - [ ] Cannot access portal without acceptance

### **Test 7: Terms Versioning (Future)**

**When you update terms:**

1. **Create new version in database:**
   ```sql
   -- Deactivate current version
   UPDATE terms_content SET is_active = false WHERE version = '1.0';

   -- Insert new version
   INSERT INTO terms_content (
     version,
     title,
     content,
     content_format,
     is_active,
     effective_date
   ) VALUES (
     '2.0',
     'HSNEF Membership Portal - Terms of Use',
     'Updated terms content here...',
     'markdown',
     true,
     CURRENT_DATE
   );
   ```

2. **Test:**
   - [ ] All users see modal on next login (even if previously accepted v1.0)
   - [ ] New acceptance recorded with version = '2.0'

---

## 📊 Monitoring Queries

### **Acceptance Statistics**

```sql
-- Total acceptances by method
SELECT
  acceptance_method,
  COUNT(*) as count
FROM terms_acceptances
GROUP BY acceptance_method
ORDER BY count DESC;

-- Recent acceptances
SELECT
  m.membership_id,
  m.first_name,
  m.last_name,
  ta.terms_version,
  ta.accepted_at,
  ta.acceptance_method,
  ta.ip_address
FROM terms_acceptances ta
JOIN members m ON ta.member_id = m.id
ORDER BY ta.accepted_at DESC
LIMIT 20;

-- Members without acceptance
SELECT
  m.membership_id,
  m.first_name,
  m.last_name,
  m.primary_email,
  m.created_at
FROM members m
LEFT JOIN terms_acceptances ta ON ta.member_id = m.id
WHERE ta.id IS NULL
  AND m.is_test_account = false
ORDER BY m.created_at DESC;

-- Acceptance rate
SELECT
  COUNT(DISTINCT m.id) as total_members,
  COUNT(DISTINCT ta.member_id) as members_accepted,
  ROUND(COUNT(DISTINCT ta.member_id) * 100.0 / COUNT(DISTINCT m.id), 2) as acceptance_rate_pct
FROM members m
LEFT JOIN terms_acceptances ta ON ta.member_id = m.id
WHERE m.is_test_account = false;
```

---

## 🔧 Troubleshooting

### **Issue: Modal doesn't appear**

**Possible causes:**
1. User already accepted current version
2. No active terms in database
3. Component not imported in layout

**Solution:**
```sql
-- Check active terms
SELECT * FROM terms_content WHERE is_active = true;

-- Check user acceptance
SELECT * FROM terms_acceptances
WHERE member_id = 'USER_MEMBER_ID'
ORDER BY accepted_at DESC;
```

### **Issue: IP address not captured**

**Possible cause:** API route not being used

**Solution:**
- Verify acceptance uses `/api/accept-terms` route (not direct database insert)
- Check browser console for API errors
- Verify server-side headers available

### **Issue: Terms checkbox not showing**

**Possible causes:**
1. TermsCheckbox component import failed
2. Traditional login disabled (`/register` only)

**Solution:**
- Check browser console for import errors
- Verify component file exists at `components/TermsCheckbox.tsx`
- For `/register`, check portal settings

### **Issue: "Traditional Registration Disabled" always shows**

**Cause:** `enable_traditional_login` setting is OFF

**Solution:**
```sql
-- Check setting
SELECT * FROM portal_settings WHERE setting_key = 'enable_traditional_login';

-- Enable if needed
UPDATE portal_settings
SET setting_value = '{"enabled": true}'::jsonb
WHERE setting_key = 'enable_traditional_login';
```

---

## 🎯 Next Steps (Optional Enhancements)

### **1. Admin Terms Management UI**

Create `/admin/terms-management` page to:
- View all terms versions
- Create new versions
- Set active version
- View acceptance statistics
- Export acceptance records

### **2. Email Notifications**

When terms updated:
- Email all active members
- Notify of new terms requiring acceptance
- Include link to `/terms` page

### **3. Acceptance History**

Add to member profile:
- Show all versions accepted
- Display acceptance dates
- Show IP addresses (for admins only)

### **4. Terms Change Log**

Track what changed between versions:
- Version comparison view
- Highlight differences
- Change summary

---

## ✅ Deployment Verification

After deployment, verify:

- [ ] All 3 migrations run successfully
- [ ] Terms page accessible at `/terms`
- [ ] Terms acceptance works on `/join`
- [ ] Terms acceptance works on `/register` (if enabled)
- [ ] First-login modal appears for users without acceptance
- [ ] Terminology updated on login page
- [ ] IP addresses being captured in database
- [ ] No console errors in browser
- [ ] Mobile responsive

---

## 📝 Summary of Files Changed/Created

### **Created:**
- `supabase/migrations/20260108000008_terms_system.sql`
- `supabase/migrations/20260108000009_add_terms_to_pending.sql`
- `lib/utils/termsService.ts`
- `app/api/accept-terms/route.ts`
- `app/terms/page.tsx`
- `components/TermsCheckbox.tsx`
- `components/TermsAcceptanceModal.tsx`
- `terms-and-terminology-deployment.md` (this file)

### **Modified:**
- `app/join/page.tsx` - Added terms checkbox, validation, acceptance recording
- `app/register/page.tsx` - Added terms checkbox, validation, acceptance recording
- `app/login/page.tsx` - Updated terminology throughout
- `components/admin/AdminLayout.tsx` - Added TermsAcceptanceModal
- `package.json` - Added react-markdown dependency

---

**Last Updated:** 2026-01-08
**Status:** ✅ Ready for Production Deployment
