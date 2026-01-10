# Multi-Environment OAuth & Deployment Setup

Complete guide for managing OAuth and configuration across all your environments.

## Your Environments

| Environment | URL | Vercel Project | Branch | Purpose |
|-------------|-----|----------------|--------|---------|
| **🏠 Local** | `http://localhost:3000` | N/A | dev | **Primary Development & Testing** |
| **🧪 Dev** | `https://dev.member.hsnef.org` | dev.member | dev | Integration Testing & QA |
| **🚀 Production** | `https://member.hsnef.org` | member | main | Live site |

**Note**: Most of your development and testing will happen on **localhost:3000** using the `.env.local` file. The dev and production environments are for integration testing and deployment.

---

## Table of Contents
1. [Recommended Architecture](#recommended-architecture)
2. [Local Development Setup](#local-development-setup)
3. [Supabase Configuration](#supabase-configuration)
4. [Google OAuth Configuration](#google-oauth-configuration)
5. [Vercel Environment Variables](#vercel-environment-variables)
6. [Step-by-Step Setup](#step-by-step-setup)
7. [Testing Each Environment](#testing-each-environment)

---

## Recommended Architecture

### Option A: Single Supabase Project (Simpler)
✅ **Recommended for your use case**
- Use ONE Supabase project for all environments
- Configure multiple redirect URLs
- Use environment variables to differentiate
- **Pros**: Simpler, shared data for testing
- **Cons**: Dev/staging data mixes with production

### Option B: Separate Supabase Projects (Enterprise)
- Dev Supabase project → Local + Dev Vercel
- Staging Supabase project → Staging Vercel
- Prod Supabase project → Production only
- **Pros**: Complete isolation, safer
- **Cons**: More complex, need to sync schema changes

**For now, let's go with Option A (Single Supabase)**. You can migrate to Option B later if needed.

---

## Local Development Setup

### Overview

**http://localhost:3000** is your **primary development environment** where you'll do most coding and testing.

### Setup Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure `.env.local` File**

   Copy the existing `.env.local` file or create one with these key settings:

   ```bash
   # Local development URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # Supabase (same as dev/production)
   NEXT_PUBLIC_SUPABASE_URL=https://gapvsdrzavjaublwkqfm.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

   # Email (Resend - same as dev/production)
   RESEND_API_KEY=<your-resend-key>
   EMAIL_FROM=noreply@portal.hsnef.org
   EMAIL_FROM_NAME=HSNEF Membership Portal
   EMAIL_REPLY_TO=member-portal@hsnef.org

   # Stripe (Use TEST keys)
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<test-publishable-key>
   STRIPE_SECRET_KEY=<test-secret-key>
   STRIPE_WEBHOOK_SECRET=<use-stripe-cli-webhook-secret>

   # Security (can use dev secrets for local)
   NEXTAUTH_SECRET=<your-dev-secret>
   JWT_SECRET=<your-dev-jwt-secret>
   QR_TOKEN_SECRET=<your-dev-qr-secret>

   # Node environment
   NODE_ENV=development
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

   App will be available at: http://localhost:3000

### Local Testing with Stripe

For local Stripe webhook testing, use the Stripe CLI:

```bash
# Install Stripe CLI (one-time)
# Windows: scoop install stripe
# Mac: brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to localhost
stripe listen --forward-to localhost:3000/api/stripe/webhook

# This will give you a webhook signing secret starting with whsec_
# Add it to your .env.local as STRIPE_WEBHOOK_SECRET
```

### What Works on Localhost

✅ **Works perfectly:**
- Google OAuth sign-in (will redirect back to localhost)
- Magic link emails (will redirect back to localhost)
- QR code generation (will use localhost URL)
- QR code scanning (will work on localhost)
- Stripe test payments (use test cards)
- All database operations
- All feature development

⚠️ **Limitations:**
- Stripe webhooks require Stripe CLI for local testing
- Can't test production domain-specific issues
- Can't test deployment-specific issues
- HTTPS-only features need workarounds

### Development Workflow

1. **Code locally on localhost:3000** ← Most testing happens here
2. **Test basic functionality** (auth, payments, QR codes)
3. **Push to `dev` branch** → Auto-deploys to dev.member.hsnef.org
4. **Test integration on dev environment** (webhook, emails, end-to-end)
5. **Merge to `main` branch** → Auto-deploys to member.hsnef.org
6. **Final testing on production** (real payments, live features)

---

## Supabase Configuration

### Step 1: Configure Supabase Authentication URLs

1. **Go to Supabase Dashboard**
   - Visit [app.supabase.com](https://app.supabase.com)
   - Select your project: `gapvsdrzavjaublwkqfm`

2. **Set Site URL** (Primary URL)
   - Go to **Authentication** → **URL Configuration**
   - Set **Site URL** to your production domain:
     ```
     https://member.hsnef.org
     ```

   Note: This is the default redirect after auth. We'll override this per environment using env vars.

3. **Add ALL Redirect URLs**
   - In **Redirect URLs**, add all three environments:
     ```
     http://localhost:3000/**
     https://dev.member.hsnef.org/**
     https://member.hsnef.org/**
     ```

   The `/**` wildcard allows all paths under these domains.

   **Important**: `http://localhost:3000/**` is critical for local development!

4. **Save Changes**

---

## Google OAuth Configuration

### Configure Google Cloud Console

1. **Go to Google Cloud Console**
   - Visit [console.cloud.google.com](https://console.cloud.google.com)
   - Select your project

2. **Update OAuth 2.0 Credentials**
   - Go to **APIs & Services** → **Credentials**
   - Click your existing OAuth 2.0 Client ID

3. **Add ALL Authorized Redirect URIs**

   **Required URI (Supabase callback)**:
   ```
   https://gapvsdrzavjaublwkqfm.supabase.co/auth/v1/callback
   ```

   **Optional (direct app callbacks)**:
   ```
   http://localhost:3000/auth/callback
   https://dev.member.hsnef.org/auth/callback
   https://[project2-staging-url].vercel.app/auth/callback
   https://member.hsnef.org/auth/callback
   ```

   Note: The Supabase callback is the most important one. The direct app callbacks are optional as Supabase handles the redirect.

4. **Save Changes**

---

## Vercel Environment Variables

### Vercel Project Structure

You have 2 separate Vercel projects:

**Project 1: "dev.member"**
- Git Branch: `dev`
- Custom Domain: `https://dev.member.hsnef.org` (Cloudflare validated)
- Vercel Domain: `devportal-iota.vercel.app` (unused)
- Purpose: Testing and QA

**Project 2: "member"**
- Git Branch: `main`
- Custom Domain: `https://member.hsnef.org` (Cloudflare validated)
- Vercel Domain: `member-eosin.vercel.app` (unused)
- Purpose: Live production site

### Environment Variable Strategy

You'll configure environment variables separately in each Vercel project:

#### Dev Environment Variables (Project "dev.member" → dev.member.hsnef.org)

```bash
# ============================================================================
# ENVIRONMENT
# ============================================================================
NODE_ENV=development
NEXT_PUBLIC_APP_URL=https://dev.member.hsnef.org

# ============================================================================
# SUPABASE
# ============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://gapvsdrzavjaublwkqfm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# ============================================================================
# EMAIL (Resend)
# ============================================================================
RESEND_API_KEY=<your-resend-key>
EMAIL_FROM=noreply@portal.hsnef.org
EMAIL_FROM_NAME=HSNEF Membership Portal
EMAIL_REPLY_TO=member-portal@hsnef.org

# ============================================================================
# STRIPE (Use Test Mode Keys)
# ============================================================================
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<your-stripe-test-publishable-key>
STRIPE_SECRET_KEY=<your-stripe-test-secret-key>
STRIPE_WEBHOOK_SECRET=<webhook-secret-for-dev-url>

# ============================================================================
# SECURITY
# ============================================================================
NEXTAUTH_SECRET=<dev-specific-secret>
JWT_SECRET=<dev-jwt-secret>
QR_TOKEN_SECRET=<dev-qr-secret>
```

#### Production Environment Variables (Project "member" → member.hsnef.org)

```bash
# ============================================================================
# ENVIRONMENT
# ============================================================================
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://member.hsnef.org

# ============================================================================
# SUPABASE (Same as Dev)
# ============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://gapvsdrzavjaublwkqfm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# ============================================================================
# EMAIL (Resend - Same as Dev)
# ============================================================================
RESEND_API_KEY=<your-resend-key>
EMAIL_FROM=noreply@portal.hsnef.org
EMAIL_FROM_NAME=HSNEF Membership Portal
EMAIL_REPLY_TO=member-portal@hsnef.org

# ============================================================================
# STRIPE (Use LIVE Mode Keys when ready, Test for now)
# ============================================================================
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<your-stripe-live-publishable-key>
STRIPE_SECRET_KEY=<your-stripe-live-secret-key>
STRIPE_WEBHOOK_SECRET=<webhook-secret-for-main-url>

# ============================================================================
# SECURITY (Different secrets from Dev!)
# ============================================================================
NEXTAUTH_SECRET=<main-specific-secret>
JWT_SECRET=<main-jwt-secret>
QR_TOKEN_SECRET=<main-qr-secret>
```

### How to Set Environment Variables in Vercel

Since you have 2 separate Vercel projects, configure each independently:

#### Project 1: "dev.member"

1. **Go to Vercel Project Settings**
   - Navigate to: https://vercel.com/dashboard → **dev.member** project
   - Go to: **Settings** → **Environment Variables**

2. **Add Each Variable**
   - Click **Add New**
   - Enter Name and Value (e.g., `NEXT_PUBLIC_APP_URL` = `https://dev.member.hsnef.org`)
   - Under "Environment", select:
     - ☑ **Production** (for your custom domain)
   - Click **Save**

3. **Repeat for all dev environment variables** listed above

#### Project 2: "member"

1. **Go to Vercel Project Settings**
   - Navigate to: https://vercel.com/dashboard → **member** project
   - Go to: **Settings** → **Environment Variables**

2. **Add Each Variable**
   - Click **Add New**
   - Enter Name and Value (e.g., `NEXT_PUBLIC_APP_URL` = `https://member.hsnef.org`)
   - Under "Environment", select:
     - ☑ **Production** (for your custom domain)
   - Click **Save**

3. **Repeat for all production environment variables** listed above

#### Key Variables That MUST Be Different:
- `NEXT_PUBLIC_APP_URL` (dev vs production URL)
- `NEXTAUTH_SECRET`, `JWT_SECRET`, `QR_TOKEN_SECRET` (different for security isolation)
- `STRIPE_WEBHOOK_SECRET` (different webhook for each environment)
- `NODE_ENV` (development for dev, production for member)

---

## Step-by-Step Setup

### Phase 1: Configure Supabase & Google OAuth

1. **Update Supabase** (5 min)
   - Go to: https://app.supabase.com → your project
   - **Authentication** → **URL Configuration**
   - Site URL: `https://member.hsnef.org`
   - Redirect URLs: Add both:
     ```
     http://localhost:3000/**
     https://dev.member.hsnef.org/**
     https://member.hsnef.org/**
     ```
   - Save

2. **Update Google OAuth** (3 min)
   - Go to: https://console.cloud.google.com
   - **APIs & Services** → **Credentials** → Your OAuth Client
   - Add to Authorized Redirect URIs:
     ```
     https://gapvsdrzavjaublwkqfm.supabase.co/auth/v1/callback
     http://localhost:3000/auth/callback
     https://dev.member.hsnef.org/auth/callback
     https://member.hsnef.org/auth/callback
     ```
   - Save

### Phase 2: Configure Vercel Environment Variables

1. **Set Up Dev Project ("dev.member")**
   - Go to Vercel → **dev.member** project → Settings → Environment Variables
   - Add all variables from "Dev Environment Variables" section above
   - For each variable, select Environment: **Production**
   - Create Stripe webhook: `https://dev.member.hsnef.org/api/stripe/webhook`
   - Add the webhook secret to Vercel as `STRIPE_WEBHOOK_SECRET`

2. **Set Up Production Project ("member")**
   - Go to Vercel → **member** project → Settings → Environment Variables
   - Add all variables from "Production Environment Variables" section
   - For each variable, select Environment: **Production**
   - Create Stripe webhook: `https://member.hsnef.org/api/stripe/webhook`
   - Add the webhook secret to Vercel as `STRIPE_WEBHOOK_SECRET`

3. **Redeploy Both Projects**
   - In **dev.member** project → Deployments → Latest → Redeploy
   - In **member** project → Deployments → Latest → Redeploy

### Phase 3: Test Both Environments

1. **Test Dev Environment**
   - Visit: https://dev.member.hsnef.org
   - Test Google OAuth login
   - Test Magic Link
   - Verify redirects work correctly
   - Test Stripe payment (test mode)

2. **Test Production Environment**
   - Visit: https://member.hsnef.org
   - Test Google OAuth login
   - Test Magic Link
   - Verify redirects work correctly
   - Test Stripe payment (when ready to go live)

---

## Testing Each Environment

### Local Development (http://localhost:3000)

```bash
# In your .env.local
NEXT_PUBLIC_APP_URL=http://localhost:3000
# ... other local values

# Run locally
npm run dev
```

**Test:**
- ✅ Google OAuth works
- ✅ Magic links work
- ✅ Stripe test payments work
- ✅ Redirects stay on localhost

### Dev Environment (dev.member.hsnef.org)

**Test:**
- ✅ Visit `https://dev.member.hsnef.org`
- ✅ Google OAuth redirects properly (no localhost)
- ✅ Magic links redirect to dev URL
- ✅ QR codes generate with dev URL
- ✅ Test Stripe payments work

### Production (member.hsnef.org)

**Test:**
- ✅ OAuth works on custom domain
- ✅ Magic links use custom domain
- ✅ QR codes use custom domain
- ✅ LIVE Stripe payments work
- ✅ SSL certificate is active

---

## Environment Variable Reference

### Required for ALL Environments

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App URL (DIFFERENT per environment)
NEXT_PUBLIC_APP_URL=

# Email
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# Stripe (TEST keys for dev/staging, LIVE for production)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Security
QR_TOKEN_SECRET=
```

### Optional

```bash
# Database (for admin tools)
DATABASE_URL=

# Google OAuth (if needed in code, but usually not)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

---

## Stripe Webhook Configuration

You'll need 2 separate webhooks (one per environment):

### Dev Webhook (for "dev.member" project)
- **URL**: `https://dev.member.hsnef.org/api/stripe/webhook`
- **Mode**: Test mode
- **Events**: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
- **Secret**: Add to **dev.member** Vercel project as `STRIPE_WEBHOOK_SECRET`

### Production Webhook (for "member" project)
- **URL**: `https://member.hsnef.org/api/stripe/webhook`
- **Mode**: Live mode (or Test mode until ready to go live)
- **Events**: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
- **Secret**: Add to **member** Vercel project as `STRIPE_WEBHOOK_SECRET`

---

## Branch Strategy

### Current Setup

```
main
│
└── Deployed to: https://member.hsnef.org (Production)

dev
│
└── Deployed to: https://dev.member.hsnef.org (Development/Testing)
```

### Git Workflow

```bash
# Work on feature
git checkout dev
git pull origin dev
git checkout -b feature/my-feature

# Commit and push
git add .
git commit -m "Add feature"
git push origin feature/my-feature

# Merge to dev (triggers dev.member.hsnef.org deploy)
git checkout dev
git merge feature/my-feature
git push origin dev

# Test on dev environment
# Visit https://dev.member.hsnef.org and test thoroughly

# When ready for production, merge to main branch
git checkout main
git pull origin main
git merge dev
git push origin main

# This triggers member.hsnef.org deployment
```

---

## Quick Reference: URLs to Configure

### Supabase Dashboard
✅ Add to Redirect URLs:
```
http://localhost:3000/**
https://dev.member.hsnef.org/**
https://member.hsnef.org/**
```

### Google OAuth Console
✅ Add to Authorized Redirect URIs:
```
https://gapvsdrzavjaublwkqfm.supabase.co/auth/v1/callback
http://localhost:3000/auth/callback
https://dev.member.hsnef.org/auth/callback
https://member.hsnef.org/auth/callback
```

### Vercel Projects
Two separate projects:
- **Project "dev.member"**: `dev` branch → https://dev.member.hsnef.org
- **Project "member"**: `main` branch → https://member.hsnef.org

---

## Troubleshooting

### "Redirect URI mismatch" on Dev
- Check Supabase includes dev URL in redirect list
- Check Google OAuth includes Supabase callback
- Clear browser cache, try incognito

### Environment variables not updating
- After changing vars in Vercel, you MUST redeploy
- Go to Deployments → ••• → Redeploy

### Still redirecting to wrong URL
- Check `NEXT_PUBLIC_APP_URL` is set correctly in Vercel
- Verify it's set for the right environment (Production vs Preview)
- Remember: `NEXT_PUBLIC_*` vars are embedded at build time

### Magic links going to wrong URL
- Check Supabase Site URL setting
- Check email template (if customized)
- Verify `NEXT_PUBLIC_APP_URL` in env vars

---

## Next Steps

### Setup Checklist
1. ✅ Configure Supabase with both dev and main URLs
2. ✅ Configure Google OAuth with both callback URLs
3. ✅ Set Vercel environment variables for dev branch
4. ✅ Set Vercel environment variables for main branch
5. ✅ Create Stripe webhooks for both environments
6. ✅ Test dev environment end-to-end
7. ✅ Test production environment end-to-end

---

## Summary

**Your multi-environment setup is now configured:**
- **Local**: `http://localhost:3000` (uses .env.local)
- **Dev**: `https://dev.member.hsnef.org` (dev branch)
- **Production**: `https://member.hsnef.org` (main branch)

**Key points:**
1. Both environments use the same Supabase project
2. Both environments use separate Stripe webhooks
3. Security secrets (NEXTAUTH_SECRET, JWT_SECRET, QR_TOKEN_SECRET) are different between environments
4. Test all features on dev before merging to main
5. Use Stripe test mode on dev, live mode on main (when ready)
