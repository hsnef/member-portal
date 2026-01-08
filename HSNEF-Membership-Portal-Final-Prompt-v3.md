HSNEF Membership Management Portal – Final Build Prompt (v3)
Overview
You are an expert full‑stack engineer and solution architect.

Build a production‑ready membership management portal for HSNEF with the functional, security, and technical requirements below.

Focus on correctness of the domain model, membership lifecycle, RBAC, audit logging, Stripe flows, Supabase RLS, and Request/Receipt handling. UI can be clean but simple. Core technologies: Next.js (App Router), Supabase (Postgres + Auth + RLS), Stripe, OpenRouter, and a transactional email provider.
​

This membership portal is a supplement to the main HSNEF website (hsnef.org) and focuses purely on membership and membership services. For all core informational content about HSNEF (Bylaws, office bearers, priests, deities, temple hours, static pages, etc.), the portal MUST link back to the main website and MUST NOT duplicate or maintain separate copies of that information.

1. High-Level Goal
Create a secure member portal running on a subdomain (e.g., members.hsnef.org) that:

Manages membership lifecycle (Community, Annual, Lifetime)

Centralizes members/family data and MembershipID

Handles payments (Stripe + offline methods)

Issues digital membership passes with QR codes

Tracks service/event usage and donations

Supports payment Requests and Receipts

Provides admin/staff tools and audit logs

Prepares schema for a future voting module (Phase 2)

The portal integrates with Supabase (auth + Postgres), Stripe, an email provider, and later QuickBooks exports.
​

The portal does not replace the main site; it augments it for membership operations only.

2. Functional Requirements
2.1 Membership Model & MembershipID
2.1.1 Membership Levels
Community Member

Annual Member

Lifetime Member

Rules:

Every person in the system is at least a Community Member once registered.

Paying for Annual membership upgrades Community → Annual for the relevant year.

Paying for Lifetime membership upgrades to Lifetime Member and MUST NEVER be downgraded.

If an Annual Member does not pay for the current year, their level is downgraded to Community Member while preserving all history.

2.1.2 MembershipID format and ranges (Final)
MembershipID MUST always be an 8‑digit numeric value.

MembershipID MUST encode membership level using the first digit, and MUST end with 00:

Lifetime Members

First digit (prefix): 1

Pattern: 1xxxxx00 (8 digits total: 1 + 5 variable digits + 00)

Annual Members

First digit (prefix): 2

Pattern: 2xxxxx00

Community Members

First digit (prefix): 3

Pattern: 3xxxxx00

The 5 middle digits (xxxxx) are sequential or otherwise unique within each category; the system MUST guarantee global uniqueness of MembershipID across all members.

Import behavior

If an Excel membership number:

Is exactly 8 digits,

Starts with 1, 2, or 3 consistent with the member’s level (Lifetime/Annual/Community), and

Ends with 00,
→ Import it directly as MembershipID.

Otherwise (wrong length, wrong prefix, not ending with 00, missing, or duplicate):

Generate a new MembershipID matching the correct pattern for that level (1xxxxx00 / 2xxxxx00 / 3xxxxx00).

Store the original Excel value in legacy_id for traceability.

New members

For new members created in the portal:

The system MUST auto‑generate the next available MembershipID in the correct pattern for the current membership level (Lifetime/Annual/Community).

Generation logic MUST prevent collisions and be safe under concurrent requests.
​

Manual MembershipID adjustment (Office Manager)

Office Manager may manually refresh/regenerate MembershipID in exceptional cases, under these rules:

New MembershipID MUST:

Be 8 digits.

Start with the correct category digit (1/2/3).

End with 00.

Be unique.

When MembershipID is changed:

All related records (memberships, payments, receipts, Requests, ledger entries, etc.) MUST remain associated with the same logical member (internally keyed by a stable DB ID).

An audit log MUST record old ID, new ID, who changed it, when, and an optional reason.
​

Members and regular Office Staff MUST NOT be able to change MembershipID.

2.1.3 Personal vs Business Membership
The system MUST support two membership entity types:

Personal Membership

Business Membership

Personal Membership

Represents an individual/family (default model).

Fields:

Personal name, email, phone, address.

MembershipID and level (Community/Annual/Lifetime).

Business Membership

Represents an organization (company, LLC, non‑profit, etc.).

Fields:

Business/Organization name.

Business address, phone, email.

Tax ID/EIN (optional, for donation/tax receipts).

MembershipID and level.

MUST be linked to at least one contact person who is a Personal membership record:

Contact’s personal name, email, etc.

The contact may have their own Personal membership and MembershipID.

Relationship and email

The same email may be:

The login email for a Personal membership, and

The primary contact email for a Business membership.

These MUST be modeled as:

One Personal member.

One Business member (organization) linked to that person as contact.

Donations & benefits

When a donation is made as a business:

The Payment, Request, and Receipt MUST clearly identify the Business membership as payer (business name, address, tax ID if set).

A Receipt for business donations MUST be suitable as a tax donation letter for the organization.
​

If a business donation triggers Lifetime membership:

The Lifetime status applies to the Business membership record.

Any policy where this also upgrades the personal contact’s membership MUST be explicitly configurable, not automatic.

UI

When a logged‑in user is linked to both Personal and Business memberships:

Flows for donations, Requests, and payments MUST allow “Pay as Personal” vs “Pay as Business”.

Admin views MUST clearly show whether a membership is Personal or Business.

2.2 Annual Membership Year & Renewal Logic
Membership year: January 1 – December 31.

Sales rules

January 1 – September 30

Annual memberships sold apply to the current calendar year.

October 1 – December 31

Annual memberships sold apply to the next calendar year.

The member gets benefits immediately for October–December plus all of next year (~15 months).

Other rules

No prorating at any time.

Member dashboard must clearly show:

Current membership year and validity dates.

Whether a renewal action is for the current year or next year.

Renewal notifications

Automated email (and optionally SMS) reminders:

Prior to expiration (e.g., 60 / 30 / 7 days).

At start of the October renewal window (Navratri / Dashera).

Dashboard banners/alerts for "Active / Expiring / Expired" with a renewal call‑to‑action.

2.3 Member & Family Data
Member profile fields:

MembershipID.

Personal or Business attributes as appropriate.

Membership level and status.

Legacy membership IDs (if present).

Support multiple family members per Personal membership:

Name and relationship.

Members can manage their own family list (add/edit/remove, per business rules).

Admin/Office roles can edit family data, with audit logs.

2.4 Digital Membership Pass & QR Codes
Pass Generation

Generate a digital pass for each active membership.

Boarding‑pass‑style card.

Mobile‑friendly (responsive web).

Real‑time generation or refresh when membership status changes.

Pass Content

MembershipID.

Primary member or business name.

Membership type: Community / Annual / Lifetime.

Expiration date (Annual) or “No Expiry” for Lifetime.

Family members (for Personal) where applicable.

QR code.

QR Code Requirements

QR code encodes a secure reference to MembershipID (e.g., signed token or opaque ID), not raw PII.

QR code MUST reflect current membership status and level; use a signed/time‑bound scheme to prevent spoofing.

When staff scan the QR in a staff UI:

They see membership type, validity, primary name, and family members.
They can attach a service/event booking or check‑in.
The system may auto‑log a visit/check‑in as an activity.

Office-facing QR scan

- The system MUST provide a dedicated staff-only “Scan QR / Check-in” screen accessible to Office Staff, Office Manager, and Admin roles.  
- This screen MUST allow scanning a member’s digital membership pass (QR code) using any of the following devices used by staff:
  - An office desktop or laptop with a webcam (browser-based scanning), or  
  - An optional USB QR scanner that emulates keyboard input into a focused text field, or  
  - A mobile device (Android or iPhone) using its built-in camera via a mobile-friendly web UI.  

Scan behavior

- When the QR is scanned, the portal MUST decode a secure, signed token or opaque reference (not raw PII) that maps to a membership record.  
- The backend MUST validate the token (signature, integrity, and, if implemented, expiry) and resolve it to the correct membership (Personal or Business) and MembershipID.  
- On successful validation, the staff UI MUST display at least:
  - Primary member or business name.  
  - MembershipID and membership type (Community / Annual / Lifetime).  
  - Membership status (Active / Expiring / Expired) and relevant dates.  
  - Linked family members (for Personal memberships), if configured to show.  

Staff actions after scan

- From the scan result view, staff MUST be able to quickly:
  - Record a temple visit/check-in as a ledger activity entry.  
  - Start a booking for services/events (e.g., puja, hall rental, camp registration) against that membership.  
  - Initiate or link a Payment/Request (for membership, events, donations, sponsorships, or services) to that membership.  

Mobile use (Android / iPhone)

- The “Scan QR / Check-in” screen MUST be responsive and optimized for use on Android and iPhone so that office staff can use a phone or tablet as the primary scanner device when logged into the staff portal.  
- On mobile, the scan screen MUST:
  - Use the device camera (e.g., via browser camera APIs or platform QR intent) to read the QR code, and  
  - Follow the same token validation and member lookup flow as on desktop, showing the same membership details and available staff actions.  

Fallback and usability

