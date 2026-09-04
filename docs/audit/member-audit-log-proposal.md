# Member Audit Log System - Proposal

> **Proposal — a design document, not a description of what exists.**
> Parts of it were built and parts were not. Check the code before relying on any detail here.
> It is kept for background and is deliberately NOT updated as the code changes,
> so expect stale filenames, routes, component names, colours and URLs.
> For current state see [`docs/PROJECT-HUB.md`](../PROJECT-HUB.md) and
> [`docs/PRIORITY-ROADMAP.md`](../PRIORITY-ROADMAP.md).

## Overview

This document proposes a comprehensive audit logging system for member creation and changes, specifically tracking:
- **Who created the member** (Auto Import, Member Self-Registration, Office Staff, Office Manager, Admin)
- **Membership class changes** (Personal ↔ Business)
- **Membership level changes** (Community ↔ Annual ↔ Lifetime)
- **Membership number changes** (only by Office Manager/Admin)

---

## Database Design

### New Table: `member_audit_log`

A dedicated table for tracking all member-related changes with rich metadata:

```sql
CREATE TABLE member_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  
  -- What changed
  action_type TEXT NOT NULL, -- 'CREATED', 'MEMBERSHIP_ID_CHANGED', 'FIELD_UPDATED', 'BULK_UPDATE'
  
  -- Who made the change
  changed_by UUID REFERENCES auth.users(id),
  changed_by_role TEXT, -- 'Member', 'Office Staff', 'Office Manager', 'Admin', 'System'
  changed_by_name TEXT, -- Cached name for display
  creation_source TEXT, -- 'AUTO_IMPORT', 'SELF_REGISTRATION', 'OFFICE_STAFF', 'OFFICE_MANAGER', 'ADMIN'
  
  -- What changed (for special actions)
  old_membership_id VARCHAR(8),
  new_membership_id VARCHAR(8),
  
  -- Field changes (JSONB for flexibility - stores all changed fields)
  changed_fields JSONB, -- { "field_name": { "old": "value", "new": "value" }, ... }
  field_names TEXT[], -- Array of field names that changed (for easy querying)
  
  -- Additional context
  change_reason TEXT, -- Optional reason for the change
  metadata JSONB, -- Additional context (import file name, etc.)
  
  -- Timestamps
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_member_audit_member_id ON member_audit_log(member_id);
CREATE INDEX idx_member_audit_changed_at ON member_audit_log(changed_at DESC);
CREATE INDEX idx_member_audit_action_type ON member_audit_log(action_type);
CREATE INDEX idx_member_audit_changed_by ON member_audit_log(changed_by);
CREATE INDEX idx_member_audit_creation_source ON member_audit_log(creation_source);
```

### Database Triggers

**1. Auto-log member creation:**
```sql
CREATE OR REPLACE FUNCTION log_member_creation()
RETURNS TRIGGER AS $$
DECLARE
  v_user_role TEXT;
  v_user_name TEXT;
  v_creation_source TEXT;
BEGIN
  -- Determine creation source
  IF NEW.created_by IS NULL THEN
    v_creation_source := 'AUTO_IMPORT';
  ELSIF NEW.auth_user_id = NEW.created_by THEN
    v_creation_source := 'SELF_REGISTRATION';
  ELSE
    -- Get user role
    SELECT role INTO v_user_role
    FROM user_roles
    WHERE user_id = NEW.created_by
    ORDER BY granted_at DESC
    LIMIT 1;
    
    v_creation_source := CASE v_user_role
      WHEN 'Office Staff' THEN 'OFFICE_STAFF'
      WHEN 'Office Manager' THEN 'OFFICE_MANAGER'
      WHEN 'Admin' THEN 'ADMIN'
      ELSE 'OFFICE_STAFF'
    END;
  END IF;
  
  -- Get user name
  SELECT COALESCE(
    (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = NEW.created_by),
    (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = NEW.created_by),
    (SELECT email FROM auth.users WHERE id = NEW.created_by),
    'System'
  ) INTO v_user_name;
  
  -- Insert audit log
  INSERT INTO member_audit_log (
    member_id,
    action_type,
    changed_by,
    changed_by_role,
    changed_by_name,
    creation_source,
    new_membership_id,
    new_membership_class,
    new_membership_level,
    changed_at
  ) VALUES (
    NEW.id,
    'CREATED',
    NEW.created_by,
    COALESCE(v_user_role, 'System'),
    v_user_name,
    v_creation_source,
    NEW.membership_id,
    NEW.member_class,
    NEW.current_level,
    NEW.created_at
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_member_creation
  AFTER INSERT ON members
  FOR EACH ROW
  EXECUTE FUNCTION log_member_creation();
```

