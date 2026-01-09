# Multi-Environment OAuth & Deployment Setup

Complete guide for managing OAuth and configuration across all your environments.

## Your Environments

| Environment | URL | Vercel Project | Branch | Purpose |
|-------------|-----|----------------|--------|---------|
| **Local** | `http://localhost:3000` | N/A | dev | Development |
| **Dev/Preview** | `https://dev-portalhsnef-oxemr6fhv-hsnef-member-portal.vercel.app` | Project 1 | dev | Testing/QA |
| **Staging** | `https://[project2-url].vercel.app` (TBD) | Project 2 | main/prod | Pre-production |
| **Production** | `https://portal.hsnef.org` | Project 2 | main/prod | Live site |

---

## Table of Contents
1. [Recommended Architecture](#recommended-architecture)
2. [Supabase Configuration](#supabase-configuration)
3. [Google OAuth Configuration](#google-oauth-configuration)
4. [Vercel Environment Variables](#vercel-environment-variables)
5. [Step-by-Step Setup](#step-by-step-setup)
6. [Testing Each Environment](#testing-each-environment)

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

## Supabase Configuration

### Step 1: Configure Supabase Authentication URLs

1. **Go to Supabase Dashboard**
   - Visit [app.supabase.com](https://app.supabase.com)
   - Select your project: `gapvsdrzavjaublwkqfm`

2. **Set Site URL** (Primary URL)
   - Go to **Authentication** → **URL Configuration**
   - Set **Site URL** to your production domain:
     ```
     https://portal.hsnef.org
     ```

   Note: This is the default redirect after auth. We'll override this per environment using env vars.

3. **Add ALL Redirect URLs**
   - In **Redirect URLs**, add all four environments:
     ```
     http://localhost:3000/**
     https://dev-portalhsnef-oxemr6fhv-hsnef-member-portal.vercel.app/**
     https://[project2-staging-url].vercel.app/**
     https://portal.hsnef.org/**
     ```

   The `/**` wildcard allows all paths under these domains.

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
   https://dev-portalhsnef-oxemr6fhv-hsnef-member-portal.vercel.app/auth/callback
   https://[project2-staging-url].vercel.app/auth/callback
   https://portal.hsnef.org/auth/callback
   ```

   Note: The Supabase callback is the most important one. The direct app callbacks are optional as Supabase handles the redirect.

4. **Save Changes**

---

## Vercel Environment Variables

### Vercel Project Structure

You have 2 Vercel projects:

**Project 1 (Dev):**
- Name: `member-portal-dev` (or current name)
- Git Branch: `dev`
- URL: `https://dev-portalhsnef-oxemr6fhv-hsnef-member-portal.vercel.app`
- Purpose: Automatic deployments from `dev` branch

**Project 2 (Production):**
- Name: `member-portal` or `member-portal-prod`
- Git Branch: `main` or `prod`
- URLs:
  - Vercel: `https://[project2-url].vercel.app` (staging/preview)
  - Custom: `https://portal.hsnef.org` (production)
- Purpose: Production deployments

### Environment Variable Strategy

For each Vercel project, set environment-specific values:

#### Project 1 (Dev) - Environment Variables

```bash
# ============================================================================
# ENVIRONMENT
# ============================================================================
NODE_ENV=development
NEXT_PUBLIC_APP_URL=https://dev-portalhsnef-oxemr6fhv-hsnef-member-portal.vercel.app

# ============================================================================
# SUPABASE
# ============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://gapvsdrzavjaublwkqfm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# ============================================================================
# EMAIL (Resend)
# ============================================================================
RESEND_API_KEY=<your-resend-dev-key>
RESEND_FROM_EMAIL=dev@hsnef.org  # or test email

# ============================================================================
# STRIPE (Use Test Mode Keys)
# ============================================================================
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<your-stripe-test-publishable-key>
STRIPE_SECRET_KEY=<your-stripe-test-secret-key>
STRIPE_WEBHOOK_SECRET=<webhook-secret-for-dev-url>

# ============================================================================
# SECURITY
# ============================================================================
QR_TOKEN_SECRET=<dev-specific-secret>
```

#### Project 2 (Production) - Environment Variables

Set different values for **Preview** vs **Production** deployment environments:

**For Preview Deployments** (Vercel URL):
```bash
NEXT_PUBLIC_APP_URL=https://[project2-url].vercel.app
# Use test/staging Stripe keys, same Supabase
```

**For Production Deployments** (Custom Domain):
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://portal.hsnef.org

# Same Supabase (or production Supabase if using Option B)
NEXT_PUBLIC_SUPABASE_URL=https://gapvsdrzavjaublwkqfm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Production Email
RESEND_API_KEY=<your-resend-prod-key>
RESEND_FROM_EMAIL=noreply@hsnef.org

# Stripe LIVE Mode Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<your-stripe-live-publishable-key>
STRIPE_SECRET_KEY=<your-stripe-live-secret-key>
STRIPE_WEBHOOK_SECRET=<webhook-secret-for-prod-url>

# Production Security
QR_TOKEN_SECRET=<prod-specific-secret>
```

### How to Set Environment Variables in Vercel

1. **Go to Vercel Project Settings**
   - Navigate to project → **Settings** → **Environment Variables**

2. **Add Each Variable**
   - Click **Add New**
   - Enter Name and Value
   - **Important**: Select which environments:
     - ☑ **Production** - For custom domain (portal.hsnef.org)
     - ☑ **Preview** - For Vercel preview URLs
     - ☐ **Development** - Skip (use local .env.local)

3. **Use Different Values Per Environment**
   - For `NEXT_PUBLIC_APP_URL`, set:
     - Production: `https://portal.hsnef.org`
     - Preview: `https://[project2-url].vercel.app`

---

## Step-by-Step Setup

### Phase 1: Get Dev Environment Working (Now)

1. **✅ Update Supabase** (5 min)
   - Site URL: `https://portal.hsnef.org`
   - Redirect URLs: Add dev Vercel URL
   - Save

2. **✅ Update Google OAuth** (3 min)
   - Add Supabase callback URL
   - Add dev Vercel callback URL
   - Save

3. **✅ Configure Vercel Project 1 (Dev)** (10 min)
   - Add all environment variables
   - Set `NEXT_PUBLIC_APP_URL` to dev Vercel URL
   - Use Stripe TEST keys
   - Redeploy

4. **✅ Test Dev Environment**
   - Visit dev Vercel URL
   - Test Google OAuth
   - Test Magic Link
   - Verify redirects work

### Phase 2: Set Up Production Project (Later)

1. **Create Vercel Project 2**
   - Import same GitHub repo
   - Connect to `main` or `prod` branch
   - Note the Vercel URL

2. **Configure Environment Variables**
   - Add all variables
   - Use PRODUCTION Stripe keys for Production env
   - Use TEST Stripe keys for Preview env

3. **Add Custom Domain**
   - In Vercel Project 2 → Settings → Domains
   - Add `portal.hsnef.org`
   - Configure DNS (Vercel will show instructions)

4. **Update Supabase & Google**
   - Add production URLs to redirect lists
   - Already done if you added them in Phase 1!

5. **Configure Stripe Webhooks**
   - Create webhook for `https://portal.hsnef.org/api/stripe/webhook`
   - Use production webhook secret

6. **Test Production**
   - Test on Vercel preview URL first
   - Then test on custom domain
   - Verify payments work (small test transaction)

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

### Dev Environment (dev Vercel URL)

**Test:**
- ✅ Visit `https://dev-portalhsnef-oxemr6fhv-hsnef-member-portal.vercel.app`
- ✅ Google OAuth redirects properly (no localhost)
- ✅ Magic links redirect to dev URL
- ✅ QR codes generate with dev URL
- ✅ Test Stripe payments work

### Staging (Project 2 Preview URL)

**Test:**
- ✅ Deploy from `main` branch triggers preview
- ✅ OAuth works on preview URL
- ✅ Test payments work
- ✅ All features work before going to prod

### Production (portal.hsnef.org)

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

You'll need 3 separate webhooks (one per public environment):

### Dev Webhook
- **URL**: `https://dev-portalhsnef-oxemr6fhv-hsnef-member-portal.vercel.app/api/stripe/webhook`
- **Mode**: Test mode
- **Events**: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
- **Secret**: Add to Project 1 env vars as `STRIPE_WEBHOOK_SECRET`

### Staging Webhook (Optional)
- **URL**: `https://[project2-url].vercel.app/api/stripe/webhook`
- **Mode**: Test mode
- **Secret**: Add to Project 2 Preview env vars

### Production Webhook
- **URL**: `https://portal.hsnef.org/api/stripe/webhook`
- **Mode**: Live mode
- **Secret**: Add to Project 2 Production env vars

---

## Branch Strategy

### Current Setup

```
main (or prod)
│
├── Deployed to: Vercel Project 2 (Production)
│   ├── Preview: https://[project2-url].vercel.app
│   └── Production: https://portal.hsnef.org
│
dev
│
└── Deployed to: Vercel Project 1 (Dev)
    └── https://dev-portalhsnef-oxemr6fhv-hsnef-member-portal.vercel.app
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

# Merge to dev (triggers Project 1 deploy)
git checkout dev
git merge feature/my-feature
git push origin dev

# Test on dev environment
# Visit dev Vercel URL and test

# When ready for production, merge to main
git checkout main
git merge dev
git push origin main

# This triggers Project 2 deploy to production
```

---

## Quick Reference: URLs to Configure

### Supabase Dashboard
✅ Add to Redirect URLs:
```
http://localhost:3000/**
https://dev-portalhsnef-oxemr6fhv-hsnef-member-portal.vercel.app/**
https://[project2-url].vercel.app/**
https://portal.hsnef.org/**
```

### Google OAuth Console
✅ Add to Authorized Redirect URIs:
```
https://gapvsdrzavjaublwkqfm.supabase.co/auth/v1/callback
http://localhost:3000/auth/callback
https://dev-portalhsnef-oxemr6fhv-hsnef-member-portal.vercel.app/auth/callback
https://[project2-url].vercel.app/auth/callback
https://portal.hsnef.org/auth/callback
```

### Vercel Projects
- **Project 1 (Dev)**: Branch `dev` → Dev URL
- **Project 2 (Prod)**: Branch `main` → Preview URL + Custom Domain

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

### Immediate (Phase 1)
1. ✅ Configure Supabase with dev URL
2. ✅ Configure Google OAuth
3. ✅ Set Vercel Project 1 environment variables
4. ✅ Test dev environment end-to-end

### Later (Phase 2)
1. ⏳ Create Vercel Project 2 for production
2. ⏳ Set up custom domain `portal.hsnef.org`
3. ⏳ Configure production environment variables
4. ⏳ Set up production Stripe webhook
5. ⏳ Test staging/production environments

---

## Summary

**Right now, focus on getting Project 1 (Dev) working:**
1. Update Supabase URLs ← **Do this first**
2. Update Google OAuth ← **Do this second**
3. Set Vercel env vars ← **Do this third**
4. Test dev environment ← **Verify it works**

Once dev is stable, you can set up production (Project 2) later. The same Supabase/Google config will work for all environments since we're adding all URLs upfront.
