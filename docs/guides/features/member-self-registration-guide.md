# Member Self-Registration System Guide

## Overview

The HSNEF Member Portal includes a **public self-registration system** that allows prospective members to apply for membership online. Applications are reviewed and approved by office staff before member accounts are created.

---

## 🌐 Public Registration Flow

### **Step 1: Prospective Member Visits Registration Page**

**URL:** `https://yourdomain.com/join` (or `/join` on localhost)

**What They See:**
- Membership level options with pricing:
  - **Community Membership** - Free
  - **Annual Membership** - $101/year
  - **Lifetime Membership** - $1,001 one-time
- Member type selection:
  - **Personal/Family** - For individuals and families
  - **Business/Corporate** - For business entities

### **Step 2: Complete Registration Form**

**For Personal/Family Members:**
- Primary member information:
  - First name, last name
  - Date of birth
  - Nakshatra (27 options)
  - Family Gotra
- Spouse/Partner information (optional):
  - First name, last name
  - Date of birth
  - Nakshatra
- Contact information:
  - Primary email (required)
  - Primary phone
  - Secondary email (optional)
  - Secondary phone (optional)
- Address:
  - Street address (line 1 and 2)
  - City, State, ZIP
  - Country (defaults to USA)
- Additional information:
  - How did you hear about HSNEF?
  - Any additional notes

**For Business/Corporate Members:**
- Business information:
  - Business name (required)
  - EIN (Employer Identification Number)
  - Business type
- Contact information (same as above)
- Address (same as above)
- Additional information (same as above)

### **Step 3: Submit Application**

- Form is validated for required fields
- Application is saved to `pending_member_registrations` table
- Status is set to "Pending"
- Submitted timestamp is recorded
- Applicant sees confirmation message

---

## 🏢 Office Staff Review Flow

### **Step 1: Access Applications Dashboard**

**URL:** `/admin/pending-registrations`

**Who Can Access:**
- Office Staff
- Office Manager
- Admin

**What They See:**
- List of all applications with:
  - Application ID
  - Applicant name/business
  - Email and phone
  - Requested membership level
  - Status (Pending, Contacted, Approved, Rejected)
  - Submission date
- Filter by status at the top
- "View Details" button for each application

### **Step 2: Review Application Details**

**Click "View Details" to see:**
- Full personal/business information
- Contact details
- Address
- How they heard about HSNEF
- Any notes from applicant
- All submitted fields

### **Step 3: Take Action**

**Option A: Contact Applicant**
1. Click "Contact" button
2. Add internal notes about the contact
3. Status changes to "Contacted"
4. Application remains in queue for follow-up

**Option B: Approve Application**
1. Click "Approve" button
2. System generates suggested membership ID (format: X9999900)
   - X = membership level (1=Lifetime, 2=Annual, 3=Community)
3. Verify or edit membership ID
4. Add review notes (optional)
5. Click "Confirm Approval"
6. System automatically:
   - Creates new member record in `members` table
   - Links application to member record
   - Updates application status to "Approved"
   - Records reviewer and timestamp

**Option C: Reject Application**
1. Click "Reject" button
2. Add rejection reason in notes (required)
3. Confirm rejection
4. Status changes to "Rejected"
5. Application is archived

---

## 📊 Database Schema

### **pending_member_registrations Table**

```sql
CREATE TABLE pending_member_registrations (
  id UUID PRIMARY KEY,

  -- Registration Type
  member_class member_class NOT NULL DEFAULT 'Personal',
  requested_level membership_level NOT NULL DEFAULT 'Community',

  -- Personal Information
  first_name TEXT,
  last_name TEXT,
  date_of_birth DATE,
  nakshatra nakshatra,
  family_gotra TEXT,

  -- Spouse/Secondary Information
  secondary_first_name TEXT,
  secondary_last_name TEXT,
  secondary_date_of_birth DATE,
  secondary_nakshatra nakshatra,

  -- Business Information
  business_name TEXT,
  business_ein TEXT,
  business_type TEXT,

  -- Contact Information
  primary_email TEXT NOT NULL,
  primary_phone TEXT,
  secondary_email TEXT,
  secondary_phone TEXT,

  -- Address
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT DEFAULT 'USA',

  -- Additional Information
  how_did_you_hear TEXT,
  notes TEXT,

  -- Status Tracking
  status TEXT NOT NULL DEFAULT 'Pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  -- If approved, link to created member
  created_member_id UUID REFERENCES members(id),
  assigned_membership_id VARCHAR(8),

  -- Timestamps
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 🔒 Security & Permissions

### **Row-Level Security (RLS) Policies:**

1. **Public Submission**
   ```sql
   -- Anyone can submit registration (no authentication required)
   CREATE POLICY "Anyone can submit registration"
     ON pending_member_registrations
     FOR INSERT
     TO public
     WITH CHECK (true);
   ```

2. **Staff View Access**
   ```sql
   -- Only staff can view all registrations
   CREATE POLICY "Staff can view all registrations"
     ON pending_member_registrations
     FOR SELECT
     TO authenticated
     USING (
       EXISTS (
         SELECT 1 FROM user_roles
         WHERE user_id = auth.uid()
         AND role IN ('Office Staff', 'Office Manager', 'Admin')
       )
     );
   ```

3. **Staff Update Access**
   ```sql
   -- Only staff can update registrations (review, approve, reject)
   CREATE POLICY "Staff can update registrations"
     ON pending_member_registrations
     FOR UPDATE
     TO authenticated
     USING (
       EXISTS (
         SELECT 1 FROM user_roles
         WHERE user_id = auth.uid()
         AND role IN ('Office Staff', 'Office Manager', 'Admin')
       )
     );
   ```

---

## 🚀 Deployment Steps

### **1. Run Database Migration**

```bash
# Migration file already created
supabase/migrations/20260108000006_pending_member_registrations.sql

