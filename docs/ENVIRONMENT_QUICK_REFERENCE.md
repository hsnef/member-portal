# Environment Quick Reference

> ### ⚠️ Some variables below do not exist
>
> Verified against the code 2026-09-03 — **nothing in this codebase reads**
> `NEXTAUTH_SECRET` or `JWT_SECRET`.
> They were planned or copied in and never wired up. Do not provision keys or
> set values for them; you will be configuring nothing.
>
> The canonical list of variables the code *actually* reads is
> [`.env.local.example`](../.env.local.example).

> **The canonical variable list is [`.env.local.example`](../.env.local.example)**,
> which is checked against the code. Where this file disagrees with it, it wins.

Quick reference guide for your three environments.

---

## 🌍 Your Three Environments

| 🏠 **Localhost** | 🧪 **Dev** | 🚀 **Production** |
|------------------|------------|-------------------|
| http://localhost:3000 | https://dev.member.hsnef.org | https://member.hsnef.org |
| **Primary development & testing** | Integration testing & QA | Live site for real users |
| Uses `.env.local` | Vercel project: "dev.member" | Vercel project: "member" |
| Branch: `dev` (local) | Branch: `dev` (deployed) | Branch: `main` (deployed) |
| Stripe: Test mode + CLI | Stripe: Test mode | Stripe: Live mode |

---

## 🔑 Configuration URLs to Add

### Supabase Redirect URLs
**Location**: https://app.supabase.com → Authentication → URL Configuration

✅ Add these to "Redirect URLs":
```
http://localhost:3000/**
https://dev.member.hsnef.org/**
https://member.hsnef.org/**
```

### Google OAuth Callback URLs
**Location**: https://console.cloud.google.com → APIs & Services → Credentials

✅ Add these to "Authorized redirect URIs":
```
https://gapvsdrzavjaublwkqfm.supabase.co/auth/v1/callback
http://localhost:3000/auth/callback
https://dev.member.hsnef.org/auth/callback
https://member.hsnef.org/auth/callback
```

---

## ⚙️ Key Environment Variables

### Must Be DIFFERENT Across Environments

| Variable | Localhost | Dev | Production |
|----------|-----------|-----|------------|
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://dev.member.hsnef.org` | `https://member.hsnef.org` |
| `NODE_ENV` | `development` | `development` | `production` |
| `QR_TOKEN_SECRET` | (local/dev secret) | (dev secret) | **(different!)** |
| `ZELLE_TOKEN_SECRET` | (local/dev secret) | (dev secret) | **(different!)** |
| `CRON_SECRET` | (not needed) | (dev secret) | **(different!)** |
| `STRIPE_WEBHOOK_SECRET` | (from Stripe CLI) | (dev webhook) | **(prod webhook)** |

### Supabase — DIFFERENT per environment since 2026-09-02

> ⚠️ **This section used to say these were the same everywhere. They are not.**
> The environments were split on 2026-09-02 (DEC-006). Local and dev share the
> dev project; production has its own.

| Variable | Local & Dev | Production |
|----------|-------------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://bcujsesgrzijyisvmnwm.supabase.co` (`dev-mp`) | `https://gapvsdrzavjaublwkqfm.supabase.co` (`prod-mp`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (dev anon key) | (prod anon key) |
| `SUPABASE_SERVICE_ROLE_KEY` | (dev service role key) | (prod service role key) |

**`gapvsdrzavjaublwkqfm` is PRODUCTION.** It was the single shared project before
the split and kept its ref, so anything written before 2026-09-02 — including the
Google OAuth callback URL above — shows it as "dev". Point local work at
`bcujsesgrzijyisvmnwm`.

### Same Across All Environments

| Variable | Value |
|----------|-------|
| `RESEND_API_KEY` | (your Resend key) |
| `EMAIL_FROM` | `noreply@portal.hsnef.org` |
| `EMAIL_FROM_NAME` | `HSNEF Membership Portal` |
| `EMAIL_REPLY_TO` | `member-portal@hsnef.org` |

> `EMAIL_FROM` stays on `portal.hsnef.org` deliberately — that domain carries the
> `resend._domainkey` record and is the verified sending domain. `member.hsnef.org`
> serves the app but is not verified in Resend. Changing it breaks email.

---

## 🚀 Deployment Workflow

