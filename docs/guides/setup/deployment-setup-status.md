# Deployment Setup Status

This document tracks the status of the deployment setup implementation.

## ✅ Completed (Code/Documentation)

### Git Setup
- [x] Created `dev` branch from `main`
- [x] Pushed `dev` branch to GitHub
- [x] Configured local git to track `dev` branch
- [x] All code changes committed to `dev` branch

### Documentation Created
- [x] `deployment.md` - Complete deployment guide with workflow, troubleshooting, etc.
- [x] `environment-variables.md` - Comprehensive environment variables reference
- [x] `vercel-setup-guide.md` - Step-by-step Vercel project setup instructions
- [x] `deployment-setup-status.md` - This status document

### GitHub Actions
- [x] Created `.github/workflows/deploy.yml` - Optional GitHub Actions workflow
  - Note: Vercel's built-in GitHub Integration is recommended instead (simpler)
  - GitHub Actions workflow is available as fallback/optional

### Code Changes
- [x] Version generation system (already in place)
- [x] Footer component with version display (already in place)
- [x] All deployment-related files committed to `dev` branch

## 🔄 Manual Setup Required (Vercel Dashboard)

These steps need to be completed manually in the Vercel dashboard. Follow `vercel-setup-guide.md` for detailed instructions.

### Vercel Projects Setup

#### Dev Project (`dev-msp`)
- [ ] Create `dev-msp` project in Vercel
- [ ] Link to GitHub repository: `hsnef/member-portal`
- [ ] Configure production branch to `dev`
- [ ] Configure build settings (Next.js, npm run build)
- [ ] Add all environment variables (see `environment-variables.md`)
- [ ] Deploy project
- [ ] Verify deployment URL (should be `dev-portal.vercel.app` or similar)
- [ ] Update `NEXT_PUBLIC_APP_URL` with actual dev URL
- [ ] Redeploy after updating environment variables

#### Prod Project (`prod-hsnef`)
- [ ] Create `prod-hsnef` project in Vercel
- [ ] Link to GitHub repository: `hsnef/member-portal`
- [ ] Verify production branch is `main`
- [ ] Configure build settings
- [ ] Add all environment variables (production values)
- [ ] Deploy project
- [ ] Add custom domain: `member.hsnef.org`
- [ ] Configure DNS records for custom domain
- [ ] Wait for SSL certificate provisioning
- [ ] Update `NEXT_PUBLIC_APP_URL` to `https://member.hsnef.org`
- [ ] Redeploy after domain is active

### Stripe Webhook Configuration
- [ ] Create webhook endpoint for dev: `https://dev-portal.vercel.app/api/stripe/webhook`
- [ ] Copy dev webhook signing secret
- [ ] Add `STRIPE_WEBHOOK_SECRET` to `dev-msp` Vercel project
- [ ] Create webhook endpoint for prod: `https://member.hsnef.org/api/stripe/webhook`
- [ ] Copy prod webhook signing secret
- [ ] Add `STRIPE_WEBHOOK_SECRET` to `prod-hsnef` Vercel project

### Authentication Configuration

#### Google OAuth
- [ ] Go to Google Cloud Console
- [ ] Navigate to APIs & Services → Credentials
- [ ] Edit OAuth 2.0 Client ID
- [ ] Add redirect URIs:
  - `https://dev-portal.vercel.app/auth/callback`
  - `https://member.hsnef.org/auth/callback`
  - `http://localhost:3000/auth/callback` (if not already added)
  - Supabase callback URL (if not already added)
- [ ] Save changes

#### Supabase Redirect URLs
- [ ] Go to Supabase Dashboard
- [ ] Navigate to Authentication → URL Configuration
- [ ] Set Site URL: `https://member.hsnef.org` (or dev for testing)
- [ ] Add Redirect URLs (comma-separated):
  ```
  https://dev-portal.vercel.app/auth/callback,https://dev-portal.vercel.app/**,
  https://member.hsnef.org/auth/callback,https://member.hsnef.org/**,
  http://localhost:3000/auth/callback,http://localhost:3000/**
  ```