- If camera access or QR decoding fails, staff MUST have a manual fallback to look up the member by MembershipID, name, email, or phone, with access to the same post-lookup actions.  
- The scan/check-in flow SHOULD be optimized for front-desk usage:
  - Minimal clicks and clear success/error states.  
  - Auto-focus on the input field when using USB scanners.  
  - Fast re-scan capability to handle a line of members efficiently.


2.5 Payments, Requests & Accounting
2.5.1 Payment Methods
Stripe (online).

Check (manual entry).

Cash (manual entry).

Zelle (manual entry with reference).

2.5.2 Payment Behavior
Every payment creates a Payment record linked to:

MembershipID (Personal or Business).

Purpose: Membership (Annual/Lifetime), Event, Donation, Sponsorship, or Request fulfillment.

Amount, currency, date, method.

Online (Stripe) payments:

Use secure server‑side integration and webhooks.
​

On success: update membership and ledger, and send Receipt email.

Offline payments:

Office Staff/Office Manager can record manual payments.

Membership and ledger updated accordingly.

Receipt may be emailed/printed.

2.5.3 QuickBooks / Accounting Integration (v1 minimal)
Provide CSV/Excel exports for QuickBooks including:

MembershipID.

Payment type (Stripe/cash/check/Zelle).

Purpose (Membership/Event/Donation/Request).

Amount, date, transaction IDs.

Direct QuickBooks API integration is not required in v1 but design for future extension.

2.5.4 Requests (Payment Requests)
Introduce a Request object (payment request, similar to an invoice).
​

A Request MUST contain:

Request ID (unique).

Linked membership (Personal/Business) or contact if not yet a member.

Purpose (e.g., “Annual Membership 2027”, “Wedding booking 2026‑03‑15”, “House Puja”, “Hall rental”).

Description (line items or summary).

Amount due and currency.

Optional due date.

Status: Draft / Sent / Partially Paid / Paid / Cancelled / Expired.

Request flows:

Membership renewals:

As membership approaches expiry, system can generate a Request instead of capturing card immediately, and send it via email with a secure payment link.

Office bookings:

When office staff book services (wedding, puja, hall rental, etc.), they can create a Request at the end and send it to the payer for online payment.

Delivery:

Email containing Request summary + secure link to pay via Stripe.

Request → Payment → Receipt:

Paying a Request online:

Stripe payment succeeds → Request status becomes Paid (or Partially Paid).

Payment record is linked to the Request.

Receipt is generated and emailed; reprint/resend allowed.
​

Paying a Request offline:

Staff record a manual Payment against the Request.

Request status updates; Receipt is generated.

Reporting:

Office Manager/Admin can:

List open Requests (unpaid/overdue).

Filter by member, purpose, date, status.

Export Requests to CSV.

2.5.5 Receipts & Reprints
For every payment (Stripe, cash, check, Zelle), the system MUST create a Receipt with at least:
​

Receipt ID.

Date/time.

Payer (linked MembershipID and type: Personal/Business).

Amount and currency.

Payment method.

Purpose (Annual Membership YYYY, Lifetime Membership, Event name, Donation, Sponsorship, Request).

Online payments:

Automatically send Receipt email upon success.

Offline payments:

Staff can mark payment as complete and:

Print a paper Receipt.

Trigger a Receipt email.

Receipt management:

Office Staff, Office Manager, Admin can:

Search past Receipts by MembershipID, date, amount, purpose.

Reprint Receipts for walk‑in members.
​

Resend Receipt emails.

Receipts MUST NOT be deleted; corrections use reversal/adjustment entries rather than editing/removing the original.
​

Implementation hint:

Initial implementation can be HTML Receipts printable via browser and emailable; PDFs can be added later.

2.6 Service Tracking & Activity Ledger
Activity Types

Temple visit check‑ins (QR).

House puja bookings.

Temple archana/pooja services.

Camps.

Donations.

Paid events per person:

Register members/family/guests and charge per attendee.

Ledger

Maintain a running ledger per membership (Personal or Business) recording:

Date/time.

Activity type.

Service/event reference.

Amount and linked Payment/Request if applicable.

Members see their own ledger; staff/Admin see all.

Tracking is forward‑looking only (no required backfill).

2.7 Member Self-Service Portal
Dashboard

Show:

MembershipID and level.

Status and dates.

Digital pass with QR.

Renewal CTA with price and applicable year.

Recent activity and payment history.

For users with Business memberships: an easy way to switch between Personal and Business contexts.

Self-Service Actions

Manage profile and contact info.

Manage family (Personal).

Renew Annual membership via Stripe.

Purchase Lifetime (if allowed).