**2. Auto-log all field changes:**
```sql
CREATE OR REPLACE FUNCTION log_member_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_user_role TEXT;
  v_user_name TEXT;
  v_changed_fields JSONB := '{}'::JSONB;
  v_field_names TEXT[] := ARRAY[]::TEXT[];
  v_has_changes BOOLEAN := FALSE;
  v_field_name TEXT;
  v_old_value TEXT;
  v_new_value TEXT;
BEGIN
  -- Get current user role
  SELECT role INTO v_user_role
  FROM user_roles
  WHERE user_id = auth.uid()
  ORDER BY granted_at DESC
  LIMIT 1;
  
  -- Get user name
  SELECT COALESCE(
    (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = auth.uid()),
    (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = auth.uid()),
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    'System'
  ) INTO v_user_name;
  
  -- Check for membership ID change (special handling - separate log entry)
  IF OLD.membership_id IS DISTINCT FROM NEW.membership_id THEN
    INSERT INTO member_audit_log (
      member_id,
      action_type,
      changed_by,
      changed_by_role,
      changed_by_name,
      old_membership_id,
      new_membership_id,
      changed_at
    ) VALUES (
      NEW.id,
      'MEMBERSHIP_ID_CHANGED',
      auth.uid(),
      COALESCE(v_user_role, 'System'),
      v_user_name,
      OLD.membership_id,
      NEW.membership_id,
      NOW()
    );
  END IF;
  
  -- Track all other field changes (excluding membership_id, first_name, last_name)
  -- Fields to track: member_class, current_level, is_founding_member, profile_name,
  -- nakshatra, family_gotra, secondary_*, business_*, primary_email, primary_phone*,
  -- address_*, mailing_address, member_since
  
  -- Membership class
  IF OLD.member_class IS DISTINCT FROM NEW.member_class THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('member_class', jsonb_build_object('old', OLD.member_class, 'new', NEW.member_class));
    v_field_names := array_append(v_field_names, 'member_class');
    v_has_changes := TRUE;
  END IF;
  
  -- Membership level
  IF OLD.current_level IS DISTINCT FROM NEW.current_level THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('current_level', jsonb_build_object('old', OLD.current_level, 'new', NEW.current_level));
    v_field_names := array_append(v_field_names, 'current_level');
    v_has_changes := TRUE;
  END IF;
  
  -- Founding member flag
  IF OLD.is_founding_member IS DISTINCT FROM NEW.is_founding_member THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('is_founding_member', jsonb_build_object('old', OLD.is_founding_member, 'new', NEW.is_founding_member));
    v_field_names := array_append(v_field_names, 'is_founding_member');
    v_has_changes := TRUE;
  END IF;
  
  -- Personal fields (excluding first_name, last_name)
  IF OLD.profile_name IS DISTINCT FROM NEW.profile_name THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('profile_name', jsonb_build_object('old', OLD.profile_name, 'new', NEW.profile_name));
    v_field_names := array_append(v_field_names, 'profile_name');
    v_has_changes := TRUE;
  END IF;
  
  IF OLD.nakshatra IS DISTINCT FROM NEW.nakshatra THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('nakshatra', jsonb_build_object('old', OLD.nakshatra, 'new', NEW.nakshatra));
    v_field_names := array_append(v_field_names, 'nakshatra');
    v_has_changes := TRUE;
  END IF;
  
  IF OLD.family_gotra IS DISTINCT FROM NEW.family_gotra THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('family_gotra', jsonb_build_object('old', OLD.family_gotra, 'new', NEW.family_gotra));
    v_field_names := array_append(v_field_names, 'family_gotra');
    v_has_changes := TRUE;
  END IF;
  
  -- Secondary/spouse fields
  IF OLD.secondary_first_name IS DISTINCT FROM NEW.secondary_first_name THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('secondary_first_name', jsonb_build_object('old', OLD.secondary_first_name, 'new', NEW.secondary_first_name));
    v_field_names := array_append(v_field_names, 'secondary_first_name');
    v_has_changes := TRUE;
  END IF;
  
  IF OLD.secondary_last_name IS DISTINCT FROM NEW.secondary_last_name THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('secondary_last_name', jsonb_build_object('old', OLD.secondary_last_name, 'new', NEW.secondary_last_name));
    v_field_names := array_append(v_field_names, 'secondary_last_name');
    v_has_changes := TRUE;
  END IF;
  
  IF OLD.secondary_nakshatra IS DISTINCT FROM NEW.secondary_nakshatra THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('secondary_nakshatra', jsonb_build_object('old', OLD.secondary_nakshatra, 'new', NEW.secondary_nakshatra));
    v_field_names := array_append(v_field_names, 'secondary_nakshatra');
    v_has_changes := TRUE;
  END IF;
  
  IF OLD.secondary_email IS DISTINCT FROM NEW.secondary_email THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('secondary_email', jsonb_build_object('old', OLD.secondary_email, 'new', NEW.secondary_email));
    v_field_names := array_append(v_field_names, 'secondary_email');
    v_has_changes := TRUE;
  END IF;
  
  IF OLD.secondary_phone IS DISTINCT FROM NEW.secondary_phone THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('secondary_phone', jsonb_build_object('old', OLD.secondary_phone, 'new', NEW.secondary_phone));
    v_field_names := array_append(v_field_names, 'secondary_phone');
    v_has_changes := TRUE;
  END IF;
  
  -- Business fields
  IF OLD.business_name IS DISTINCT FROM NEW.business_name THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('business_name', jsonb_build_object('old', OLD.business_name, 'new', NEW.business_name));
    v_field_names := array_append(v_field_names, 'business_name');
    v_has_changes := TRUE;
  END IF;
  
  IF OLD.business_ein IS DISTINCT FROM NEW.business_ein THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('business_ein', jsonb_build_object('old', OLD.business_ein, 'new', NEW.business_ein));
    v_field_names := array_append(v_field_names, 'business_ein');
    v_has_changes := TRUE;
  END IF;
  
  -- Contact fields
  IF OLD.primary_email IS DISTINCT FROM NEW.primary_email THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('primary_email', jsonb_build_object('old', OLD.primary_email, 'new', NEW.primary_email));
    v_field_names := array_append(v_field_names, 'primary_email');
    v_has_changes := TRUE;
  END IF;
  
  IF OLD.primary_phone IS DISTINCT FROM NEW.primary_phone THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('primary_phone', jsonb_build_object('old', OLD.primary_phone, 'new', NEW.primary_phone));
    v_field_names := array_append(v_field_names, 'primary_phone');
    v_has_changes := TRUE;
  END IF;
  
  IF OLD.primary_phone_2 IS DISTINCT FROM NEW.primary_phone_2 THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('primary_phone_2', jsonb_build_object('old', OLD.primary_phone_2, 'new', NEW.primary_phone_2));
    v_field_names := array_append(v_field_names, 'primary_phone_2');
    v_has_changes := TRUE;
  END IF;
  
  -- Address fields
  IF OLD.address_line_1 IS DISTINCT FROM NEW.address_line_1 THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('address_line_1', jsonb_build_object('old', OLD.address_line_1, 'new', NEW.address_line_1));
    v_field_names := array_append(v_field_names, 'address_line_1');
    v_has_changes := TRUE;
  END IF;
  
  IF OLD.address_line_2 IS DISTINCT FROM NEW.address_line_2 THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('address_line_2', jsonb_build_object('old', OLD.address_line_2, 'new', NEW.address_line_2));
    v_field_names := array_append(v_field_names, 'address_line_2');
    v_has_changes := TRUE;
  END IF;
  
  IF OLD.city IS DISTINCT FROM NEW.city THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('city', jsonb_build_object('old', OLD.city, 'new', NEW.city));
    v_field_names := array_append(v_field_names, 'city');
    v_has_changes := TRUE;
  END IF;
  
  IF OLD.state IS DISTINCT FROM NEW.state THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('state', jsonb_build_object('old', OLD.state, 'new', NEW.state));
    v_field_names := array_append(v_field_names, 'state');
    v_has_changes := TRUE;
  END IF;
  
  IF OLD.zip IS DISTINCT FROM NEW.zip THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('zip', jsonb_build_object('old', OLD.zip, 'new', NEW.zip));
    v_field_names := array_append(v_field_names, 'zip');
    v_has_changes := TRUE;
  END IF;
  
  IF OLD.country IS DISTINCT FROM NEW.country THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('country', jsonb_build_object('old', OLD.country, 'new', NEW.country));
    v_field_names := array_append(v_field_names, 'country');
    v_has_changes := TRUE;
  END IF;
  
  IF OLD.mailing_address IS DISTINCT FROM NEW.mailing_address THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('mailing_address', jsonb_build_object('old', OLD.mailing_address, 'new', NEW.mailing_address));
    v_field_names := array_append(v_field_names, 'mailing_address');
    v_has_changes := TRUE;
  END IF;
  
  -- Member since
  IF OLD.member_since IS DISTINCT FROM NEW.member_since THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('member_since', jsonb_build_object('old', OLD.member_since, 'new', NEW.member_since));
    v_field_names := array_append(v_field_names, 'member_since');
    v_has_changes := TRUE;
  END IF;
  
  -- Only create log entry if there are actual field changes
  IF v_has_changes THEN
    INSERT INTO member_audit_log (
      member_id,
      action_type,
      changed_by,
      changed_by_role,
      changed_by_name,
      changed_fields,
      field_names,
      changed_at
    ) VALUES (
      NEW.id,
      'FIELD_UPDATED',
      auth.uid(),
      COALESCE(v_user_role, 'System'),
      v_user_name,
      v_changed_fields,
      v_field_names,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_member_changes
  AFTER UPDATE ON members
  FOR EACH ROW
  EXECUTE FUNCTION log_member_changes();
```