- [ ] Save changes

### GitHub Integration (Vercel)
- [ ] Verify both projects are linked to GitHub
- [ ] Verify `dev-msp` production branch is `dev`
- [ ] Verify `prod-hsnef` production branch is `main`
- [ ] Confirm automatic deployments are enabled
- [ ] (Optional) Enable production approval requirement for `prod-hsnef`

### GitHub Actions (Optional)

If using GitHub Actions instead of Vercel Integration:

- [ ] Get Vercel tokens:
  - `VERCEL_TOKEN` - Get from Vercel Dashboard → Settings → Tokens
  - `VERCEL_ORG_ID` - Get from Vercel API or project settings
  - `VERCEL_PROJECT_ID_DEV` - Get from `dev-msp` project settings
  - `VERCEL_PROJECT_ID_PROD` - Get from `prod-hsnef` project settings
- [ ] Add secrets to GitHub repository:
  - Go to GitHub repo → Settings → Secrets and variables → Actions
  - Add each secret
- [ ] Test workflow by pushing to `dev` branch

**Note**: Vercel's built-in GitHub Integration is recommended over GitHub Actions (simpler setup, automatic).

## ✅ Testing & Verification

After manual setup is complete:

- [ ] Test dev deployment at `https://dev-portal.vercel.app`
- [ ] Test authentication flows in dev (Google OAuth, Magic Link)
- [ ] Verify version number displays in footer
- [ ] Test prod deployment at `https://member.hsnef.org`
- [ ] Test authentication flows in prod
- [ ] Verify all critical user flows work
- [ ] Test payment flows (if applicable)
- [ ] Verify automatic deployments work (push to `dev` triggers dev deployment)
- [ ] Verify automatic deployments work (push to `main` triggers prod deployment)

## 📋 Quick Start Checklist

Once Vercel projects are set up, follow this order:

1. **Create Vercel Projects** (follow `vercel-setup-guide.md`)
   - Create `dev-msp` project
   - Create `prod-hsnef` project

2. **Configure Environment Variables** (follow `environment-variables.md`)
   - Add all variables to both projects
   - Update `NEXT_PUBLIC_APP_URL` after deployments

3. **Configure Custom Domain** (production only)
   - Add `member.hsnef.org` to `prod-hsnef` project
   - Configure DNS records
   - Wait for SSL certificate

4. **Configure Stripe Webhooks**
   - Create dev webhook in Stripe
   - Add webhook secret to `dev-msp`
   - Create prod webhook in Stripe
   - Add webhook secret to `prod-hsnef`

5. **Update Authentication URLs**
   - Update Google OAuth redirect URLs
   - Update Supabase redirect URLs

6. **Test Deployments**
   - Test dev deployment
   - Test prod deployment
   - Test authentication flows
   - Verify automatic deployments

## 📚 Reference Documents

- **`deployment.md`** - Complete deployment workflow and guide
- **`environment-variables.md`** - All environment variables reference
- **`vercel-setup-guide.md`** - Step-by-step Vercel setup instructions
- **`../../architecture/versioning.md`** - Version generation system documentation

## Notes

- All code changes are complete and committed to `dev` branch
- Vercel project creation must be done manually (can't be automated)
- Environment variables must be set in Vercel dashboard (not in code for security)
- Authentication redirect URLs must be configured in external services (Google, Supabase)
- GitHub Actions workflow is optional - Vercel Integration is recommended
- DNS configuration for custom domain requires access to DNS provider for `hsnef.org`

## Next Steps

1. Follow `vercel-setup-guide.md` to create Vercel projects
2. Configure environment variables using `environment-variables.md`
3. Set up authentication redirect URLs
4. Test deployments
5. Mark items as complete in this checklist
