# Member Audit Log - Implementation Plan

> **Historical — an implementation PLAN, not a description of what exists.**
> Several components it names were never created under those paths (`GlobalAuditLogView.tsx`, `MemberAuditLogTimeline.tsx`, `AuditLogFilters.tsx`, `ChangeMembershipIdModal.tsx`, `app/member/audit-log/page.tsx`). What shipped is `components/admin/AuditLogTimeline.tsx` and `/admin/members/[id]/audit-log`.
> It is kept for background and is deliberately NOT updated as the code changes,
> so expect stale filenames, routes, component names, colours and URLs.
> For current state see [`docs/PROJECT-HUB.md`](../PROJECT-HUB.md) and
> [`docs/PRIORITY-ROADMAP.md`](../PRIORITY-ROADMAP.md).

## Overview

This document outlines the step-by-step implementation plan for the Member Audit Log system based on approved decisions.

---

## Implementation Phases

### Phase 1: Database Schema & Triggers ✅ Ready

**Tasks:**
1. Create `member_audit_log` table migration
2. Create trigger function for member creation logging
3. Create trigger function for member field change logging
4. Add indexes for performance
5. Add RLS policies
6. Test triggers with sample data

**Files to Create:**
- `supabase/migrations/[timestamp]_member_audit_log.sql`

**Estimated Time:** 2-3 hours

---

### Phase 2: TypeScript Types & Helpers

**Tasks:**
1. Add `MemberAuditLog` interface to `types/database.ts`
2. Create helper functions for querying audit logs
3. Create utility functions for formatting audit log data

**Files to Modify:**
- `types/database.ts` - Add interface
- `lib/audit-log/helpers.ts` - New file for helper functions

**Estimated Time:** 1-2 hours

---

### Phase 3: API Routes

**Tasks:**
1. Create API route for fetching member audit log
2. Create API route for fetching global audit log (Manager/Admin)
3. Create API route for exporting audit log to CSV
4. Add proper role-based access control

**Files to Create:**
- `app/api/members/[id]/audit-log/route.ts`
- `app/api/admin/audit-logs/route.ts`
- `app/api/members/[id]/audit-log/export/route.ts`

**Estimated Time:** 2-3 hours

---

### Phase 4: Admin UI - Member Audit Log Page

**Tasks:**
1. Create audit log page component
2. Create timeline component
3. Add filters (action type, date range, creation source)
4. Add search functionality
5. Integrate into member detail page

**Files to Create:**
- `app/admin/members/[id]/audit-log/page.tsx`
- `components/admin/MemberAuditLogTimeline.tsx`
- `components/admin/AuditLogFilters.tsx`

**Files to Modify:**
- `app/admin/members/[id]/page.tsx` - Add "View Audit Log" button

**Estimated Time:** 4-5 hours

---

### Phase 5: Admin UI - Global Audit Log View

**Tasks:**
1. Create global audit log page (Manager/Admin only)
2. Add advanced filtering (member, staff, date range, action type)
3. Add export to CSV functionality
4. Add to admin navigation

**Files to Create:**
- `app/admin/audit-logs/page.tsx`
- `components/admin/GlobalAuditLogView.tsx`

**Files to Modify:**
- `lib/navigation.ts` - Add the nav item (was `components/admin/AdminLayout.tsx`,
  removed in the 2026-08 design-system port; nav is now data, rendered by PortalShell)

**Estimated Time:** 3-4 hours

---

### Phase 6: Member UI - Limited Audit Log View

**Tasks:**
1. Create member-facing audit log page
2. Filter to show only member's own changes
3. Hide sensitive information (who created, staff names, etc.)
4. Add to member dashboard

**Files to Create:**
- `app/member/audit-log/page.tsx`
- `components/member/MemberAuditLogView.tsx`

**Files to Modify:**
- `app/member/page.tsx` - Add link to audit log

**Estimated Time:** 2-3 hours

---

### Phase 7: Membership ID Change UI

**Tasks:**
1. Create modal/component for changing membership ID
2. Add required reason field
3. Validate new ID format
4. Show confirmation with audit log entry
5. Add to member detail page (Manager/Admin only)

**Files to Create:**
- `components/admin/ChangeMembershipIdModal.tsx`

**Files to Modify:**
- `app/admin/members/[id]/page.tsx` - Add "Change Membership ID" button

**Estimated Time:** 2-3 hours

---

### Phase 8: Integration & Testing

**Tasks:**
1. Test member creation logging (all sources)
2. Test field change logging (all fields)
3. Test membership ID change logging
4. Test RLS policies (all roles)
5. Test export functionality
6. Test UI components
7. Performance testing (large audit logs)

**Estimated Time:** 3-4 hours

---

### Phase 9: Documentation

**Tasks:**
1. Update `../architecture/architecture.md` with audit log system
2. Create user guide for staff
3. Create admin guide for audit log management
4. Update `../status/project-complete.md`

**Files to Modify:**
- `../architecture/architecture.md`
- `../status/project-complete.md`

**Files to Create:**
- `audit-log-user-guide.md` (if needed)

**Estimated Time:** 2-3 hours

---

## Total Estimated Time

**Approximately 21-30 hours** of development time.

---

## Implementation Order

### Week 1: Foundation
- Phase 1: Database Schema & Triggers
- Phase 2: TypeScript Types & Helpers
- Phase 3: API Routes

### Week 2: Admin UI
- Phase 4: Admin UI - Member Audit Log Page
- Phase 5: Admin UI - Global Audit Log View
- Phase 7: Membership ID Change UI

### Week 3: Member UI & Polish
- Phase 6: Member UI - Limited Audit Log View
- Phase 8: Integration & Testing
- Phase 9: Documentation

---

## Key Implementation Details

### Database Trigger Logic

The trigger will:
1. Compare OLD and NEW values for each tracked field
2. Build JSONB object with changed fields
3. Create single log entry per update (unless membership_id changes)
4. Membership ID changes get separate log entry

### Field Change Format

```json
{
  "primary_email": {
    "old": "old@example.com",
    "new": "new@example.com"
  },
  "primary_phone": {
    "old": "(555) 123-4567",
    "new": "(555) 987-6543"
  },
  "current_level": {
    "old": "Annual",
    "new": "Lifetime"
  }
}
```

### UI Component Structure

```
MemberAuditLogPage
├── AuditLogHeader (title, filters, export button)
├── AuditLogSummary (creation info, stats)
├── AuditLogTimeline
│   ├── AuditLogEntry (for each log entry)
│   │   ├── ActionIcon
│   │   ├── ActionDetails
│   │   ├── ChangedFields (expandable)
│   │   └── Metadata (who, when, reason)
└── Pagination
```

---

## Testing Checklist

### Database
- [ ] Member creation logs correctly (all sources)
- [ ] Field changes log correctly (all fields)
- [ ] Membership ID changes log correctly
- [ ] Triggers don't cause performance issues
- [ ] RLS policies work correctly

### API
- [ ] Audit log API returns correct data
- [ ] Role-based access works
- [ ] Export API generates correct CSV
- [ ] Pagination works correctly

### UI
- [ ] Timeline displays correctly
- [ ] Filters work correctly
- [ ] Search works correctly
- [ ] Export works correctly
- [ ] Membership ID change flow works
- [ ] Member view shows limited data

### Integration
- [ ] Member creation flow logs correctly
- [ ] Member edit flow logs correctly
- [ ] Membership ID change logs correctly
- [ ] All roles see appropriate data

---

## Ready to Begin! 🚀

All decisions have been made and documented. We can now proceed with implementation starting with Phase 1.
