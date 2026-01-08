# Member Registration Flow Guide

## Overview

The HSNEF Member Portal uses a **hybrid authentication system** that supports multiple login methods while ensuring all users are linked to actual member records in the database.

---

## 🔐 Authentication Methods

### 1. **Email/Password Registration (NEW)**
- Traditional registration with email and password
- Available at: `/register`
- Best for: Test accounts and members who prefer traditional login

### 2. **Google OAuth**
- "Sign in with Google" button
- One-click authentication
- Best for: Members with Google accounts

### 3. **Magic Link (Passwordless)**
- Email-based passwordless login
- Click link in email to sign in
- Best for: Quick access, no password to remember

---

## 📋 Complete Registration Flow

### **For New Users (First Time Registration)**

#### **Step 1: Member Record Must Exist**

Before anyone can register for portal access, they must have a member record in the database with their email address.

**How member records are created:**
- Manual entry by office staff via `/admin/members`
- CSV import via `/admin/members/import`
- Direct database insertion

**Required fields:**
- `primary_email` - Must match the email used for registration
- `membership_id` - Unique 8-digit ID
- Basic contact information

#### **Step 2: User Registers**

**Option A: Email/Password Registration**
1. User goes to `/register`
2. Enters their email (must match `primary_email` in members table)
3. Creates a password (min 8 characters)
4. System checks if member record exists
5. If found, creates Supabase Auth account
6. Links auth account to member record (`auth_user_id`)
7. **For test accounts:** Immediate access
8. **For real members:** Email verification required

**Option B: Google OAuth**
1. User clicks "Sign in with Google" on `/login`
2. Authenticates with Google
3. Returns to portal
4. System checks if member record exists with that email
5. If found, links auth account to member record
6. If not found, shows error to contact office

**Option C: Magic Link**
1. User enters email on `/login`
2. Receives magic link email
3. Clicks link to authenticate
4. System checks if member record exists
5. If found, links auth account to member record

---

## 🔄 How Account Linking Works

### **Automatic Linking Process:**

```
1. User authenticates (via email/password, Google, or magic link)
   ↓
2. Supabase Auth creates auth.users record
   ↓
3. System queries members table for matching email:
   SELECT * FROM members WHERE primary_email = 'user@email.com'
   ↓
4. If member found, update member record:
   UPDATE members SET auth_user_id = 'auth-uuid' WHERE id = 'member-id'
   ↓
5. User is now linked and can access portal
```

### **Database Structure:**

```sql
-- Auth User (managed by Supabase)
auth.users {
  id: uuid (auth_user_id)
  email: text
  encrypted_password: text
}

-- Member Record (your data)
members {
  id: uuid
  auth_user_id: uuid → references auth.users(id)
  primary_email: text
  membership_id: varchar(8)
  first_name: text
  last_name: text
  ...
}

-- Roles (for access control)
user_roles {
  user_id: uuid → references auth.users(id)
  role: user_role ('Member', 'Office Staff', 'Office Manager', etc.)
}
```

---

## 👥 User Types and Access

### **1. Regular Members (Community/Annual/Lifetime)**
- Default role: 'Member'
- Access to: Member dashboard, bookings, donations, profile
- Cannot access: Admin features

### **2. Office Staff**
- Role: 'Office Staff'
- Access to: Most admin features
- Cannot: Delete members, access sensitive reports

### **3. Office Manager**
- Role: 'Office Manager'
- Access to: All admin features
- Can: Manage all data, run reports, configure settings

### **4. Test Accounts**
- Flag: `is_test_account = true`
- Access: Based on assigned role
- Special: Automatically filtered from production metrics

---

## 🧪 Test Account Registration

### **Current Test Accounts:**

```
Email                              | Membership ID | Role
-----------------------------------|---------------|---------------
dev-msp+testmanager@hsnef.org     | 99991000      | Office Manager
dev-msp+teststaff@hsnef.org       | 99992000      | Office Staff
dev-msp+testlifetime@hsnef.org    | 99993000      | Member
dev-msp+testannual@hsnef.org      | 99994000      | Member
dev-msp+testcommunity@hsnef.org   | 99995000      | Member
```

### **Registration Steps:**

1. **Update Email Addresses** (if not done):
```sql
UPDATE members
SET primary_email = CASE membership_id
  WHEN '99991000' THEN 'dev-msp+testmanager@hsnef.org'
  WHEN '99992000' THEN 'dev-msp+teststaff@hsnef.org'
  WHEN '99993000' THEN 'dev-msp+testlifetime@hsnef.org'
  WHEN '99994000' THEN 'dev-msp+testannual@hsnef.org'
  WHEN '99995000' THEN 'dev-msp+testcommunity@hsnef.org'
END
WHERE is_test_account = true;
```