---

## User Experience Design

### Admin View: Member Audit Log Page

**Route:** `/admin/members/[id]/audit-log`

**Features:**
1. **Timeline View** (Default)
   - Chronological list of all changes
   - Visual timeline with icons for each action type
   - Color-coded by action type
   - Expandable details for each entry

2. **Filter & Search**
   - Filter by action type
   - Filter by creation source
   - Filter by date range
   - Search by changed by name/email

3. **Summary Cards**
   - Total changes
   - Created by (with badge)
   - Last modified
   - Membership ID history

4. **Export Options**
   - Export to CSV
   - Print timeline

### UI Components

**1. Timeline Component**
```
┌─────────────────────────────────────────────────┐
│ Member Audit Log - John Doe (20000100)          │
├─────────────────────────────────────────────────┤
│                                                  │
│  📅 Created                                      │
│  ────────────────────────────────────────────   │
│  Created by: Office Staff (Jane Smith)          │
│  Source: OFFICE_STAFF                           │
│  Date: Jan 15, 2024 10:30 AM                   │
│  Membership ID: 20000100                        │
│  Class: Personal | Level: Annual                │
│                                                  │
│  🔄 Membership Level Changed                     │
│  ────────────────────────────────────────────   │
│  Changed by: Office Manager (Admin User)        │
│  Date: Feb 1, 2024 2:15 PM                      │
│  Reason: Upgraded to Lifetime membership        │
│  From: Annual → Lifetime                         │
│  Membership ID: 10000100 (auto-updated)          │
│                                                  │
│  🔢 Membership ID Changed                        │
│  ────────────────────────────────────────────   │
│  Changed by: Office Manager (Admin User)         │
│  Date: Feb 1, 2024 2:15 PM                      │
│  Reason: Upgraded to Lifetime membership        │
│  From: 20000100 → 10000100                      │
│                                                  │
│  📝 Profile Updated                              │
│  ────────────────────────────────────────────   │
│  Changed by: Member (John Doe)                   │
│  Date: Feb 5, 2024 9:00 AM                      │
│  Changes: Email, Phone                          │
│                                                  │
└─────────────────────────────────────────────────┘
```

