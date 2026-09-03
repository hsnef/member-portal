# Portal Settings Guide

> ### ⚠️ What `enable_traditional_login` actually does
>
> Verified against the code 2026-09-03. **The setting does not enable password
> sign-in.** The login page has no password field under any setting — it calls
> only `signInWithOtp` (magic link) and `signInWithOAuth` (Google).
>
> What the flag really controls is one line on the login page
> (`components/auth/LoginView.tsx`, gated on `showTraditionalLogin`):
> *"Existing member without portal access? **Create a portal account**"* — a link
> to `/register`.
>
> `/register` does call `supabase.auth.signUp` with a password, so an account
> gets one. **Nothing can then use it to sign in.** Read "traditional login"
> below as "the registration link is visible", not "password login works".
>
> The setting is misleadingly named; renaming it is a code change and has not
> been made.

## Overview

The HSNEF Member Portal includes flexible configuration settings that allow administrators to customize authentication methods and member registration workflows. All settings can be managed through the admin portal at `/admin/portal-settings`.

---

## 🔧 Available Settings

### **1. Enable Traditional Login**

**Category:** Authentication
**Default:** OFF (Disabled)
**Setting Key:** `enable_traditional_login`

#### What It Does:
Controls whether users can register and login using traditional email/password authentication.

#### When Enabled:
- `/register` page is accessible
- Users can create accounts with email and password
- Login page shows "Create portal account" link
- Useful for users who prefer traditional authentication

#### When Disabled (Default):
- `/register` page shows "Traditional Registration Disabled" message
- Automatically redirects to `/login` after 3 seconds
- Only Magic Link and Google OAuth are available
- Simpler user experience with fewer authentication choices

#### Recommended For:
- **Enabled:** If users prefer passwords or have security policies requiring password-based auth
- **Disabled (Default):** Simpler workflow, no passwords to forget, more secure

---

### **2. Require Office Approval**

**Category:** Membership Registration
**Default:** OFF (Auto-Approval Enabled)
**Setting Key:** `require_member_approval`

#### What It Does:
Controls whether new member applications via `/join` require office review before creating member records.

#### When Enabled:
- Applications submitted to `pending_member_registrations` table
- Office staff reviews at `/admin/pending-registrations`
- Staff manually approves/rejects each application
- Staff assigns membership ID upon approval
- More control over member onboarding

#### When Disabled (Default - Auto-Approval):
- Applications create member records immediately
- Membership ID generated automatically (format: X9999900)
- Member can immediately register for portal access
- Success message includes membership ID
- Faster onboarding, less office workload

#### Recommended For:
- **Enabled:** When you need to verify applications, collect payment before approval, or maintain strict control
- **Disabled (Default):** Open membership drives, trusted referrals, or when you want instant member onboarding

---

### **3. Organization Settings**

**Category:** General
**Type:** Text Fields

These settings customize the organization information displayed throughout the portal:

- **Organization Name** - Default: "HSNEF"
- **Organization Email** - Default: "info@hsnef.org"
- **Organization Phone** - Default: "(555) 123-4567"

---

## 🎯 Common Scenarios

### **Scenario 1: Simple Public Registration**
**Goal:** Anyone can join instantly, no barriers

**Settings:**
- **Enable Traditional Login:** OFF
- **Require Office Approval:** OFF (Auto-Approve)

**Flow:**
1. User goes to `/join`
2. Fills out application
3. Member record created immediately
4. User receives membership ID
5. User goes to `/login`
6. Uses Magic Link to access portal

**Best For:** Community organizations, open membership models

---

### **Scenario 2: Controlled Membership**
**Goal:** Office reviews every application

**Settings:**
- **Enable Traditional Login:** OFF
- **Require Office Approval:** ON

**Flow:**
1. User goes to `/join`
2. Fills out application
3. Application saved as "Pending"
4. Office reviews at `/admin/pending-registrations`
5. Office approves → Member record created
6. Office sends welcome email
7. User goes to `/login`
8. Uses Magic Link to access portal