2. **Register Each Account:**
   - Go to: `http://localhost:3000/register`
   - Email: `dev-msp+testmanager@hsnef.org`
   - Password: `TestPassword123!` (or your choice)
   - Click "Create Account"
   - Repeat for all 5 accounts

3. **Assign Staff Roles:**
```sql
-- Get auth_user_id for manager and staff
SELECT membership_id, primary_email, auth_user_id
FROM members
WHERE primary_email IN (
  'dev-msp+testmanager@hsnef.org',
  'dev-msp+teststaff@hsnef.org'
);

-- Assign roles (replace with actual UUIDs)
INSERT INTO user_roles (user_id, role)
VALUES
  ('manager-auth-uuid', 'Office Manager'),
  ('staff-auth-uuid', 'Office Staff')
ON CONFLICT (user_id, role) DO NOTHING;
```

4. **Verify:**
```sql
SELECT
  m.membership_id,
  m.primary_email,
  m.auth_user_id IS NOT NULL as registered,
  array_agg(ur.role) as roles
FROM members m
LEFT JOIN user_roles ur ON m.auth_user_id = ur.user_id
WHERE m.is_test_account = true
GROUP BY m.membership_id, m.primary_email, m.auth_user_id
ORDER BY m.membership_id;
```

---

## 🚨 Common Issues & Solutions

### **Issue: "No member found with this email"**
**Solution:** Member record doesn't exist. Create it first in members table.

### **Issue: "Email already registered"**
**Solution:** User already has an auth account. Use password reset or login instead.

### **Issue: "Failed to link to member record"**
**Solution:** Database permissions issue. Check RLS policies on members table.

### **Issue: Magic link not received**
**Solution:**
- Check spam folder
- Verify email is correct in member record
- Check Supabase email settings

### **Issue: Can't access admin features after login**
**Solution:** User doesn't have admin role. Assign role in user_roles table.

---

## 🔒 Security Features

### **Password Requirements:**
- Minimum 8 characters
- No other complexity requirements (but recommended)

### **Email Verification:**
- **Test accounts:** Bypassed for convenience
- **Real members:** Required (Supabase sends verification email)

### **Row-Level Security (RLS):**
- Members can only see their own data
- Staff can see member data
- Managers can see all data

### **Session Management:**
- Sessions expire after inactivity
- Refresh tokens for persistent login
- Logout clears all session data

---

## 📊 Monitoring Registration

### **Check Registration Status:**
```sql
-- See all registered vs unregistered members
SELECT
  current_level,
  COUNT(*) as total,
  COUNT(auth_user_id) as registered,
  COUNT(*) - COUNT(auth_user_id) as not_registered
FROM members
WHERE is_test_account = false
GROUP BY current_level;
```

### **Recent Registrations:**
```sql
-- See recently registered members
SELECT
  m.membership_id,
  m.primary_email,
  m.first_name,
  m.last_name,
  u.created_at as registered_at
FROM members m
JOIN auth.users u ON m.auth_user_id = u.id
WHERE m.auth_user_id IS NOT NULL
ORDER BY u.created_at DESC
LIMIT 20;
```

---

## 🎯 Best Practices

### **For Office Staff:**
1. ✅ Always create member record before telling member to register
2. ✅ Use exact same email in member record and registration
3. ✅ Verify email is correct and active
4. ✅ Assign appropriate roles after registration

### **For Members:**
1. ✅ Use the email address the office has on file
2. ✅ Choose a strong password
3. ✅ Verify email if prompted
4. ✅ Contact office if registration fails

### **For Test Accounts:**
1. ✅ Use consistent password across all test accounts
2. ✅ Document test account credentials securely
3. ✅ Clean test data regularly
4. ✅ Never use test accounts for real transactions

---

## 🆘 Support Resources

**Technical Issues:**
- Check browser console for errors
- Verify Supabase connection
- Check database logs

**User Issues:**
- Verify member record exists
- Check email spelling
- Try password reset if account exists

**Contact:**
- Email: info@hsnef.org
- Portal: Contact support link in footer

---

## 🔄 Future Enhancements

**Planned Features:**
- [ ] Two-factor authentication (2FA)
- [ ] Social login (Facebook, Apple)
- [ ] Password complexity requirements
- [ ] Account lockout after failed attempts
- [ ] Self-service password reset
- [ ] Member self-registration (with approval)
- [ ] Bulk member invitation system

---

## ✅ Quick Reference

**Registration URL:** `http://localhost:3000/register` (or your domain)

**Login URL:** `http://localhost:3000/login`

**Test Password:** `TestPassword123!` (recommended)

**All test emails arrive at:** `dev-msp@hsnef.org`