**2. Summary View (Sidebar)**
```
┌─────────────────────────┐
│ Audit Summary           │
├─────────────────────────┤
│ Created:                │
│ └─ By: Office Staff     │
│ └─ Source: OFFICE_STAFF│
│ └─ Date: Jan 15, 2024  │
│                         │
│ Total Changes: 5        │
│                         │
│ Membership ID History:  │
│ • 20000100 (Jan 15)     │
│ • 10000100 (Feb 1)      │
│                         │
│ Level History:          │
│ • Annual (Jan 15)       │
│ • Lifetime (Feb 1)      │
└─────────────────────────┘
```

---

## User Experience by Role

### Office Staff

**What They See:**
- ✅ View audit log for any member
- ✅ See who created the member
- ✅ See all changes (read-only)
- ✅ Filter and search audit entries
- ❌ Cannot see change reasons (if sensitive)
- ❌ Cannot export audit logs

**Use Cases:**
- "Who created this member?"
- "When was this member's level changed?"
- "What was the original membership ID?"

**Access:**
- Member detail page → "View Audit Log" button
- Direct link: `/admin/members/[id]/audit-log`

---

### Office Manager

**What They See:**
- ✅ Everything Office Staff sees, PLUS:
- ✅ Full change reasons/comments
- ✅ Export audit logs to CSV
- ✅ Print audit timeline
- ✅ View membership ID change history
- ✅ See creation source details

