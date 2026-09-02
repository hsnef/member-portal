# HSNEF Membership Portal - Architecture Document

## Foundation Overview

This document describes the architectural foundation built for the HSNEF Membership Portal. The foundation includes the complete database schema, authentication framework, type safety, and all core infrastructure needed for building the application features.

---

## Table of Contents

1. [Database Architecture](#database-architecture)
2. [MembershipID System](#membershipid-system)
3. [Authentication & Authorization](#authentication--authorization)
4. [Type Safety](#type-safety)
5. [Security Model](#security-model)
6. [Data Model Details](#data-model-details)
7. [Key Design Decisions](#key-design-decisions)

---

## Database Architecture

### Schema Overview

The database consists of **18 core tables** organized into logical domains:

#### Member Domain
- `members` - Core member records (Personal & Business)
- `family_members` - Family members for Personal memberships
- `business_contacts` - Links Business memberships to Personal contacts

#### Membership & Payments Domain
- `memberships` - Annual/Lifetime membership records
- `payments` - All payment transactions
- `receipts` - Immutable payment receipts
- `requests` - Payment requests/invoices

#### Events & Activities Domain
- `events` - Events and camps
- `event_registrations` - Member event registrations
- `ledger_entries` - Activity log per member

#### Security & Audit Domain
- `user_roles` - Role assignments (RBAC)
- `login_audit_logs` - Login attempt tracking
- `registration_invitations` - Member invitation system
- `audit_logs` - Data change audit trail

#### Voting Domain (Phase 2)
- `elections` - Elections and polls
- `election_options` - Options per election
- `votes` - Member votes

### Database Schema Files

1. **`supabase/migrations/20260104000001_initial_schema.sql`**
   - Complete table definitions
   - All constraints and indexes
   - Triggers for auto-generation (MembershipID, Request numbers, Receipt numbers)
   - Helper functions for ID generation

2. **`supabase/migrations/20260104000002_rls_policies.sql`**
   - Row-Level Security policies for all tables
   - Role-based access control functions
   - Permission grants

---

## MembershipID System

### Critical Feature: 8-Digit Enforced Format

The MembershipID is the cornerstone of the membership system. It is **enforced at the database level** with multiple layers of validation.

### Format Specification

```
Format: [Prefix][5 digits][00]

Examples:
- Lifetime:  10000100, 10000200, 10000300
- Annual:    20000100, 20000200, 20000300
- Community: 30000100, 30000200, 30000300
```

### Database Constraints

Three CHECK constraints enforce the format:

1. **Pattern Validation**
   ```sql
   CONSTRAINT chk_membership_id_format CHECK (
     membership_id ~ '^[1-3][0-9]{5}00$'
   )
   ```
   - Must be exactly 8 digits
   - First digit: 1, 2, or 3
   - Must end with 00

2. **Prefix-Level Matching**
   ```sql
   CONSTRAINT chk_membership_id_prefix CHECK (
     (current_level = 'Lifetime' AND LEFT(membership_id, 1) = '1') OR
     (current_level = 'Annual' AND LEFT(membership_id, 1) = '2') OR
     (current_level = 'Community' AND LEFT(membership_id, 1) = '3')
   )
   ```
   - Prefix must match membership level
   - 1 = Lifetime, 2 = Annual, 3 = Community

3. **Uniqueness**
   ```sql
   membership_id VARCHAR(8) NOT NULL UNIQUE
   ```

### Auto-Generation System

**Function:** `generate_membership_id(p_level membership_level)`

**Logic:**
1. Determine prefix based on level (1/2/3)
2. Find maximum existing number for that prefix
3. Increment by 1
4. Format as: `[prefix][5-digit-padded-number]00`

**Trigger:** `trigger_auto_generate_membership_id`
- Fires BEFORE INSERT on members table
- Auto-generates MembershipID if not provided or empty

**Validation Trigger:** `trigger_validate_membership_id_level`
- Fires BEFORE UPDATE when level changes
- Ensures prefix matches new level
- Prevents invalid transitions

### Manual MembershipID Management

- **Who:** Only Office Manager and Admin
- **Audit:** All changes logged to `audit_logs` table
- **Constraints:** New ID must still match format rules

---

## Authentication & Authorization

### Three Authentication Methods

1. **Email/Password**
   - Standard Supabase Auth flow
   - Email verification required

2. **Google OAuth**
   - Configured in Supabase Auth > Providers
   - Identity linking for same email

3. **Membership Number Login**
   - **Custom implementation**
   - User enters MembershipID
   - System looks up member's email
   - Authenticates via email/password
   - See: `lib/auth/helpers.ts` → `loginWithMembershipNumber()`

### Role-Based Access Control (RBAC)

Four roles with hierarchical permissions:

| Role | Description | Permissions |
|------|-------------|-------------|
| **Member** | Default role | View/edit own data, family, payments |
| **Office Staff** | Front desk staff | View all members, create payments, book services |
| **Office Manager** | Office manager | All Staff + financial corrections (90 days), audit logs |
| **Admin** | System admin | Full access, role management, unlimited data changes |

### Role Assignment

- Stored in `user_roles` table
- Users can have multiple roles
- Managed via Admin panel only
- Changes logged in audit trail

### RLS Helper Functions

```typescript
has_role(required_role: UserRole): boolean
has_any_role(required_roles: UserRole[]): boolean
is_own_member_record(member_id: UUID): boolean
get_current_member_id(): UUID
```

---

## Type Safety

### TypeScript Types

**File:** `types/database.ts`

Complete TypeScript definitions for:
- All database tables
- All enums (Nakshatra, MemberClass, MembershipLevel, etc.)
- Supabase Database type for type-safe queries
- Insert/Update/Row types for all tables

### Supabase Client Configuration

**Browser Client:** `lib/supabase/client.ts`
- For client components
- Uses anon key with RLS

**Server Client:** `lib/supabase/server.ts`
- For server components and route handlers
- Cookie-based session management

**Service Client:** `lib/supabase/client.ts` → `createServiceClient()`
- For system operations
- Bypasses RLS (use with extreme caution)

**Middleware Client:** `lib/supabase/middleware.ts`
- For Next.js middleware
- Session refresh

---

## Security Model

### Row-Level Security (RLS)

**All tables have RLS enabled** with role-specific policies.

### Policy Pattern

Each table typically has 4 policy types:

1. **SELECT** - Who can read
2. **INSERT** - Who can create
3. **UPDATE** - Who can modify
4. **DELETE** - Who can remove

### Policy Examples

**Members Table:**
- Members: View own record
- Staff: View all records
- Office Manager: Update all fields
- Admin: Full access

**Payments Table:**
- Members: View own payments
- Staff: View all, create manual entries
- Office Manager: Correct within 90 days
- Admin: Unrestricted

**Receipts Table:**
- Members: View own receipts
- Staff: View all, create, resend email
- **NO DELETE POLICY** (immutable records)

### Time-Based Restrictions

Office Manager role has 90-day restriction on financial corrections:

```sql
CREATE POLICY memberships_update_policy ON memberships
  FOR UPDATE
  USING (
    has_role('Admin') OR
    (has_role('Office Manager') AND created_at > NOW() - INTERVAL '90 days')
  );
```

### Audit Logging

**Login Audits:** `login_audit_logs`
- Every login attempt logged
- IP address, user agent, geo-location
- Success/failure tracking
- Viewable by Office Manager and Admin

**Data Change Audits:** `audit_logs`
- Critical data changes logged
- Old vs new values (JSONB)
- Changed by user ID
- Reason field for manual entries

---

## Data Model Details

### Members Table

**Supports Two Entity Types:**

#### Personal Membership
- Individual/family unit
- Fields: first_name, last_name, nakshatra, family_gotra
- Secondary member (spouse) info
- Links to `family_members` table (up to 4 children)

#### Business Membership
- Organizations/companies
- Fields: business_name, business_ein
- Links to Personal member as contact via `business_contacts` table
- Can have same email as contact's personal account

### Founding Member Flag

**Field:** `is_founding_member` (boolean)

**Rules:**
- Only applies to Lifetime members
- Database constraint enforces this:
  ```sql
  CONSTRAINT chk_founding_member CHECK (
    is_founding_member = FALSE OR current_level = 'Lifetime'
  )
  ```
- Can be set at creation or updated later
- Visible on member profile and digital pass

### Nakshatra Support

**Type:** Enum with 27 values

**Usage:**
- Primary member nakshatra
- Secondary member (spouse) nakshatra
- Each child (up to 4) can have nakshatra

**Constants:** `lib/constants/nakshatras.ts`
- Array of all 27 Nakshatras
- Deity and meaning for each

### Family Structure

**Personal Memberships:**
- 1 Primary member (required)
- 1 Secondary member (optional, typically spouse)
- Up to 4 children (flexible via `family_members` table)

**Business Memberships:**
- Business entity record
- Linked to 1+ Personal members as contacts
- One contact designated as primary

### Payment Request Workflow

1. **Create Request**
   - Office Staff creates a Request (invoice)
   - Links to member or contact email
   - Auto-generates Request number: `REQ-2026-000001`

2. **Send Request**
   - Email sent with secure payment link
   - Status: Draft → Sent

3. **Payment**
   - Online (Stripe) or offline (Cash/Check/Zelle)
   - Payment record created
   - Linked to Request

4. **Receipt Generation**
   - Auto-generated upon payment
   - Receipt number: `RCP-2026-000001`
   - Emailed to payer
   - **Immutable** - cannot be edited or deleted

5. **Request Status Update**
   - Sent → Paid (or Partially Paid)

### Annual Membership Year Rules

**Membership Year:** January 1 - December 31

**Sales Periods:**

| Purchase Date | Applies To | Duration |
|--------------|-----------|----------|
| Jan 1 - Sep 30 | Current year | Rest of current year |
| Oct 1 - Dec 31 | Next year | Oct-Dec + all of next year (~15 months) |

**No Prorating:** Memberships never prorated

**Downgrade Rule:**
- If Annual member doesn't renew → downgraded to Community
- All history preserved
- Can re-upgrade anytime

**Lifetime Rule:**
- Once Lifetime, NEVER downgraded
- Database constraint enforces this

---

## Key Design Decisions

### 1. MembershipID as String, Not Integer

**Decision:** Store as `VARCHAR(8)` not `INTEGER`

**Rationale:**
- Preserve leading zeros (10000100 vs 10000100)
- Simpler pattern matching in SQL
- Avoid integer overflow concerns
- Human-readable format

### 2. Separate Members and Memberships Tables

**Decision:** `members` table (entity) separate from `memberships` table (history)

**Rationale:**
- Members are entities (people/organizations)
- Memberships are time-bound records
- Clean separation of concerns
- Easier to track membership history
- Supports upgrade/downgrade workflows

### 3. Immutable Receipts

**Decision:** Receipts cannot be deleted or modified

**Rationale:**
- Legal/accounting compliance
- Audit trail integrity
- Corrections via reversal entries, not edits
- No DELETE policy on receipts table

### 4. RLS on All Tables

**Decision:** Every table has RLS enabled

**Rationale:**
- Defense in depth
- Prevents accidental data exposure
- Centralized access control
- Easier to audit permissions

### 5. Founding Member as Boolean Flag

**Decision:** `is_founding_member` flag instead of separate membership type

**Rationale:**
- Founding is a designation, not a level
- Keeps 3-level system (Community/Annual/Lifetime)
- Preserves MembershipID prefix system
- Simpler to query and display

### 6. Business Contacts as Separate Table

**Decision:** Link table for Business-to-Personal relationships

**Rationale:**
- Business can have multiple contacts
- Contacts are Personal members with their own MembershipID
- Same email can serve both entities
- Flexible for future expansion (multiple admins per business)

### 7. Triggers for Auto-Generation

**Decision:** Database triggers for MembershipID, Request, Receipt numbers

**Rationale:**
- Guaranteed uniqueness (database level)
- Safe under concurrent requests
- No application-level race conditions
- Consistent format enforcement

### 8. 90-Day Correction Window

**Decision:** Office Manager can only correct financials within 90 days

**Rationale:**
- Accounting best practices
- Prevents unlimited historical changes
- Admin retains full power for exceptions
- Balances flexibility and control

---

## Environment Configuration

### Required Variables

**Supabase:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Stripe:**
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_ANNUAL_MEMBERSHIP_PRICE_ID`
- `STRIPE_LIFETIME_MEMBERSHIP_PRICE_ID`

**Email:**
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `EMAIL_FROM_NAME`

**AI/Chatbot:**
- `OPENROUTER_API_KEY`

**Application:**
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_MAIN_SITE_URL`
- `NEXTAUTH_SECRET`

See `.env.example` for complete list and setup instructions.

---

## Next Implementation Steps

### Phase 1: Core Pages (Priority)

1. **Authentication Pages**
   - `/login` - Email, Google, Membership Number login
   - `/signup` - Member registration
   - `/reset-password` - Password reset flow

2. **Member Dashboard**
   - `/dashboard` - Member overview
   - `/dashboard/profile` - Edit profile
   - `/dashboard/family` - Manage family members
   - `/dashboard/pass` - Membership pass with QR

3. **Payment Pages**
   - `/renew` - Annual membership renewal
   - `/upgrade` - Upgrade to Lifetime
   - `/pay/[requestId]` - Pay a request

### Phase 2: Staff Tools

4. **Staff Dashboard**
   - `/staff` - Staff home
   - `/staff/search` - Member search
   - `/staff/scan` - QR code scanner
   - `/staff/payments` - Manual payment entry

5. **Office Manager Tools**
   - `/manager/reports` - Financial reports
   - `/manager/audit` - Audit log viewer
   - `/manager/corrections` - Payment corrections

### Phase 3: Admin Tools

6. **Admin Panel**
   - `/admin/roles` - Role management
   - `/admin/import` - Data import tool
   - `/admin/settings` - System configuration

### Phase 4: Features

7. **Events**
   - `/events` - Event listing
   - `/events/[id]` - Event details & registration

8. **Voting** (Phase 2)
   - `/elections` - Active elections
   - `/elections/[id]/vote` - Cast vote

### API Routes

```
app/api/
├── auth/
│   ├── login/route.ts
│   ├── membership-login/route.ts
│   └── callback/route.ts
├── members/
│   ├── route.ts (GET, POST)
│   └── [id]/route.ts (GET, PATCH, DELETE)
├── payments/
│   ├── route.ts (POST - create manual payment)
│   └── stripe-checkout/route.ts (POST - create Stripe session)
├── requests/
│   ├── route.ts (GET, POST)
│   └── [id]/route.ts (GET, PATCH)
├── receipts/
│   ├── route.ts (GET)
│   └── [id]/resend/route.ts (POST)
├── webhooks/
│   └── stripe/route.ts (POST - Stripe webhooks)
├── admin/
│   ├── import/route.ts (POST - import members)
│   └── roles/route.ts (GET, POST, DELETE)
└── qr/
    ├── generate/route.ts (POST - generate QR for member)
    └── verify/route.ts (GET - verify QR code)
```

---

## Testing Checklist

### Database Schema
- ✅ All tables created
- ✅ All constraints enforced
- ✅ All triggers functional
- ✅ RLS policies applied
- ⏳ Test data seeding (pending)

### MembershipID System
- ✅ Auto-generation function
- ✅ Format validation
- ✅ Prefix-level matching
- ⏳ Uniqueness under concurrent inserts (needs load testing)

### Authentication
- ⏳ Email/password flow
- ⏳ Google OAuth flow
- ⏳ Membership number login
- ⏳ Identity linking

### Authorization
- ✅ RLS policies defined
- ⏳ Policy testing per role
- ⏳ Audit log generation

### Type Safety
- ✅ Database types defined
- ✅ Supabase clients configured
- ⏳ Type safety in queries (needs actual queries)

---

## Conclusion

The foundation provides:

✅ **Complete database schema** with 18 tables
✅ **Robust MembershipID system** with database-level enforcement
✅ **Comprehensive RLS policies** for 4 roles
✅ **Type-safe architecture** with TypeScript
✅ **Authentication framework** for 3 login methods
✅ **Audit logging** for security and compliance
✅ **Founding member support** as requested
✅ **Nakshatra support** with 27 values
✅ **Personal & Business memberships**
✅ **Payment request/receipt workflow**
✅ **Voting module schema** (Phase 2 ready)

**Ready for:** Feature development (pages, components, API routes, integrations)

**Not included:** UI implementation, Stripe integration code, email templates, QR generation, chatbot implementation

See `../../README.md` for development setup and next steps.
