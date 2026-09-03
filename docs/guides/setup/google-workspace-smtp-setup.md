# Google Workspace SMTP Setup Guide

> **Not used — an alternative that was never adopted.**
> Email goes through **Resend** (`lib/email/mailer.ts`), not SMTP. No `SMTP_*` variable is read anywhere in the codebase. Keep this only as a record of the option that was considered.
> It is kept for background and is deliberately NOT updated as the code changes,
> so expect stale filenames, routes, component names, colours and URLs.
> For current state see [`docs/PROJECT-HUB.md`](../../PROJECT-HUB.md) and
> [`docs/PRIORITY-ROADMAP.md`](../../PRIORITY-ROADMAP.md).

This guide explains how to configure Google Workspace SMTP Relay for the HSNEF Membership Portal.

## Overview

Google Workspace SMTP Relay is FREE with your Google Workspace subscription and allows you to send up to **10,000 emails per day**.

## Prerequisites

- Google Workspace account (admin access)
- Domain: `hsnef.org` verified in Google Workspace

---

## Setup Steps

### 1. Enable SMTP Relay in Google Workspace

1. **Sign in to Google Admin Console**
   - Go to [admin.google.com](https://admin.google.com)
   - Sign in with your admin account

2. **Navigate to SMTP Relay**
   - Click **Apps** → **Google Workspace** → **Gmail**
   - Scroll down and click **Routing**
   - Click **SMTP relay service**

3. **Configure SMTP Relay Settings**
   - Click **ADD ANOTHER** or **CONFIGURE**
   - Configure the following:

   **Allowed senders:**
   - Select **Only addresses in my domains** (recommended)
   - OR select **Only registered App users** if you want more control

   **Authentication:**
   - Choose one method:

   **Option A: SMTP Authentication (Recommended)**
   - Select **Only accept mail from the specified IP addresses**
   - Uncheck this option
   - Select **Require SMTP Authentication**
   - This requires username/password (App Password)

   **Option B: IP Allow-listing (Simpler but less secure)**
   - Select **Only accept mail from the specified IP addresses**
   - Check this option
   - Add your Vercel deployment IPs (see section below)
   - No username/password needed

   **Encryption:**
   - Select **Require TLS encryption** (recommended)

4. **Save Settings**
   - Click **SAVE**

---

### 2. Create App Password (If Using SMTP Authentication)

If you chose SMTP Authentication in Step 1:

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Sign in with the email account you'll use for sending (e.g., `noreply@hsnef.org`)
3. Click **Security** → **2-Step Verification** (enable if not already enabled)
4. Scroll down to **App passwords**
5. Click **App passwords**
6. Select **Mail** and **Other (Custom name)**
7. Enter "HSNEF Membership Portal"
8. Click **Generate**
9. Copy the 16-character password
10. Save this password securely

---

### 3. Configure Environment Variables

Add these to your `.env.local` file:

#### Option A: SMTP Authentication (Recommended)

```bash
# SMTP Configuration
SMTP_HOST=smtp-relay.gmail.com
SMTP_PORT=587
SMTP_SECURE=false

# SMTP Authentication
SMTP_USER=noreply@hsnef.org
SMTP_PASSWORD=your-16-char-app-password

# From Address
EMAIL_FROM=noreply@portal.hsnef.org
EMAIL_FROM_NAME=HSNEF Membership Portal
EMAIL_REPLY_TO=info@hsnef.org
```

#### Option B: IP Allow-listing (No credentials)

```bash
# SMTP Configuration
SMTP_HOST=smtp-relay.gmail.com
SMTP_PORT=587
SMTP_SECURE=false

# No SMTP_USER or SMTP_PASSWORD needed

# From Address
EMAIL_FROM=noreply@portal.hsnef.org
EMAIL_FROM_NAME=HSNEF Membership Portal
EMAIL_REPLY_TO=info@hsnef.org
```

---

### 4. Get Vercel IPs (For IP Allow-listing)

If using IP allow-listing, you need to add Vercel's IPs to Google Workspace:

1. **For Vercel Pro/Enterprise:**
   - Vercel provides static IPs
   - Contact Vercel support for your dedicated IPs

2. **For Vercel Hobby (Free tier):**
   - IPs change dynamically
   - **Must use SMTP Authentication instead**
   - IP allow-listing won't work reliably

**Recommendation:** Use **SMTP Authentication** (Option A) to avoid IP issues.

---

### 5. Test Your Configuration

#### Development Testing

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Test the email:
   ```bash
   curl "http://localhost:3000/api/email/test?to=your-email@example.com"
   ```

   OR visit in browser:
   ```
   http://localhost:3000/api/email/test?to=your-email@example.com
   ```

3. Check your inbox for the test email

#### Production Testing

The test endpoint is disabled in production for security. Instead:

1. Use the admin panel to send a test registration invitation
2. Or trigger a payment receipt email
3. Verify emails are being delivered

---

## Troubleshooting

### Error: "Invalid login" or "Username and Password not accepted"

**Solution:**
- Make sure you created an **App Password**, not using your regular password
- App Password must be 16 characters (no spaces)
- Enable 2-Step Verification first
- Make sure the account has Google Workspace access

### Error: "Connection timeout"

**Solution:**
- Check SMTP_HOST is `smtp-relay.gmail.com`
- Check SMTP_PORT is `587`
- Check SMTP_SECURE is `false` (for port 587)
- Check firewall/network allows outbound port 587

### Error: "Relay access denied"

**Solution:**
- Verify SMTP Relay is enabled in Google Admin Console
- Check "Allowed senders" settings
- If using IP allow-listing, verify your IP is added
- Wait 5-10 minutes after changing settings

### Emails go to spam

**Solution:**
- Add SPF record to DNS:
  ```
  v=spf1 include:_spf.google.com ~all
  ```
- Add DKIM in Google Workspace:
  - Admin Console → Apps → Google Workspace → Gmail → Authenticate email
  - Generate DKIM key and add to DNS
- Add DMARC record:
  ```
  v=DMARC1; p=quarantine; rua=mailto:dmarc@hsnef.org
  ```

---

## Email Sending Limits

| Tier | Daily Limit |
|------|-------------|
| Google Workspace | 10,000 emails/day |
| Per user | 2,000 emails/day |

**For HSNEF Portal:** 10,000 emails/day is more than enough for:
- Registration invitations
- Payment receipts
- Renewal reminders
- Event notifications

---

## DNS Records (Optional but Recommended)

Add these DNS records for better email deliverability:

### SPF Record
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.google.com ~all
```

### DKIM Record
1. Generate in Google Admin Console
2. Add the provided TXT record to DNS

### DMARC Record
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@hsnef.org
```

---

## Security Best Practices

1. **Use App Passwords**
   - Never use your main Google account password
   - Create separate App Passwords for each application

2. **Rotate Passwords**
   - Change App Passwords every 6-12 months
   - Revoke old passwords when no longer needed

3. **Monitor Usage**
   - Check Google Admin Console for email sending reports
   - Set up alerts for suspicious activity

4. **Use TLS**
   - Always use `SMTP_SECURE=false` with port 587 (STARTTLS)
   - This encrypts the connection

---

## Support

- **Google Workspace SMTP Relay:** [support.google.com/a/answer/176600](https://support.google.com/a/answer/176600)
- **App Passwords:** [support.google.com/accounts/answer/185833](https://support.google.com/accounts/answer/185833)
- **Email Authentication:** [support.google.com/a/topic/2759254](https://support.google.com/a/topic/2759254)

---

## Summary

✅ **Cost:** FREE with Google Workspace
✅ **Limit:** 10,000 emails/day
✅ **Setup Time:** 10-15 minutes
✅ **Reliability:** Google infrastructure
✅ **Deliverability:** Excellent with proper DNS setup

Your HSNEF Membership Portal is now configured to send emails via Google Workspace SMTP Relay!