**Use Cases:**
- "Show me all members created via auto-import last month"
- "Export audit log for compliance review"
- "Who changed this member's membership number and why?"

**Access:**
- Member detail page → "View Audit Log" button
- Admin dashboard → "Member Audit Logs" (all members)
- Direct link: `/admin/members/[id]/audit-log`

**Special Features:**
- When changing membership ID, **required** to enter reason
- Change reason is logged in audit trail
- Can view aggregated reports (e.g., "All ID changes this month")

---

### Members

**What They See:**
- ✅ View their own audit log (limited)
- ✅ See when their profile was created
- ✅ See their own profile updates
- ❌ Cannot see who created their account (privacy)
- ❌ Cannot see membership level/ID changes (staff-only info)
- ❌ Cannot see change reasons

**Use Cases:**
- "When did I register?"
- "What changes have I made to my profile?"

**Access:**
- Member dashboard → "Account History" or "Audit Log"
- Direct link: `/member/audit-log`

**Limited View Example:**
```
┌─────────────────────────────────────────────────┐
│ Your Account History                             │
├─────────────────────────────────────────────────┤
│                                                  │
│  📅 Account Created                              │
│  Date: Jan 15, 2024                              │
│                                                  │
│  📝 Profile Updated                              │
│  Date: Feb 5, 2024                               │
│  You updated: Email, Phone                       │
│                                                  │
│  📝 Profile Updated                              │
│  Date: Mar 10, 2024                              │
│  You updated: Address                            │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Database & Triggers
1. Create `member_audit_log` table
2. Create trigger functions
3. Add RLS policies
4. Test triggers with sample data

### Phase 2: Backend Integration
1. Update member creation flow to set `created_by`
2. Update member edit flow to capture change reasons
3. Add API endpoint for audit log queries
4. Add helper functions for audit log queries

### Phase 3: Admin UI
1. Create audit log page component
2. Create timeline component
3. Add filters and search
4. Add export functionality
5. Integrate into member detail page

### Phase 4: Member UI
1. Create limited member audit log view
2. Add to member dashboard
3. Style appropriately for member-facing UI

### Phase 5: Testing & Documentation
1. Test all scenarios
2. Document the system
3. Create user guides

---

## Key Features

### 1. Creation Source Tracking

**Values:**
- `AUTO_IMPORT` - Created via CSV/Excel import
- `SELF_REGISTRATION` - Member registered themselves
- `OFFICE_STAFF` - Created by Office Staff
- `OFFICE_MANAGER` - Created by Office Manager
- `ADMIN` - Created by Admin

**How it works:**
- If `created_by` is NULL → `AUTO_IMPORT`
- If `created_by` = `auth_user_id` → `SELF_REGISTRATION`
- Otherwise, check user role → set appropriate source

### 2. Membership ID Change Tracking

**Who can change:**
- Only Office Manager and Admin

**Requirements:**
- Must enter reason when changing
- Old and new IDs logged
- Timestamp and user logged
- Cannot change to invalid format (enforced by DB)

**UI Flow:**
```
1. Office Manager clicks "Change Membership ID"
2. Modal opens with:
   - Current ID: 20000100
   - New ID input (with validation)
   - Reason field (required)