```
┌─────────────────────────────────────────────────┐
│  1. Code & Test on Localhost                   │
│     http://localhost:3000                       │
│     - Make changes                              │
│     - Test Google OAuth                         │
│     - Test magic links                          │
│     - Test QR codes                             │
│     - Test Stripe payments                      │
└─────────────────────┬───────────────────────────┘
                      │
                      ↓ git push origin dev
┌─────────────────────────────────────────────────┐
│  2. Auto-Deploy to Dev                          │
│     https://dev.member.hsnef.org                │
│     - Vercel auto-deploys from dev branch       │
│     - Test webhooks work                        │
│     - Test email links                          │
│     - Test end-to-end flows                     │
└─────────────────────┬───────────────────────────┘
                      │
                      ↓ git merge dev → main
┌─────────────────────────────────────────────────┐
│  3. Auto-Deploy to Production                   │
│     https://member.hsnef.org                    │
│     - Vercel auto-deploys from main branch      │
│     - Switch to Stripe live mode (when ready)   │
│     - Real users access this environment        │
└─────────────────────────────────────────────────┘
```

---

## ✅ Testing Checklist (Test on ALL 3 environments!)

### Google OAuth
- [ ] Localhost: Sign in with Google → redirects to localhost
- [ ] Dev: Sign in with Google → stays on dev.member.hsnef.org
- [ ] Production: Sign in with Google → stays on member.hsnef.org

### Magic Links
- [ ] Localhost: Request magic link → email has localhost URL
- [ ] Dev: Request magic link → email has dev.member.hsnef.org URL
- [ ] Production: Request magic link → email has member.hsnef.org URL

### QR Codes
- [ ] Localhost: Generate QR → contains `http://localhost:3000/checkin?token=...`
- [ ] Dev: Generate QR → contains `https://dev.member.hsnef.org/checkin?token=...`
- [ ] Production: Generate QR → contains `https://member.hsnef.org/checkin?token=...`

### Stripe Payments
- [ ] Localhost: Test payment (4242...) → succeeds (may need Stripe CLI for webhooks)
- [ ] Dev: Test payment (4242...) → succeeds + webhook received
- [ ] Production: Live payment → succeeds + webhook received

---

## 🔐 Security Isolation

**Important**: Different security secrets ensure environments are isolated:

| What | Why |
|------|-----|
| Different `NEXTAUTH_SECRET` | Sessions from dev can't be used in production |
| Different `JWT_SECRET` | JWT tokens from dev are invalid in production |
| Different `QR_TOKEN_SECRET` | QR codes from dev can't be scanned in production |
| Different `STRIPE_WEBHOOK_SECRET` | Webhooks are tied to specific URLs |

This prevents:
- ❌ Using dev QR codes in production
- ❌ Replaying dev sessions in production
- ❌ Cross-environment security issues

---

## 📧 Email Configuration

**All environments use the same email domain:**
- Emails sent from: `noreply@portal.hsnef.org`
- Reply-to: `member-portal@hsnef.org`
- Domain verified in: Resend

**Why member.hsnef.org?**
- This domain is verified in Resend
- `member.hsnef.org` is your app domain (not email domain)
- Emails from any environment show same sender (consistent for users)

---

## 🐛 Common Issues

### "Redirect URI mismatch" on localhost
- ✅ Check Supabase includes `http://localhost:3000/**`
- ✅ Check Google OAuth includes `http://localhost:3000/auth/callback`
- ✅ Clear browser cache or use incognito

### Magic links redirect to wrong environment
- ✅ Check `NEXT_PUBLIC_APP_URL` is set correctly
- ✅ Redeploy after changing (it's embedded at build time)
- ✅ Restart `npm run dev` after changing `.env.local`

### QR codes have wrong URL
- ✅ Check `NEXT_PUBLIC_APP_URL` matches environment
- ✅ Rebuild/redeploy after changing

### Stripe webhooks not working
- ✅ Localhost: Use Stripe CLI (`stripe listen --forward-to localhost:3000/api/stripe/webhook`)
- ✅ Dev/Prod: Check webhook signing secret matches in Vercel
- ✅ Check Stripe webhook logs for detailed errors

---

## 📚 Full Documentation

- **Complete Setup Guide**: `docs/guides/setup/multi-environment-setup.md`
- **Configuration Checklist**: `docs/guides/setup/configuration-verification-checklist.md`
- **Auth Troubleshooting**: `docs/troubleshooting/auth-troubleshooting.md`

---

**Last Updated**: 2026-01-10
