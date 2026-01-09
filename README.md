# HSNEF Membership Portal

Production-ready membership management portal for the Hindu Society of North East Florida (HSNEF).

## Overview

This portal manages membership lifecycle (Community, Annual, Lifetime), handles payments via Stripe, issues membership passes with QR codes, tracks service usage, and provides administrative tools for staff and office managers.

**Subdomain:** portal.hsnef.org
**Main Website:** [hsnef.org](https://hsnef.org)

## Tech Stack

- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth (Email/Password, Google OAuth, Membership Number)
- **Payments:** Stripe
- **Email:** Resend
- **AI/Chatbot:** OpenRouter
- **Hosting:** Vercel

## Features

### Core Functionality

- ✅ **8-digit MembershipID System**
  - Format: `[1|2|3][5 digits][00]`
  - First digit: 1=Lifetime, 2=Annual, 3=Community
  - Database constraints and auto-generation via triggers

- ✅ **Membership Types**
  - Personal memberships (individual/family)
  - Business memberships (organizations with contact person)
  - Founding member designation for Lifetime members

- ✅ **Member Data Management**
  - Full profile with Nakshatra (27 birth stars)
  - Family Gotra (lineage)
  - Secondary member (spouse) information
  - Up to 4 children per family

- ✅ **Authentication**
  - Email/Password login
  - Google OAuth
  - Membership number login

- ✅ **Role-Based Access Control (RBAC)**
  - Member
  - Office Staff
  - Office Manager
  - Admin

- ✅ **Payment Processing**
  - Stripe integration (online)
  - Manual entry (Cash, Check, Zelle)
  - Payment Requests (invoices)
  - Receipts (immutable records)

- ✅ **Events & Services**
  - Event registration
  - Service tracking
  - Activity ledger per member

- ✅ **Security & Audit**
  - Row-Level Security (RLS) policies
  - Login audit logs
  - Data change audit trails

- ✅ **Voting Module (Phase 2 Schema)**
  - Elections/polls
  - One vote per member per election
  - Anonymous ballot tracking

## Project Structure

```
member-portal/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   └── globals.css          # Global styles
├── lib/                     # Utilities and helpers
│   ├── auth/
│   │   └── helpers.ts       # Auth helper functions
│   ├── constants/
│   │   └── nakshatras.ts    # Nakshatra constants
│   └── supabase/
│       ├── client.ts        # Browser client
│       ├── server.ts        # Server client
│       └── middleware.ts    # Middleware client
├── types/
│   └── database.ts          # TypeScript types for database
├── supabase/
│   └── migrations/
│       ├── 20260104000001_initial_schema.sql     # Database schema
│       └── 20260104000002_rls_policies.sql       # RLS policies
├── public/                  # Static assets
├── middleware.ts            # Next.js middleware for auth
├── .env.example             # Environment variables template
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Stripe account
- Resend account
- OpenRouter account (for chatbot)

### 1. Clone and Install

```bash
git clone <repository-url>
cd member-portal
npm install
```

### 2. Set Up Supabase

1. Create a new project at [app.supabase.com](https://app.supabase.com)

2. Run migrations:
   ```bash
   # Option A: Via Supabase SQL Editor (recommended for first time)
   # - Copy contents of supabase/migrations/20260104000001_initial_schema.sql
   # - Paste and run in Supabase SQL Editor
   # - Copy contents of supabase/migrations/20260104000002_rls_policies.sql
   # - Paste and run in Supabase SQL Editor

   # Option B: Via Supabase CLI
   supabase link --project-ref your-project-ref
   supabase db push
   ```

3. Enable Authentication Providers:
   - Go to Authentication > Providers
   - Enable Email provider
   - Enable Google OAuth provider
   - Configure Google OAuth credentials

4. Get your credentials:
   - Go to Settings > API
   - Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Set Up Stripe

1. Create account at [stripe.com](https://stripe.com)

2. Create products:
   - Annual Membership (recurring yearly)
   - Lifetime Membership (one-time payment)

3. Set up webhook endpoint:
   - Endpoint URL: `https://your-domain/api/webhooks/stripe`
   - Events to listen: `payment_intent.succeeded`, `checkout.session.completed`

4. Get credentials:
   - Dashboard > Developers > API keys
   - Copy Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Copy Secret key → `STRIPE_SECRET_KEY`
   - Copy Webhook signing secret → `STRIPE_WEBHOOK_SECRET`

### 4. Set Up Email (Resend)

1. Create account at [resend.com](https://resend.com)

2. Verify domain: `portal.hsnef.org`

3. Add DNS records as instructed

4. Get API key → `RESEND_API_KEY`

### 5. Set Up OpenRouter (Optional - for chatbot)

1. Create account at [openrouter.ai](https://openrouter.ai)

2. Get API key → `OPENROUTER_API_KEY`

### 6. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in all values. See `.env.example` for detailed instructions.

**CRITICAL:** Never commit `.env.local` to git!

### 7. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Database Schema Overview

### Core Tables

- **members** - Personal and Business memberships with 8-digit MembershipID
- **family_members** - Family members for Personal memberships
- **business_contacts** - Links Business memberships to Personal contacts
- **memberships** - Annual/Lifetime membership records
- **user_roles** - Role assignments (Member/Staff/Manager/Admin)
- **payments** - All payment records (Stripe, Cash, Check, Zelle)
- **receipts** - Immutable payment receipts
- **requests** - Payment requests/invoices
- **events** - Events and camps
- **event_registrations** - Event registrations per member
- **ledger_entries** - Activity log per member
- **login_audit_logs** - Login attempt tracking
- **registration_invitations** - Member invitation tokens
- **audit_logs** - Data change audit trail

### Voting Module (Phase 2)

- **elections** - Elections/polls
- **election_options** - Options per election
- **votes** - Member votes (one per election)

## MembershipID Format

**Critical:** The 8-digit MembershipID system is enforced at the database level.

### Format: `[Prefix][5 digits][00]`

| Level | Prefix | Example | Range |
|-------|--------|---------|-------|
| Lifetime | 1 | 10000100 | 10000100 - 19999900 |
| Annual | 2 | 20000100 | 20000100 - 29999900 |
| Community | 3 | 30000100 | 30000100 - 39999900 |

### Rules

1. **Auto-generation:** System generates next available ID for the level
2. **Prefix validation:** First digit must match membership level
3. **Suffix validation:** Must end with '00'
4. **Uniqueness:** Enforced via unique constraint
5. **Manual updates:** Only Office Manager can manually adjust (with audit log)

## Authentication Methods

### 1. Email/Password
Standard Supabase Auth email/password flow.

### 2. Google OAuth
Configured via Supabase Authentication > Providers.

### 3. Membership Number Login
Custom implementation:
1. User enters MembershipID
2. System looks up member's email
3. User enters password
4. Authenticates via email/password flow

**Implementation:** See `lib/auth/helpers.ts` → `loginWithMembershipNumber()`

## Row-Level Security (RLS)

All tables have RLS enabled with role-based policies:

| Role | Permissions |
|------|-------------|
| **Member** | View/edit own data, family, payments, events |
| **Office Staff** | View all members, create payments/requests, book services |
| **Office Manager** | All Staff permissions + financial corrections (90 days), view audit logs |
| **Admin** | Full access + role management + unrestricted data changes |

See `supabase/migrations/20260104000002_rls_policies.sql` for complete policy definitions.

## Founding Members

Lifetime members can be designated as "Founding Members" via the `is_founding_member` boolean flag.

- Only applies to Lifetime members (database constraint enforced)
- Can be set during member creation or updated later
- Visible on member profile and digital pass

## Nakshatra Support

27 Nakshatras (birth stars) are supported for astrological purposes:

- Member nakshatra
- Secondary member (spouse) nakshatra
- Up to 4 children nakshatras

**List:** See `lib/constants/nakshatras.ts`

## Annual Membership Rules

### Membership Year
January 1 - December 31

### Sales Rules

| Purchase Period | Applies To | Benefits |
|----------------|-----------|----------|
| Jan 1 - Sep 30 | Current year | Current year only |
| Oct 1 - Dec 31 | Next year | Oct-Dec + all of next year (~15 months) |

### No Prorating
Memberships are never prorated.

## Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

### Environment Variables

Set all environment variables in Vercel dashboard:
- Project Settings > Environment Variables
- Add all variables from `.env.example`
- Use production values for Stripe, Supabase, etc.

### Custom Domain

1. Add domain in Vercel: `portal.hsnef.org`
2. Update DNS records as instructed
3. Configure Cloudflare (if using) to proxy through

## Data Migration

### Import Legacy Data

1. Prepare Excel file with columns matching `CurrentMemberData_import-template-csv.csv`

2. Create import script:
   ```typescript
   // app/api/admin/import/route.ts
   // Parse CSV and insert into members table
   // System auto-generates MembershipID if missing/invalid
   // Stores original ID in legacy_id field
   ```

3. Run import via Admin UI or API call

4. Review import report for validation errors

5. Send registration invitations to imported members

## Development Guidelines

### Code Style
- TypeScript strict mode enabled
- Use Server Components by default
- Client Components only when needed (interactivity, browser APIs)
- Prefer server-side data fetching

### Security
- Never expose service role key to client
- Always validate user input
- Use prepared statements (Supabase does this)
- Implement CSRF protection for mutations
- Rate limit sensitive endpoints

### Database
- Use RLS for all access control
- Never bypass RLS in client code
- Use service role only for system operations
- Create audit log entries for sensitive changes

### Testing
```bash
# Run linter
npm run lint

# Type check
npx tsc --noEmit

# Build check
npm run build
```

## API Routes Structure

```
app/api/
├── auth/
│   ├── login/route.ts
│   ├── signup/route.ts
│   └── membership-login/route.ts
├── members/
│   ├── route.ts
│   └── [id]/route.ts
├── payments/
│   └── route.ts
├── webhooks/
│   └── stripe/route.ts
├── admin/
│   ├── import/route.ts
│   └── roles/route.ts
└── events/
    └── route.ts
```

## Support & Documentation

- **Main Website:** [hsnef.org](https://hsnef.org)
- **Requirements Doc:** `HSNEF-Membership-Portal-Final-Prompt-v3.md`
- **Member Fields:** `MemberDetailsTobeCaptured-csv.csv`
- **Import Template:** `CurrentMemberData_import-template-csv.csv`

## License

Proprietary - Hindu Society of North East Florida

---

## Next Steps After Foundation

1. **Implement Authentication Pages**
   - Login page (email, Google, membership number)
   - Signup flow
   - Password reset

2. **Member Dashboard**
   - Profile management
   - Membership pass with QR code
   - Family management
   - Payment history

3. **Staff Tools**
   - Member search
   - QR scanner
   - Manual payment entry
   - Request creation

4. **Payment Integration**
   - Stripe checkout flows
   - Webhook handlers
   - Receipt generation

5. **Email Templates**
   - Registration invitations
   - Renewal reminders
   - Payment confirmations
   - Event notifications

6. **Admin Panel**
   - Role management
   - Data import tool
   - Audit log viewer
   - Reports and exports

7. **Digital Pass**
   - QR code generation
   - Pass rendering
   - Verification system

8. **Testing**
   - Unit tests
   - Integration tests
   - E2E tests