# Apply migration
supabase db push
# or
npx supabase migration up
```

### **2. Verify Table Creation**

```sql
-- Check if table exists
SELECT * FROM pending_member_registrations LIMIT 1;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'pending_member_registrations';
```

### **3. Test Public Form**

1. Open `/join` in incognito/private browser (to test without authentication)
2. Fill out registration form
3. Submit and verify data appears in database
4. Verify no authentication was required

### **4. Test Admin Review**

1. Login as Office Staff or Manager
2. Navigate to `/admin/pending-registrations`
3. Verify application appears
4. Test "View Details" modal
5. Test approval workflow:
   - Approve one application
   - Verify member record created
   - Verify application status updated

### **5. Configure External Access**

**Add to public pages list (if needed):**
```typescript
// In middleware or auth checks
const publicPages = [
  '/',
  '/login',
  '/register',
  '/join',  // ← Add this
  '/auth/callback'
]
```

---

## 📧 Post-Approval Workflow

### **After Approving an Application:**

1. **Member Record is Created**
   - All information transferred to `members` table
   - Membership ID assigned
   - Status set to active

2. **Send Welcome Email** (Manual for now)
   - Email template suggestion:
   ```
   Subject: Welcome to HSNEF! Your Membership is Approved

   Dear [First Name],

   Congratulations! Your HSNEF membership application has been approved.

   Your Membership Details:
   - Membership ID: [membership_id]
   - Membership Level: [level]
   - Member Since: [date]

   Next Steps:
   1. Register for Portal Access: https://yourdomain.com/register
   2. Use your email: [primary_email]
   3. Create a password (minimum 8 characters)
   4. Verify your email when prompted
   5. Login and explore your member benefits

   Portal Features:
   - View and manage your membership
   - Book temple facilities
   - Make donations
   - Register for events
   - Access member resources

   Questions? Contact us at info@hsnef.org

   Welcome to the HSNEF family!

   HSNEF Office Team
   ```

3. **Track in CRM/Spreadsheet** (Optional)
   - Log new member for reporting
   - Add to mailing list
   - Schedule follow-up contact

---

## 📈 Monitoring & Reporting

### **Application Statistics**

```sql
-- Count applications by status
SELECT
  status,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE submitted_at >= NOW() - INTERVAL '7 days') as last_7_days,
  COUNT(*) FILTER (WHERE submitted_at >= NOW() - INTERVAL '30 days') as last_30_days
FROM pending_member_registrations
GROUP BY status
ORDER BY status;
```

### **Recent Applications**

```sql
-- View recent applications
SELECT
  id,
  COALESCE(first_name || ' ' || last_name, business_name) as applicant,
  primary_email,
  requested_level,
  status,
  submitted_at,
  reviewed_at
FROM pending_member_registrations
ORDER BY submitted_at DESC
LIMIT 20;
```

### **Conversion Rates**

```sql
-- Calculate approval rate
SELECT
  COUNT(*) FILTER (WHERE status = 'Approved') * 100.0 / NULLIF(COUNT(*), 0) as approval_rate,
  COUNT(*) FILTER (WHERE status = 'Rejected') * 100.0 / NULLIF(COUNT(*), 0) as rejection_rate,
  COUNT(*) FILTER (WHERE status IN ('Pending', 'Contacted')) as pending_count,
  AVG(EXTRACT(EPOCH FROM (reviewed_at - submitted_at)) / 86400) as avg_review_days
FROM pending_member_registrations
WHERE status != 'Pending';
```

### **Marketing Tracking**

```sql
-- See how people heard about HSNEF
SELECT
  how_did_you_hear,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE status = 'Approved') as approved_count
FROM pending_member_registrations
WHERE how_did_you_hear IS NOT NULL
GROUP BY how_did_you_hear
ORDER BY count DESC;
```

---

## 🔧 Customization Options

### **Membership Pricing**

Update prices in `/app/join/page.tsx`:

```typescript
const membershipLevels = [
  {
    value: 'Community',
    label: 'Community Membership',
    price: 'Free',  // ← Change here
    description: 'Basic access to community events'
  },
  // ... other levels
]
```

### **Required Fields**

Modify form validation in `/app/join/page.tsx`:

```typescript
// Make field required
<input
  required  // ← Add this
  type="text"
  value={formData.family_gotra}
  onChange={(e) => setFormData({ ...formData, family_gotra: e.target.value })}
