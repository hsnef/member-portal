# Member Audit Log - User Experience Summary

## Overview

This document summarizes the user experience for **Office Staff**, **Office Manager**, and **Members** when interacting with the Member Audit Log system.

---

## 🏢 Office Staff Experience

### What They Can Do

✅ **View Audit Logs**
- Access audit log for any member from the member detail page
- See complete timeline of all changes
- View who created the member and how (auto-import, self-registration, staff-created)

✅ **Search & Filter**
- Filter by action type (Created, Level Changed, ID Changed, etc.)
- Filter by creation source (Auto Import, Office Staff, etc.)
- Search by date range
- Search by staff member name

✅ **View Change History**
- See membership ID changes (read-only)
- See membership level changes
- See membership class changes
- See ALL field changes (email, phone, address, etc.)
- See change reasons for all changes

### What They Cannot Do

❌ **Cannot export audit logs** (Manager/Admin only)
❌ **Cannot change membership IDs** (Manager/Admin only)

### Typical Use Cases

1. **"Who created this member?"**
   - Open member detail page
   - Click "View Audit Log"
   - See first entry: "Created by Office Staff (Jane Smith)" or "Created via Auto Import"

2. **"When was this member's level changed?"**
   - View audit log timeline
   - Find "Membership Level Changed" entry
   - See date, time, and who made the change

3. **"What was the original membership ID?"**
   - View audit log
   - See creation entry with original ID
   - See any ID changes in chronological order

### UI Access Points

- **Member Detail Page** → "View Audit Log" button (top right)
- **Member List** → Right-click member → "View Audit Log"
- **Direct URL:** `/admin/members/[id]/audit-log`

### Example View

```
┌─────────────────────────────────────────────────────────┐
│ Member Audit Log - John Doe (20000100)                  │
│ [Filter] [Search] [Export] (disabled)                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 📅 Created - Jan 15, 2024 10:30 AM                     │
│ ─────────────────────────────────────────────────────  │
│ Created by: Office Staff                                │
│ Staff Name: Jane Smith                                  │
│ Source: OFFICE_STAFF                                    │
│ Membership ID: 20000100                                 │
│ Class: Personal | Level: Annual                        │
│                                                         │
│ 🔄 Membership Level Changed - Feb 1, 2024 2:15 PM       │
│ ─────────────────────────────────────────────────────  │
│ Changed by: Office Manager                               │
│ Manager Name: Admin User                                 │
│ From: Annual → Lifetime                                 │
│ Membership ID: 10000100 (auto-updated)                 │
│ Reason: Upgraded to Lifetime membership                │
│                                                         │
│ 📝 Profile Updated - Feb 5, 2024 9:00 AM               │
│ ─────────────────────────────────────────────────────  │
│ Changed by: Member                                       │
│ Member Name: John Doe                                   │
│ Fields Changed: primary_email, primary_phone            │
│ • Email: old@example.com → new@example.com              │
│ • Phone: (555) 123-4567 → (555) 987-6543               │
│                                                         │
│ 📝 Profile Updated - Feb 5, 2024 9:00 AM                │
│ ─────────────────────────────────────────────────────  │
│ Changed by: Member                                       │
│ Member Name: John Doe                                   │
│ Changes: Email, Phone                                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 👔 Office Manager Experience

### What They Can Do

✅ **Everything Office Staff can do, PLUS:**

✅ **Full Access to Change Reasons**
- See all change reasons/comments
- See why membership IDs were changed
- See context for all modifications

✅ **Export & Reporting**
- Export audit logs to CSV
- Print audit timeline
- Generate reports for compliance

✅ **Advanced Filtering**
- Filter by creation source across all members
- Filter by staff member who made changes
- Filter by change type
- Date range filtering

✅ **Change Membership IDs**
- Can change membership IDs (with required reason)
- Must provide reason when changing
- All changes logged automatically

✅ **Global Audit View**
- View audit logs for all members
- Dashboard showing creation sources over time
- Analytics on member changes

### Typical Use Cases

1. **"Show me all members created via auto-import last month"**
   - Go to Admin Dashboard → "Member Audit Logs"
   - Filter: Creation Source = "AUTO_IMPORT"
   - Filter: Date Range = Last Month
   - View results

2. **"Export audit log for compliance review"**
   - Open member audit log
   - Click "Export to CSV"
   - Download complete audit trail

3. **"Who changed this member's membership number and why?"**
   - View audit log
   - Find "Membership ID Changed" entry
   - See who changed it, when, and the reason

4. **"Change membership ID for member"**
   - Open member detail page
   - Click "Change Membership ID" (Manager/Admin only)
   - Enter new ID and required reason
   - Submit → Change logged automatically

### UI Access Points

- **Member Detail Page** → "View Audit Log" button
- **Member Detail Page** → "Change Membership ID" button (Manager/Admin only)
- **Admin Dashboard** → "Member Audit Logs" (global view)
- **Direct URL:** `/admin/members/[id]/audit-log`
- **Direct URL:** `/admin/audit-logs` (global view)

### Example View (with Full Details)

```
┌─────────────────────────────────────────────────────────┐
│ Member Audit Log - John Doe (20000100)                  │
│ [Filter] [Search] [Export CSV] [Print]                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 📅 Created - Jan 15, 2024 10:30 AM                     │
│ ─────────────────────────────────────────────────────  │
│ Created by: Office Staff                                │
│ Staff Name: Jane Smith (jane@hsnef.org)                │
│ Source: OFFICE_STAFF                                    │
│ Membership ID: 20000100                                 │
│ Class: Personal | Level: Annual                        │
│                                                         │
│ 🔄 Membership Level Changed - Feb 1, 2024 2:15 PM      │
│ ─────────────────────────────────────────────────────  │
│ Changed by: Office Manager                              │
│ Manager Name: Admin User (admin@hsnef.org)             │
│ From: Annual → Lifetime                                 │
│ Membership ID: 10000100 (auto-updated)                 │
│                                                         │
│ 🔢 Membership ID Changed - Feb 1, 2024 2:15 PM         │
│ ─────────────────────────────────────────────────────  │
│ Changed by: Office Manager                              │
│ Manager Name: Admin User                                │
│ From: 20000100 → 10000100                              │
│ Reason: Upgraded to Lifetime membership. Member paid   │
│         $1001 and requested upgrade.                   │
│                                                         │
│ 📝 Profile Updated - Feb 5, 2024 9:00 AM                │
│ ─────────────────────────────────────────────────────  │
│ Changed by: Member                                       │
│ Member Name: John Doe                                   │
│ Changes: Email, Phone                                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Change Membership ID Flow

