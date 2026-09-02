# HSNEF Membership Portal - Documentation Index

This directory contains all project documentation organized by category. Use this index to navigate to the documentation you need.

## 📚 Quick Navigation

- [Setup Guides](#setup-guides) - Deployment, configuration, and environment setup
- [Feature Guides](#feature-guides) - Feature-specific documentation and user guides
- [Testing Guides](#testing-guides) - Testing procedures by role
- [Migration Guides](#migration-guides) - Database and data migration instructions
- [Architecture](#architecture) - System architecture and technical design
- [Status Documents](#status-documents) - Implementation status and completion summaries
- [Security](#security) - Security documentation and best practices
- [Audit](#audit) - Audit logging system documentation
- [Troubleshooting](#troubleshooting) - Troubleshooting guides and fixes
- [Terms](#terms) - Terms of use and terminology documentation
- [Reference](#reference) - Reference materials and specifications

---

## Setup Guides

Setup and configuration documentation for deployment and environment configuration.

**Location:** `guides/setup/`

| Document | Description |
|----------|-------------|
| [`deployment.md`](guides/setup/deployment.md) | Complete deployment guide with workflow, troubleshooting, and best practices |
| [`deployment-checklist.md`](guides/setup/deployment-checklist.md) | Step-by-step deployment checklist |
| [`deployment-setup-status.md`](guides/setup/deployment-setup-status.md) | Tracks the status of deployment setup implementation |
| [`vercel-setup-guide.md`](guides/setup/vercel-setup-guide.md) | Step-by-step Vercel project setup instructions |
| [`vercel-oauth-setup.md`](guides/setup/vercel-oauth-setup.md) | Vercel OAuth configuration guide |
| [`supabase-auth-setup.md`](guides/setup/supabase-auth-setup.md) | Complete Supabase authentication setup instructions |
| [`git-secrets-setup.md`](guides/setup/git-secrets-setup.md) | Git secrets configuration for secure credential management |
| [`resend-setup.md`](guides/setup/resend-setup.md) | Resend email service setup |
| [`google-workspace-smtp-setup.md`](guides/setup/google-workspace-smtp-setup.md) | Google Workspace SMTP configuration |
| [`payments-setup.md`](guides/setup/payments-setup.md) | Payment system (Stripe) setup guide |
| [`multi-environment-setup.md`](guides/setup/multi-environment-setup.md) | Multi-environment (dev/staging/prod) configuration |
| [`environment-variables.md`](guides/setup/environment-variables.md) | Comprehensive environment variables reference |

---

## Feature Guides

Feature-specific documentation and user guides for major portal features.

**Location:** `guides/features/`

| Document | Description |
|----------|-------------|
| [`member-import-guide.md`](guides/features/member-import-guide.md) | Complete guide for importing members via CSV |
| [`member-self-registration-guide.md`](guides/features/member-self-registration-guide.md) | Self-registration system documentation |
| [`registration-flow-guide.md`](guides/features/registration-flow-guide.md) | Complete authentication and registration flow documentation |
| [`portal-settings-guide.md`](guides/features/portal-settings-guide.md) | Portal settings configuration guide |
| [`test-accounts-guide.md`](guides/features/test-accounts-guide.md) | Test accounts setup and management |
| [`import-instructions-for-staff.md`](guides/features/import-instructions-for-staff.md) | Quick import instructions for office staff |

---

## Testing Guides

Testing procedures organized by user role.

**Location:** `guides/testing/`

| Document | Description |
|----------|-------------|
| [`testing-guide-admin.md`](guides/testing/testing-guide-admin.md) | Testing procedures for Admin role |
| [`testing-guide-member.md`](guides/testing/testing-guide-member.md) | Testing procedures for Member role |
| [`testing-guide-office-manager.md`](guides/testing/testing-guide-office-manager.md) | Testing procedures for Office Manager role |
| [`testing-guide-office-staff.md`](guides/testing/testing-guide-office-staff.md) | Testing procedures for Office Staff role |
| [`testing-guide-public-user.md`](guides/testing/testing-guide-public-user.md) | Testing procedures for public/unauthenticated users |
| [`testing-guide-all-roles.md`](guides/testing/testing-guide-all-roles.md) | Comprehensive testing guide covering all roles |

---

## Migration Guides

Database and data migration instructions.

**Location:** `guides/migrations/`

| Document | Description |
|----------|-------------|
| [`migration-instructions.md`](guides/migrations/migration-instructions.md) | General database migration instructions |
| [`migration-instructions-update.md`](guides/migrations/migration-instructions-update.md) | Updated migration instructions for latest changes |
| [`test-accounts-migration-instructions.md`](guides/migrations/test-accounts-migration-instructions.md) | Migration instructions for test accounts feature |
| [`test-accounts-membership-id-design.md`](guides/migrations/test-accounts-membership-id-design.md) | Test accounts membership ID design documentation |

---

## Architecture

System architecture, technical design, and system documentation.

**Location:** `architecture/`

| Document | Description |
|----------|-------------|
| [`architecture.md`](architecture/architecture.md) | Complete system architecture documentation (600+ lines) |
| [`events-system.md`](architecture/events-system.md) | Events management system design and implementation |
| [`requests-invoices-system.md`](architecture/requests-invoices-system.md) | Payment requests and invoices system documentation |
| [`versioning.md`](architecture/versioning.md) | Version generation system documentation |

---

## Status Documents

Implementation status, completion summaries, and project milestones.

**Location:** `status/`

| Document | Description |
|----------|-------------|
| [`implementation-status.md`](status/implementation-status.md) | Complete implementation status of all features |
| [`current-status-and-roadmap.md`](status/current-status-and-roadmap.md) | Current project status and future roadmap |
| [`latest-updates-summary.md`](status/latest-updates-summary.md) | Summary of latest updates and changes |
| [`project-complete.md`](status/project-complete.md) | Project completion summary and overview |
| [`foundation-complete.md`](status/foundation-complete.md) | Foundation architecture completion summary |
| [`auth-and-admin-complete.md`](status/auth-and-admin-complete.md) | Authentication and admin features completion summary |

---

## Security

Security documentation, best practices, and security-related guides.

**Location:** `security/`

| Document | Description |
|----------|-------------|
| [`authentication-security-explained.md`](security/authentication-security-explained.md) | Comprehensive authentication security documentation |
| [`magic-link-security-simple.md`](security/magic-link-security-simple.md) | Magic link authentication security overview |
| [`terms-error-escape-hatch.md`](security/terms-error-escape-hatch.md) | Terms acceptance error handling and escape hatch |

---

## Audit

Audit logging system documentation and implementation guides.

**Location:** `audit/`

| Document | Description |
|----------|-------------|
| [`audit-log-implementation-plan.md`](audit/audit-log-implementation-plan.md) | Complete audit log system implementation plan |
| [`audit-log-implementation-summary.md`](audit/audit-log-implementation-summary.md) | Audit log implementation summary and details |
| [`audit-log-user-experience.md`](audit/audit-log-user-experience.md) | User experience design for audit log features (UI/UX specs) |
| [`member-audit-log-proposal.md`](audit/member-audit-log-proposal.md) | Original audit log system proposal |
| [`logging-systems-status.md`](audit/logging-systems-status.md) | Status of all logging systems in the portal |

---

## Troubleshooting

Troubleshooting guides, fixes, and immediate action items.

**Location:** `troubleshooting/`

| Document | Description |
|----------|-------------|
| [`auth-troubleshooting.md`](troubleshooting/auth-troubleshooting.md) | Authentication troubleshooting guide |
| [`auth-google-oauth-fix.md`](troubleshooting/auth-google-oauth-fix.md) | Google OAuth specific fixes and solutions |
| [`immediate-actions.md`](troubleshooting/immediate-actions.md) | Quick action items and immediate fixes needed |

---

## Terms

Terms of use and terminology documentation.

**Location:** `terms/`

| Document | Description |
|----------|-------------|
| [`terms-and-terminology-deployment.md`](terms/terms-and-terminology-deployment.md) | Terms of use deployment guide and terminology updates |
| [`hsnef-membership-portal-terms-of-example.md`](terms/hsnef-membership-portal-terms-of-example.md) | Example terms of use document |

---

## Reference

Reference materials, specifications, and design documents.

**Location:** `reference/`

| Document | Description |
|----------|-------------|
| [`hsnef-membership-portal-final-prompt-v3.md`](reference/hsnef-membership-portal-final-prompt-v3.md) | Original project requirements and specifications |
| [`test-accounts-setup-complete.md`](reference/test-accounts-setup-complete.md) | Test accounts setup completion summary |
| [`test-data-filtering.md`](reference/test-data-filtering.md) | Test data filtering documentation |

### Reference Data Files

**Location:** `reference/data/`

| File | Description |
|------|-------------|
| [`current-member-data-import-template.csv`](reference/data/current-member-data-import-template.csv) | CSV import template with example member data |
| [`current-member-data-import-template-v2.csv`](reference/data/current-member-data-import-template-v2.csv) | Alternative version of import template |
| [`member-details-to-be-captured.csv`](reference/data/member-details-to-be-captured.csv) | Reference file listing all member fields to capture |
| [`nakshatra-list.csv`](reference/data/nakshatra-list.csv) | List of 27 Nakshatras (birth stars) |
| [`purohits.csv`](reference/data/purohits.csv) | Purohit services reference data |
| [`services.csv`](reference/data/services.csv) | Services reference data |

**Note:** For web-served CSV templates used in the import UI, see `public/member-import-template.csv` and `public/member-import-template-blank.csv`.

---

## 📖 How to Use This Documentation

### For New Team Members
1. Start with [`../../README.md`](../../README.md) for project overview
2. Review [`architecture/architecture.md`](architecture/architecture.md) for system understanding
3. Follow [`guides/setup/deployment-checklist.md`](guides/setup/deployment-checklist.md) for initial setup

### For Developers
- **Setup:** See [Setup Guides](#setup-guides)
- **Architecture:** See [Architecture](#architecture)
- **Troubleshooting:** See [Troubleshooting](#troubleshooting)

### For Office Staff
- **Member Import:** [`guides/features/member-import-guide.md`](guides/features/member-import-guide.md)
- **Quick Import:** [`guides/features/import-instructions-for-staff.md`](guides/features/import-instructions-for-staff.md)
- **Registration:** [`guides/features/member-self-registration-guide.md`](guides/features/member-self-registration-guide.md)

### For Administrators
- **Deployment:** See [Setup Guides](#setup-guides)
- **Status:** See [Status Documents](#status-documents)
- **Security:** See [Security](#security)
- **Audit:** See [Audit](#audit)

---

## 🔗 Related Resources

- **Root README:** [`../../README.md`](../../README.md) - Project overview and getting started
- **Main Website:** [hsnef.org](https://hsnef.org)
- **Portal URL:** [member.hsnef.org](https://member.hsnef.org)

---

## 📝 Documentation Standards

- All file names use kebab-case (lowercase with hyphens)
- Documents use relative paths for cross-references
- Each major section includes a brief description
- Status documents are kept up-to-date with implementation progress

---

**Last Updated:** January 2025  
**Total Documents:** 54 markdown files organized into 11 categories