/>
```

### **Add Custom Fields**

1. **Update Migration:**
```sql
ALTER TABLE pending_member_registrations
ADD COLUMN custom_field TEXT;
```

2. **Update Form:**
```typescript
// Add to formData state
const [formData, setFormData] = useState({
  // ... existing fields
  custom_field: ''
})

// Add input field in form
<input
  type="text"
  value={formData.custom_field}
  onChange={(e) => setFormData({ ...formData, custom_field: e.target.value })}
/>
```

3. **Update Review Interface:**
```typescript
// Display in details modal
<div>
  <strong>Custom Field:</strong> {selectedRegistration.custom_field}
</div>
```

---

## 🚨 Common Issues & Solutions

### **Issue: Form submission fails**
**Solutions:**
- Check browser console for errors
- Verify RLS policies allow public INSERT
- Check Supabase connection
- Verify all required fields have values

### **Issue: Staff can't see applications**
**Solutions:**
- Verify user has correct role in `user_roles` table
- Check RLS policies
- Verify user is authenticated
- Check browser console for auth errors

### **Issue: Approval fails**
**Solutions:**
- Verify membership_id is unique (8 digits)
- Check membership_id format (first digit must match level: 1, 2, or 3)
- Verify staff user has UPDATE permission
- Check for database constraint violations

### **Issue: Public page requires authentication**
**Solutions:**
- Verify `/join` is in public routes list
- Check middleware configuration
- Verify RLS policy allows anonymous INSERT

---

## ✅ Testing Checklist

### **Public Form Testing:**
- [ ] Form loads without authentication
- [ ] All fields render correctly
- [ ] Personal member registration works
- [ ] Business member registration works
- [ ] Form validation catches errors
- [ ] Success message displays
- [ ] Data appears in database

### **Admin Review Testing:**
- [ ] Applications list loads
- [ ] Filter by status works
- [ ] View details modal shows all data
- [ ] Contact action updates status
- [ ] Approval creates member record
- [ ] Rejection updates status
- [ ] Review notes save correctly

### **Permission Testing:**
- [ ] Unauthenticated users can submit applications
- [ ] Regular members cannot access admin page
- [ ] Office Staff can view/approve applications
- [ ] Office Manager can view/approve applications

### **Edge Case Testing:**
- [ ] Duplicate email handling
- [ ] Very long names/addresses
- [ ] Special characters in names
- [ ] Missing optional fields
- [ ] International addresses
- [ ] Invalid email formats

---

## 🎯 Best Practices

### **For Office Staff:**
1. ✅ Review applications within 24-48 hours
2. ✅ Add detailed notes when contacting or rejecting
3. ✅ Verify email addresses before approving
4. ✅ Send welcome email immediately after approval
5. ✅ Double-check membership ID before approving
6. ✅ Use "Contact" status for applications needing clarification

### **For System Administrators:**
1. ✅ Monitor application queue daily
2. ✅ Archive old rejected/approved applications
3. ✅ Track conversion rates monthly
4. ✅ Review "how did you hear" data for marketing insights
5. ✅ Back up pending applications regularly
6. ✅ Test the workflow after any system updates

---

## 📞 Support

**For Technical Issues:**
- Check system logs: Supabase Dashboard → Logs
- Review RLS policies: Database → Tables → pending_member_registrations → Policies
- Verify migrations: Check migration history

**For Process Questions:**
- Review this guide
- Check `registration-flow-guide.md` for overall registration flows
- Contact system administrator

---

## 🔄 Future Enhancements

**Planned Features:**
- [ ] Automated welcome email after approval
- [ ] Email notification to applicant when status changes
- [ ] Application status tracking page (public)
- [ ] Payment integration for paid memberships
- [ ] Document upload (ID verification)
- [ ] Bulk approval workflow
- [ ] Application analytics dashboard
- [ ] Automated assignment of membership IDs
- [ ] Email templates for rejection reasons
- [ ] SMS notifications

---

## 📝 Quick Reference

**Public Registration URL:** `/join`

**Admin Review URL:** `/admin/pending-registrations`

**Migration File:** `supabase/migrations/20260108000006_pending_member_registrations.sql`

**Database Table:** `pending_member_registrations`

**Status Values:**
- `Pending` - Awaiting initial review
- `Contacted` - Staff has reached out for clarification
- `Approved` - Accepted, member record created
- `Rejected` - Not approved

**Membership ID Format:** `X9999900`
- First digit: 1=Lifetime, 2=Annual, 3=Community
- Next 5 digits: Sequential number
- Last 2 digits: Always 00

---

**Last Updated:** 2026-01-08