**Best For:** Exclusive organizations, paid memberships requiring verification

---

### **Scenario 3: Traditional with Approval**
**Goal:** Password login + office review

**Settings:**
- **Enable Traditional Login:** ON
- **Require Office Approval:** ON

**Flow:**
1. User goes to `/join`
2. Fills out application
3. Application saved as "Pending"
4. Office reviews and approves
5. Office sends welcome email with instructions
6. User goes to `/register`
7. Creates account with email/password
8. Can now login with credentials

**Best For:** Organizations with users who prefer passwords

---

### **Scenario 4: Open with Password Option**
**Goal:** Instant join, but allow password login

**Settings:**
- **Enable Traditional Login:** ON
- **Require Office Approval:** OFF (Auto-Approve)

**Flow:**
1. User goes to `/join`
2. Fills out application
3. Member record created immediately
4. User can choose: `/register` for password OR `/login` for magic link
5. User logs in

**Best For:** Maximum flexibility for users

---

## 📋 How to Change Settings

### **Step 1: Access Portal Settings**
1. Login as Office Manager or Admin
2. Go to `/admin/settings`
3. Click on "Portal Settings" card
4. You'll see all configuration options

### **Step 2: Toggle Boolean Settings**
- Click the toggle switch to enable/disable
- Green = Enabled, Gray = Disabled
- Changes save immediately
- Test in incognito window to verify

### **Step 3: Update Text Settings**
- Click in the text field
- Edit the value
- Click outside the field (blur) to save
- Changes apply immediately

---

## 🔄 Registration Flow Diagrams

### **Flow with Auto-Approval (Default)**

```
Prospect
  ↓
Goes to /join
  ↓
Fills application form
  ↓
Submits
  ↓
✅ Member record created immediately
✅ Membership ID: X9999900 generated
✅ Success message with ID shown
  ↓
Goes to /login
  ↓
Uses Magic Link or Google
  ↓
Logged into portal
```

### **Flow with Office Approval**

```
Prospect
  ↓
Goes to /join
  ↓
Fills application form
  ↓
Submits
  ↓
Application saved as "Pending"
✉️ "We'll review within 2-3 days" message
  ↓
Office Staff
  ↓
Goes to /admin/pending-registrations
  ↓
Reviews application
  ↓
Clicks "Approve"
  ↓
✅ Member record created
✅ Membership ID assigned
✉️ Office emails welcome message
  ↓
New Member
  ↓
Goes to /login
  ↓
Uses Magic Link or Google
  ↓
Logged into portal
```

---

## 🔒 Access Control

### **Who Can Change Settings:**
- **Admin** - Full access
- **Office Manager** - Full access
- **Office Staff** - No access (read-only)
- **Members** - No access

### **RLS Policies:**
```sql
-- Anyone can READ settings (to check if features are enabled)
SELECT * FROM portal_settings;  -- Works for everyone

-- Only Admin/Office Manager can UPDATE
UPDATE portal_settings ...;  -- Requires Admin or Office Manager role
```

---

## 🧪 Testing Settings

### **Test Traditional Login Setting:**

**When Enabled:**
1. Open incognito window
2. Go to `/register`
3. Should see registration form
4. Go to `/login`
5. Should see "Create portal account" link

**When Disabled:**
1. Open incognito window
2. Go to `/register`
3. Should see "Traditional Registration Disabled" message
4. Should redirect to `/login` after 3 seconds
5. `/login` should NOT show "Create portal account" link

---

### **Test Auto-Approval Setting:**

**When Enabled (Approval Required):**
1. Open incognito window
2. Go to `/join`
3. Submit application
4. Should see "We'll review within 2-3 days"
5. Check `pending_member_registrations` table
6. Record should exist with status = 'Pending'
7. No member record should be created yet

**When Disabled (Auto-Approve):**
1. Open incognito window
2. Go to `/join`
3. Submit application
4. Should see "Congratulations! Your Membership ID is..."
5. Check `members` table
6. Member record should exist immediately
7. Check `pending_member_registrations` table
8. No record should be created

---

