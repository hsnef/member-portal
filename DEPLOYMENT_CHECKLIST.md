# Deployment Checklist - Member Portal

## 🎯 Current Status

### ✅ Completed Features

#### 1. **Test Accounts System**
- 5 test accounts created with proper flags
- Membership IDs: 99991000 - 99995000
- Email addresses: dev-msp+test*@hsnef.org
- **Status:** ⏳ Awaiting registration via magic link

#### 2. **Member Self-Registration System**
- Public registration form at `/join`
- Admin review interface at `/admin/pending-registrations`
- Database migration created
- **Status:** ✅ Built, ready to deploy

#### 3. **Traditional Registration**
- Email/password registration at `/register`
- Auto-linking to member records
- **Status:** ✅ Complete

---

## 📋 Deployment Steps

### **Step 1: Run Database Migrations**

Run migrations in this order:

```bash
# 1. Update constraints for test accounts (if not already done)
supabase db push --include 20260108000005_update_constraints_for_test_accounts.sql

# 2. Create test accounts (if not already done)
supabase db push --include 20260108000004_test_accounts.sql

# 3. Create pending registrations table (NEW)
supabase db push --include 20260108000006_pending_member_registrations.sql
```

Or run all at once:
```bash
supabase db push
```

### **Step 2: Verify Database Setup**

```sql
-- 1. Check test accounts exist
SELECT membership_id, primary_email, is_test_account
FROM members
WHERE is_test_account = true
ORDER BY membership_id;

-- 2. Check pending registrations table
SELECT * FROM pending_member_registrations LIMIT 1;

-- 3. Check RLS policies
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename = 'pending_member_registrations';
```

### **Step 3: Register Test Accounts** ⏳ IN PROGRESS

**You are currently working on this step using magic link.**

For each test account:
1. Go to `/login`
2. Enter test account email
3. Click "Send Magic Link"
4. Check dev-msp@hsnef.org inbox
5. Click magic link
6. Verify successful login

**Test Account Emails:**
- dev-msp+testmanager@hsnef.org (Office Manager)
- dev-msp+teststaff@hsnef.org (Office Staff)
- dev-msp+testlifetime@hsnef.org (Member - Lifetime)
- dev-msp+testannual@hsnef.org (Member - Annual)
- dev-msp+testcommunity@hsnef.org (Member - Community)

### **Step 4: Assign Staff Roles**

After test accounts are registered:

```sql
-- 1. Get auth_user_id for manager and staff
SELECT membership_id, primary_email, auth_user_id
FROM members
WHERE primary_email IN (
  'dev-msp+testmanager@hsnef.org',
  'dev-msp+teststaff@hsnef.org'
);

-- 2. Assign roles (replace UUIDs with actual values from step 1)
INSERT INTO user_roles (user_id, role)
VALUES
  ('REPLACE-WITH-MANAGER-UUID', 'Office Manager'),
  ('REPLACE-WITH-STAFF-UUID', 'Office Staff')
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Verify roles assigned
SELECT
  m.membership_id,
  m.primary_email,
  m.auth_user_id IS NOT NULL as registered,
  COALESCE(array_agg(ur.role) FILTER (WHERE ur.role IS NOT NULL), ARRAY[]::user_role[]) as roles
FROM members m
LEFT JOIN user_roles ur ON m.auth_user_id = ur.user_id
WHERE m.is_test_account = true
GROUP BY m.membership_id, m.primary_email, m.auth_user_id
ORDER BY m.membership_id;
```

### **Step 5: Test Member Self-Registration**

**Test the complete public registration flow:**

1. **Submit Application (Public):**
   - Open `/join` in incognito browser
   - Fill out registration form
   - Select membership level
   - Submit application
   - Verify success message

2. **Review Application (Admin):**
   - Login as Office Manager or Staff
   - Navigate to `/admin/pending-registrations`
   - Verify application appears
   - Click "View Details"
   - Review all submitted information

3. **Approve Application:**
   - Click "Approve" button
   - Verify suggested membership ID (format: X9999900)
   - Edit if needed
   - Add review notes (optional)
   - Click "Confirm Approval"
   - Verify success message

4. **Verify Member Created:**
   ```sql
   SELECT
     m.membership_id,
     m.first_name,
     m.last_name,
     m.primary_email,
     m.current_level,
     p.status,
     p.assigned_membership_id
   FROM members m
   JOIN pending_member_registrations p ON m.id = p.created_member_id
   WHERE p.status = 'Approved'
   ORDER BY m.created_at DESC
   LIMIT 5;
   ```

5. **Test Member Portal Registration:**
   - New member goes to `/register`
   - Uses approved email address
   - Creates password
   - System links to member record
   - Can now login and access portal

### **Step 6: Test Other Features** ⏳ PENDING

**Features to test after test accounts are ready:**

1. **CSV Import:**
   - Go to `/admin/members/import`
   - Upload sample CSV with members
   - Verify address parsing
   - Check import history
   - Test batch deletion

2. **Receipts Page:**
   - Navigate to `/admin/receipts`
   - Generate receipt for donation
   - Test PDF export
   - Verify email functionality

3. **Settings Page:**
   - Navigate to `/admin/settings`
   - Update user preferences
   - Test configuration changes

---

## 🧪 Testing Matrix