Register for events/camps (self, family, guests).

Make donations/sponsorships (as Personal or Business).

View Requests and pay them online.

View and download Receipts.

Manage password and communication preferences.

2.8 Administrative & Staff Functions
2.8.1 Roles Model
Implement at least four roles (RBAC):

Member

Office Staff

Office Manager

Admin

Member

Access only their own data.

Self‑service features (profile, family, pass, renewals, events, donations, Requests & Receipts).

Can use the member‑only chatbot.

Office Staff

Can:

Search members by MembershipID, name, email, phone, status.

View member profiles, memberships, family, and history.

Scan QR codes and verify membership.

Book services/events against a member after scanning QR.

Enter new manual payments (cash/check/Zelle).

Create and send Requests.

View payment and activity history.

Cannot:

Reverse or edit existing financial transactions.

Manage roles.

Access login audit logs.

Office Manager

Inherits all Office Staff permissions, plus:

View detailed financial records and reports.

View login and session audit logs and export them.

Reverse, correct, or update financial transactions up to 90 days old:

Membership payments, events, donations, sponsorships, Requests.

For any correction/reversal:

Create an explicit audit log entry (who/when/what changed).

Preserve original transaction records (no hard delete).
​

Transactions older than 90 days are view‑only for Office Manager.

Admin

Full application‑level control.

Can:

Assign roles (Member / Office Staff / Office Manager / Admin).

Configure global settings (Stripe products/prices, email templates, QuickBooks export mappings, Request/Receipt templates, etc.).

View all audit logs (login, data changes, financial).

Manage data migration tools and run imports.

Admin role is for a small, trusted set of operators.
​

2.9 Registration & Onboarding
A member can enter the system in three ways:

Self‑registration after being invited via email.

Office-created record (walk‑in/phone) by Admin or Office Staff.

Data import from Excel (initial one‑time migration and optional ongoing/manual imports).

On creation via UI (Admin/Office Staff):

System generates a new MembershipID.

Default level is Community; Admin/Office Manager may set Annual/Lifetime.

A registration email is sent with a secure first‑time login link.

On creation via import:

System generates MembershipID for each imported row if the existing number is invalid, or uses the existing one if valid.

Legacy membership numbers are stored in legacy_id.

Imported members may optionally be marked as "invited pending registration" so that Admin/Office Manager can trigger bulk or individual registration emails after the import.

Office Manager/Admin can:

Retrigger invitations individually or in bulk.

See registration status (invited / pending / completed) for imported and manually created members.

2.10 Voting Module (Phase 2 – Schema Now, UI Later)
Design DB tables and basic API hooks for future voting:

Elections/polls with options, eligibility rules, open/close dates.

One vote per MembershipID per election.

Option to track participation while keeping ballots anonymous.

No full voting UI is required in v1; just ensure schema and basic abstractions are ready.

2.11 Data Migration
Support a one‑time bulk import from Excel (5–6 years of historical data):

Lifetime membership records.

Annual membership records.

Basic payment info if available.

Excel includes a member_class column indicating Personal or Business membership:

member_class = "Personal" → create a Personal membership record.

member_class = "Business" → create a Business membership record with organization fields and link to a contact person if available.

If member_class is missing/invalid, default to Personal and flag row in the import report for review.

For each imported row:

Assign or validate MembershipID per rules above.

Store any legacy IDs in legacy_id.

Provide an admin-only tool or script to run this import with validation and reporting.

Optionally support smaller follow‑up imports for corrections.

3. Non-Functional & Security Requirements
3.1 Security & RLS
Use Supabase Auth for authentication.
​

Implement Row-Level Security (RLS) on all member and activity tables so that:

Members only access their own records.

Office Staff/Office Manager/Admin see data according to their roles.
​

All sensitive operations (financial corrections, role changes, data migration) are restricted to the appropriate roles.

All connections must use HTTPS; secrets must not be exposed in client code.

3.2 Auth: OAuth, Email/Password & Identity Linking
Authentication methods:

Email + password (Supabase Auth).

OAuth providers (at least Google).
​
​

For a given email, there MUST be exactly one logical user account:

If user signs up with email/password and later uses Google with same verified email, identities are linked to one user.

If user first uses Google and later sets a password, this is linked to the same Supabase user.
​

UX:

Show “Continue with Google” and “Continue with email” on same screen.

Explain that both methods access the same HSNEF account for the same email.

Provide a “Security/Account” page where a user can:

Connect/disconnect OAuth providers.

Set or change password.

System MUST NOT create duplicate member records for the same email; all identities map to one auth_user_id and MembershipID.
​