## 📊 Database Structure

### **portal_settings Table**

```sql
CREATE TABLE portal_settings (
  id UUID PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  setting_type TEXT NOT NULL,  -- 'boolean', 'string', 'number', 'json'
  display_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,      -- 'authentication', 'registration', 'general'
  updated_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### **Setting Value Formats**

**Boolean:**
```json
{
  "enabled": true
}
```

**String/Number:**
```json
{
  "value": "HSNEF"
}
```

---

## 🚨 Common Issues

### **Issue: Changes don't take effect**
**Solution:**
- Clear browser cache
- Test in incognito/private window
- Check browser console for errors
- Verify setting saved in database

### **Issue: Setting toggle doesn't work**
**Solution:**
- Check user has Admin or Office Manager role
- Verify RLS policies allow UPDATE
- Check browser console for errors
- Refresh page and try again

### **Issue: Can't access portal settings page**
**Solution:**
- Verify logged in as Admin or Office Manager
- Check `user_roles` table for correct role
- Verify RLS policies allow SELECT on portal_settings

---

## 📈 Monitoring & Analytics

### **Track Setting Changes:**
```sql
-- View setting update history
SELECT
  setting_key,
  setting_value,
  updated_by,
  updated_at
FROM portal_settings
ORDER BY updated_at DESC;
```

### **Check Who Changed Settings:**
```sql
-- See who last updated settings
SELECT
  ps.setting_key,
  ps.display_name,
  m.first_name,
  m.last_name,
  ps.updated_at
FROM portal_settings ps
LEFT JOIN members m ON ps.updated_by = m.auth_user_id
WHERE ps.updated_at IS NOT NULL
ORDER BY ps.updated_at DESC;
```

---

## 🎓 Best Practices

### **For Administrators:**
1. ✅ Test setting changes in staging/dev first
2. ✅ Announce changes to members before applying
3. ✅ Document why you changed a setting
4. ✅ Test in incognito window after changes
5. ✅ Monitor application submissions after enabling auto-approve

### **For Development:**
1. ✅ Always read settings via utility functions
2. ✅ Cache settings appropriately
3. ✅ Don't hard-code feature flags
4. ✅ Use setting keys as constants
5. ✅ Add new settings to migration

### **For Security:**
1. ✅ Limit access to Admin and Office Manager only
2. ✅ Audit setting changes regularly
3. ✅ Never expose admin API keys in settings
4. ✅ Validate setting values before saving

---

## 🔄 Adding New Settings

To add a new portal setting:

### **1. Add to Migration:**
```sql
INSERT INTO portal_settings (
  setting_key,
  setting_value,
  setting_type,
  display_name,
  description,
  category
) VALUES (
  'new_feature_enabled',
  '{"enabled": false}'::jsonb,
  'boolean',
  'Enable New Feature',
  'Description of what this setting does',
  'general'
);
```

### **2. Add to Utility Functions:**
```typescript
// In lib/utils/portalSettings.ts
export async function isNewFeatureEnabled(): Promise<boolean> {
  const value = await getSettingValue('new_feature_enabled')
  return value === true
}
```

### **3. Use in Components:**
```typescript
import { isNewFeatureEnabled } from '@/lib/utils/portalSettings'

const [featureEnabled, setFeatureEnabled] = useState(false)

useEffect(() => {
  async function checkFeature() {
    const enabled = await isNewFeatureEnabled()
    setFeatureEnabled(enabled)
  }
  checkFeature()
}, [])
```

---

## ✅ Quick Reference

| Setting | Default | Purpose |
|---------|---------|---------|
| Enable Traditional Login | OFF | Allow email/password registration |
| Require Office Approval | OFF | Require staff review of applications |
| Organization Name | HSNEF | Display name throughout portal |
| Organization Email | info@hsnef.org | Contact email |
| Organization Phone | (555) 123-4567 | Contact phone |

**Access:** `/admin/portal-settings`

**Required Role:** Admin or Office Manager

**Changes:** Take effect immediately

---

**Last Updated:** 2026-01-08