### **Test Accounts Testing**

| Test Account | Login | Access | Features | Status |
|--------------|-------|--------|----------|--------|
| Manager | ⏳ | ⏳ | All admin features | Pending |
| Staff | ⏳ | ⏳ | Most admin features | Pending |
| Lifetime | ⏳ | ⏳ | Member dashboard | Pending |
| Annual | ⏳ | ⏳ | Member dashboard | Pending |
| Community | ⏳ | ⏳ | Member dashboard | Pending |

### **Self-Registration Testing**

| Test Case | Status |
|-----------|--------|
| Public form loads | ⏳ |
| Personal registration | ⏳ |
| Business registration | ⏳ |
| Admin review access | ⏳ |
| Approval workflow | ⏳ |
| Member creation | ⏳ |
| Portal registration | ⏳ |

---

## 🚨 Known Issues to Address

### **1. Welcome Email Automation**
**Status:** Not implemented
**Impact:** Office must manually email approved members
**Workaround:** Use email template in MEMBER_SELF_REGISTRATION_GUIDE.md
**Future:** Implement automated email system

### **2. Application Status Tracking (Public)**
**Status:** Not implemented
**Impact:** Applicants can't check application status
**Workaround:** Office contacts applicants directly
**Future:** Build status lookup page

### **3. Payment Integration**
**Status:** Not implemented
**Impact:** Paid memberships require manual payment tracking
**Workaround:** Manual payment processing
**Future:** Integrate Stripe or similar

---

## 📊 Metrics to Monitor

### **After Launch:**

1. **Registration Metrics:**
   ```sql
   -- Daily registrations by source
   SELECT
     DATE(submitted_at) as date,
     COUNT(*) as applications,
     COUNT(*) FILTER (WHERE status = 'Approved') as approved,
     COUNT(*) FILTER (WHERE status = 'Rejected') as rejected
   FROM pending_member_registrations
   GROUP BY DATE(submitted_at)
   ORDER BY date DESC;
   ```

2. **Conversion Rates:**
   ```sql
   -- Overall conversion rate
   SELECT
     COUNT(*) as total_applications,
     COUNT(*) FILTER (WHERE status = 'Approved') as approved,
     COUNT(*) FILTER (WHERE status = 'Rejected') as rejected,
     COUNT(*) FILTER (WHERE status IN ('Pending', 'Contacted')) as in_progress,
     ROUND(COUNT(*) FILTER (WHERE status = 'Approved') * 100.0 / COUNT(*), 2) as approval_rate
   FROM pending_member_registrations;
   ```

3. **Marketing Sources:**
   ```sql
   -- How people heard about HSNEF
   SELECT
     how_did_you_hear,
     COUNT(*) as count
   FROM pending_member_registrations
   WHERE how_did_you_hear IS NOT NULL
   GROUP BY how_did_you_hear
   ORDER BY count DESC;
   ```

---

## 📚 Documentation Reference

| Document | Purpose |
|----------|---------|
| **REGISTRATION_FLOW_GUIDE.md** | Complete auth & registration flows |
| **MEMBER_SELF_REGISTRATION_GUIDE.md** | Self-registration system details |
| **DEPLOYMENT_CHECKLIST.md** | This file - deployment steps |

---

## ✅ Pre-Launch Checklist

### **Database:**
- [ ] All migrations run successfully
- [ ] Test accounts created
- [ ] RLS policies verified
- [ ] Indexes created
- [ ] Constraints working

### **Test Accounts:**
- [ ] All 5 accounts registered
- [ ] Manager has Office Manager role
- [ ] Staff has Office Staff role
- [ ] Can login to all accounts
- [ ] Accounts properly flagged

### **Self-Registration:**
- [ ] Public form accessible
- [ ] Form submission works
- [ ] Admin page accessible to staff
- [ ] Approval creates member record
- [ ] Rejection workflow works

### **General:**
- [ ] All pages load without errors
- [ ] Navigation works correctly
- [ ] Authentication redirects properly
- [ ] Test data doesn't skew metrics

---

## 🎯 Next Steps (After Current Deployment)

1. **Email Automation:**
   - Welcome emails for approved members
   - Status update notifications
   - Rejection notifications

2. **Payment Integration:**
   - Stripe/PayPal for paid memberships
   - Donation processing
   - Receipt generation

3. **Enhanced Features:**
   - Document upload for applications
   - Application status lookup (public)
   - Bulk approval workflow
   - Analytics dashboard

4. **User Features:**
   - Receipts page functionality
   - Settings page options
   - Member directory
   - Event management

---

## 🆘 Troubleshooting

### **If migrations fail:**
1. Check Supabase connection
2. Verify migration order
3. Check for existing table conflicts
4. Review error messages in Supabase dashboard

### **If test accounts can't login:**
1. Verify account exists in members table
2. Check auth_user_id is set
3. Try password reset
4. Check Supabase auth logs

### **If self-registration fails:**
1. Check RLS policies allow public INSERT
2. Verify form validation
3. Check browser console for errors
4. Verify Supabase connection

### **If approval fails:**
1. Check membership_id format
2. Verify no duplicate membership_id
3. Check user has correct role
4. Review database constraints

---

**Last Updated:** 2026-01-08

**Current Status:** Test accounts awaiting registration, self-registration system ready to deploy