3.3 Login & Session Audit Logging
Record every successful login in an auth login audit log, including:
​

Timestamp (UTC).

Auth user ID.

MembershipID (if linked).

Source IP address.

User agent string.

Derived geo‑location (country/city) where feasible.

Login method (email/password, Google, etc.).

Audit log MUST be append‑only; corrections are handled via additional entries.

Access to login logs:

Read‑only for Office Manager and Admin.

Not visible to Members or Office Staff.

Provide UI/export to CSV for filtering by date range, user, IP, and outcome.

3.4 Session Management & Expiry
Configure Supabase sessions to use:

A maximum session lifetime (e.g., 12 hours).

An inactivity timeout (e.g., 30–60 minutes) after which the user must log in again.
​

Consider stricter timeouts for Admin and Office Manager sessions.

After expiry, re‑authentication is required (email/password or OAuth).

3.5 Performance & Reliability
The portal must be responsive on mobile and desktop.

QR membership lookups should typically respond within ~1–2 seconds.

Database backups must be enabled.

Stripe webhooks must be idempotent and resilient to retries.
​

3.6 Usability & Design
Mobile‑first, responsive design.

Navigation in the portal should focus on membership and services and link back to hsnef.org for core informational pages.

Suggested portal navigation:

Home (membership‑focused)

Membership (status, renewal, benefits)

Events (registration and history)

Donations (Personal/Business)

Services/Poojas (booking via Requests)

Education/Youth

Links to hsnef.org for: About, Bylaws, Office Bearers, Priests, Deities, Temple Hours, Contact, etc.

Visual style:

“Traditional Hindu temple colors but clean and modern.”

Primary saffron (one of #FF9933, #FF7722, #FF7A0E, #FF902B).

Complementary: warm maroon, muted gold, off‑white/cream.

Avoid heavy blue/gray corporate look.

Use cards, section dividers, and subtle hover/transition animations, keeping performance high.

4. Technical Stack Requirements
4.1 Frontend
Framework: Next.js (latest, App Router) with React + TypeScript.
​

Styling: Tailwind CSS + shadcn/ui.
​

Use App Router (/app) structure with server and client components as appropriate.

4.2 Backend & Database
Backend: Next.js route handlers / API routes.

Database: Supabase Postgres.
​

Suggested core tables (you design exact schema):

members (Personal/Business, MembershipID, entity type, link to auth user)

memberships (Annual/Lifetime records, dates, status)

family_members

payments

receipts

requests

events

event_registrations

ledger_entries (activity log)

email_invitations / registration_tokens

login_audit_logs

roles / role mapping table

Future: elections, election_options, votes

Implement MembershipID as membership_id (8‑digit string) with a unique index and use it externally.

Enable RLS on all sensitive tables with policies enforcing per‑role access.
​

4.3 Auth
Use Supabase Auth email/password + OAuth (Google).
​

Map Supabase auth user → member record → MembershipID.

Store roles (Member/Office Staff/Office Manager/Admin) and enforce via RLS + server‑side checks.

4.4 Payments
Use Stripe for:

Memberships (Annual, Lifetime).

Events/camps.

Donations/sponsorships.

Online payment of Requests.

Implement:

Checkout session creation endpoints.

Webhook handlers to:

Confirm payments.

Update memberships, ledger, Requests.

Trigger email Receipts.
​

4.5 AI / Chatbot
Integrate OpenRouter as LLM provider for a member‑only chatbot.
​

Accessible only after login.

API key stored server‑side.

4.6 Hosting & Infra
Deploy on Vercel.
​

App must support running behind a custom domain/subdomain (Cloudflare fronting configured externally).

4.7 Email
Use a transactional email service (e.g., Resend or SMTP provider).

Use it for:

Registration/invite links.

Membership renewal reminders.

Payment receipts.

Request emails.

Event reminders.

Future election notices.

4.8 Environment & DevOps
All secrets via environment variables:

Supabase URL, anon key, service role key.

Stripe secret key and webhook secret(s).

OpenRouter API key.

Email provider keys / SMTP config.

Provide a README with:

Local dev setup.

Required env vars (.env.example).

DB schema overview.

How to deploy to Vercel.

5. Deliverables
A working Next.js App Router app with Supabase and Stripe wired per above.

Supabase SQL or migration scripts for schema + RLS policies.

API routes for auth‑linked operations, Stripe webhooks, membership/Request flows.

Login audit logging implementation.

Basic but functional UI for:

Member dashboard and digital pass.

Requests and Receipts.

Admin/staff dashboards for search, payments, ledger, exports.

README and .env.example file.

Focus on correctness, security, and maintainability over visual complexity.