```
1. Office Manager clicks "Change Membership ID"
   ↓
2. Modal opens:
   ┌─────────────────────────────────────┐
   │ Change Membership ID               │
   ├─────────────────────────────────────┤
   │ Current ID: 20000100               │
   │                                     │
   │ New ID: [________]                  │
   │ (Format: 1xxxxx00, 2xxxxx00, etc.) │
   │                                     │
   │ Reason for Change: *                │
   │ [________________________]         │
   │ [________________________]         │
   │                                     │
   │ [Cancel]  [Change ID]              │
   └─────────────────────────────────────┘
   ↓
3. System validates:
   - Format is correct
   - ID is unique
   - User has permission
   ↓
4. On success:
   - Member record updated
   - Audit log entry created automatically
   - Success message shown
   ↓
5. User redirected to audit log to see change
```

---

## 👤 Member Experience

### What They Can Do

✅ **View Their Own Audit Log** (Limited)
- See when their account was created
- See their own profile updates
- View timeline of their changes

### What They Cannot See

❌ **Cannot see who created their account** (privacy - unless they created it themselves)
❌ **Cannot see membership level/ID changes** (staff-only information)
❌ **Cannot see change reasons** (staff-only)
❌ **Cannot see staff names** (privacy)
❌ **Cannot see other members' audit logs**

### Typical Use Cases

1. **"When did I register?"**
   - Go to Member Dashboard
   - Click "Account History"
   - See creation date

2. **"What changes have I made to my profile?"**
   - View account history
   - See timeline of profile updates
   - See what fields were changed

### UI Access Points

- **Member Dashboard** → "Account History" link
- **Member Profile** → "View History" button
- **Direct URL:** `/member/audit-log`

### Example View (Member-Facing)

```
┌─────────────────────────────────────────────────────────┐
│ Your Account History                                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 📅 Account Created                                      │
│ ─────────────────────────────────────────────────────  │
│ Date: January 15, 2024                                  │
│                                                         │
│ 📝 Profile Updated                                      │
│ ─────────────────────────────────────────────────────  │
│ Date: February 5, 2024                                  │
│ You updated: Email, Phone                                │
│                                                         │
│ 📝 Profile Updated                                      │
│ ─────────────────────────────────────────────────────  │
│ Date: March 10, 2024                                    │
│ You updated: Address                                    │
│                                                         │
│ 📝 Profile Updated                                      │
│ ─────────────────────────────────────────────────────  │
│ Date: April 2, 2024                                    │
│ You updated: Secondary Contact Email                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Note:** Members do NOT see:
- Who created their account (privacy)
- Membership level changes (staff-only)
- Membership ID changes (staff-only)
- Staff-initiated changes
- Change reasons

---

## 📊 Summary Table

| Feature | Office Staff | Office Manager | Member |
|---------|-------------|----------------|--------|
| **View Audit Logs** | ✅ All members | ✅ All members | ✅ Own only |
| **See Creation Source** | ✅ | ✅ | ❌ |
| **See Who Created** | ✅ | ✅ | ❌ (unless self) |
| **See Change Reasons** | ✅ | ✅ | ❌ |
| **See Membership ID Changes** | ✅ (read-only) | ✅ (full) | ❌ |
| **See Level Changes** | ✅ | ✅ | ❌ |
| **Export to CSV** | ❌ | ✅ | ❌ |
| **Change Membership ID** | ❌ | ✅ | ❌ |
| **Global Audit View** | ❌ | ✅ | ❌ |
| **Filter by Source** | ✅ | ✅ | ❌ |
| **Search by Staff** | ✅ | ✅ | ❌ |

---

## 🎯 Key Design Decisions

### 1. Privacy for Members
- Members cannot see who created their account (unless they created it themselves)
- This protects staff privacy and prevents confusion

### 2. Change Reasons Visibility
- Office Staff CAN see change reasons (can be tightened later if needed)
- All staff can see full context for transparency
- Change reasons help staff understand why changes were made

### 3. Membership ID Changes
- Only Manager/Admin can change
- Reason required (enforced in UI and database)
- All changes logged automatically

### 4. Creation Source Tracking
- Automatically determined based on `created_by` field
- Helps track how members enter the system
- Useful for reporting and analytics

### 5. Comprehensive Field Tracking
- Tracks ALL editable fields (except membership_id and first_name/last_name)
- Includes: contact info, address, secondary contact, business info, etc.
- Provides complete audit trail of all changes
- Field changes stored in JSONB for flexibility

### 5. Timeline View
- Chronological view is most intuitive
- Visual indicators (icons, colors) help scan quickly
- Expandable details keep UI clean

---

## 🚀 Next Steps

1. **Review this user experience** with stakeholders
2. **Confirm privacy decisions** (what members can see)
3. **Approve the design** and proceed with implementation
4. **Test with real users** before full deployment

---

**Questions or feedback? Let's discuss!** 💬