3. On submit:
   - Validate new ID format
   - Check uniqueness
   - Update member record
   - Trigger logs change to audit log
```

### 3. Membership Level Change Tracking

**Automatic logging:**
- When `current_level` changes
- Old and new values logged
- User and timestamp logged
- If membership ID auto-updates, that's logged separately

**Example:**
```
Member upgraded from Annual → Lifetime
- Log 1: MEMBERSHIP_LEVEL_CHANGED (Annual → Lifetime)
- Log 2: MEMBERSHIP_ID_CHANGED (20000100 → 10000100)
```

### 4. Membership Class Change Tracking

**Rare but possible:**
- Personal → Business (or vice versa)
- Full audit trail maintained
- Old and new values logged

---

## Security & Privacy

### RLS Policies

```sql
-- Office Staff: Can view all audit logs
CREATE POLICY member_audit_log_select_staff ON member_audit_log
  FOR SELECT
  USING (has_role('Office Staff') OR has_role('Office Manager') OR has_role('Admin'));

-- Members: Can only view their own (limited fields)
CREATE POLICY member_audit_log_select_member ON member_audit_log
  FOR SELECT
  USING (
    has_role('Member') AND
    member_id IN (SELECT id FROM members WHERE auth_user_id = auth.uid())
  );
```

### Data Privacy

**Members cannot see:**
- Who created their account (unless they created it themselves)
- Change reasons for staff-initiated changes
- Staff names (can see role only)

**Office Staff can see:**
- All audit entries
- User names and roles
- But not change reasons (if marked sensitive)

**Office Manager/Admin can see:**
- Everything, including all change reasons

---

## Future Enhancements

1. **Email Notifications**
   - Notify member when their membership level changes
   - Notify staff when membership ID is changed

2. **Advanced Analytics**
   - Dashboard showing creation sources over time
   - Most active staff members
   - Common change patterns

3. **Bulk Operations Audit**
   - Track bulk imports
   - Track bulk updates
   - Link to import file metadata

4. **Change Approval Workflow**
   - Require approval for membership ID changes
   - Approval logged in audit trail

---

## Decisions Made ✅

1. **Members see who created their account?**
   - ✅ **No** - Members do not see who created their account (privacy)

2. **Office Staff see change reasons?**
   - ✅ **Yes** - Office Staff can see change reasons (can be tightened later if needed)

3. **Track all field changes or just critical ones?**
   - ✅ **All relevant fields** - Track all editable fields except:
     - `membership_id` (tracked separately as special action)
     - `first_name` and `last_name` (primary member name - not tracked)

4. **Export format preferences?**
   - ✅ **CSV** - CSV export format

5. **Global audit log view?**
   - ✅ **Per-member view + Global for Manager** - Per-member view for all staff, global view for Manager/Admin

---

## Fields Tracked in Audit Log

### ✅ Fields That ARE Tracked

**Membership Information:**
- `member_class` (Personal ↔ Business)
- `current_level` (Community ↔ Annual ↔ Lifetime)
- `is_founding_member` (boolean)
- `member_since` (date)

**Personal Information:**
- `profile_name`
- `nakshatra`
- `family_gotra`

**Secondary/Spouse Information:**
- `secondary_first_name`
- `secondary_last_name`
- `secondary_nakshatra`
- `secondary_email`
- `secondary_phone`

**Business Information:**
- `business_name`
- `business_ein`

**Contact Information:**
- `primary_email`
- `primary_phone`
- `primary_phone_2`

**Address Information:**
- `address_line_1`
- `address_line_2`
- `city`
- `state`
- `zip`
- `country`
- `mailing_address`

**Special Actions:**
- `membership_id` (tracked separately as `MEMBERSHIP_ID_CHANGED` action)

### ❌ Fields That Are NOT Tracked

- `first_name` - Primary member first name (not tracked per requirements)
- `last_name` - Primary member last name (not tracked per requirements)
- `id` - UUID (immutable)
- `auth_user_id` - Auth system field
- `legacy_id` - Legacy import field (read-only)
- `created_at` - System timestamp
- `updated_at` - System timestamp
- `created_by` - Tracked in creation log entry
- `updated_by` - Tracked in each change log entry

---

## Next Steps

1. ✅ **Decisions made** - All questions answered
2. **Begin implementation** following the phases above

---

**Ready to implement!** 🚀
