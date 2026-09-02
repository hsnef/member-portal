# Supabase Authentication Setup Guide

Complete guide to configure Google OAuth and Magic Link authentication for the HSNEF Membership Portal.

---

## Step 1: Configure Google OAuth

### 1.1 Create Google OAuth Credentials

1. **Go to Google Cloud Console**
   - Visit [console.cloud.google.com](https://console.cloud.google.com)
   - Select your project or create a new one

# Google People API has replaced Google+ API
2. **Enable Google+ API** 
   - Go to **APIs & Services** → **Library**
   - Search for "Google+ API"
   - Click **Enable**

3. **Create OAuth Credentials**
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Name: "HSNEF Membership Portal"

4. **Configure Authorized Redirect URIs**

   Add these URIs:
   ```
   https://gapvsdrzavjaublwkqfm.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback
   ```

   Replace `YOUR_SUPABASE_PROJECT_REF` with your actual Supabase project reference.

   Example:
   ```
   https://abcdefghijklmnop.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback
   ```

5. **Copy Credentials**
   - Copy the **Client ID** (starts with numbers, ends with `.apps.googleusercontent.com`)
   - Copy the **Client Secret**

### 1.2 Configure Google OAuth in Supabase

1. **Go to Supabase Dashboard**
   - Visit [app.supabase.com](https://app.supabase.com)
   - Select your HSNEF project

2. **Enable Google Provider**
   - Go to **Authentication** → **Providers**
   - Find **Google** in the list
   - Toggle **Enable Sign in with Google** to ON

3. **Add Google Credentials**
   - Paste **Client ID** from Google Cloud Console
   - Paste **Client Secret** from Google Cloud Console
   - Click **Save**

---

## Step 2: Configure Magic Link (Email)

### 2.1 Configure Email Settings in Supabase

1. **Go to Supabase Dashboard**
   - Visit [app.supabase.com](https://app.supabase.com)
   - Select your HSNEF project

2. **Enable Email Provider**
   - Go to **Authentication** → **Providers**
   - Find **Email** in the list
   - Toggle **Enable Email provider** to ON
   - Toggle **Confirm email** to ON (recommended for security)
   - Click **Save**

3. **Configure SMTP Settings (Use Resend)**
   - Go to **Project Settings** → **Auth** → **SMTP Settings**
   - Toggle **Enable Custom SMTP** to ON

   **Resend SMTP Configuration:**
   ```
   Host: smtp.resend.com
   Port: 465
   Username: resend
   Password: YOUR_RESEND_API_KEY (starts with re_)
   Sender email: noreply@portal.hsnef.org
   Sender name: HSNEF Membership Portal
   ```

4. **Customize Email Templates** (Optional)
   - Go to **Authentication** → **Email Templates**
   - Customize templates for:
     - Confirm signup
     - Magic Link
     - Change Email Address
     - Reset Password

   **Magic Link Template Example:**
   ```html
   <h2>Sign in to HSNEF Membership Portal</h2>
   <p>Click the link below to sign in:</p>
   <p><a href="{{ .ConfirmationURL }}">Sign In</a></p>
   <p>This link expires in 1 hour.</p>
   ```

---

## Step 3: Configure Redirect URLs

### 3.1 Set Site URL and Redirect URLs

1. **Go to Supabase Dashboard**
   - **Authentication** → **URL Configuration**

2. **Set Site URL**
   - Development: `http://localhost:3000`
   - Production: `https://member.hsnef.org`

3. **Add Redirect URLs**

   Add these URLs to the **Redirect URLs** list:
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000/admin
   https://member.hsnef.org/auth/callback
   https://member.hsnef.org/admin
   ```

4. **Click Save**

---

## Step 4: Test Authentication

### 4.1 Test Google OAuth

1. Start your development server: `npm run dev`
2. Go to `http://localhost:3000/login`
3. Click "Continue with Google"
4. You should be redirected to Google login
5. After successful login, you should be redirected back to your app

### 4.2 Test Magic Link

1. Go to `http://localhost:3000/login`
2. Enter your email address
3. Click "Send Magic Link"
4. Check your email inbox
5. Click the magic link
6. You should be signed in and redirected to your app

---

## Step 5: Configure User Roles (Admin Setup)

After a user signs in for the first time, you need to assign them a role in the database.

### 5.1 Manually Assign Admin Role (First Admin User)

1. **Sign in with Google or Magic Link**
2. **Go to Supabase Dashboard** → **Table Editor** → **members**
3. Find your user (look for your email in `primary_email`)
4. Copy the `id` (UUID)
5. Go to **user_roles** table
6. Click **Insert** → **Insert row**
7. Fill in:
   ```
   user_id: [paste the UUID from step 4]
   role: Admin
   assigned_by: [paste the same UUID]
   ```
8. Click **Save**

Now you have admin access!

---

## Troubleshooting

### Google OAuth Issues

**Error: "Invalid redirect URI"**
- Make sure you added the correct callback URL to Google Cloud Console
- Format: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
- No trailing slash

**Error: "Access blocked: This app's request is invalid"**
- Enable Google+ API in Google Cloud Console
- Wait 5-10 minutes for changes to propagate

**Error: "OAuth consent screen not configured"**
- Go to Google Cloud Console → OAuth consent screen
- Fill in required fields (app name, support email, developer email)
- Save and try again

### Magic Link Issues

**Email not arriving**
- Check spam/junk folder
- Verify SMTP settings in Supabase
- Verify Resend API key is correct
- Check Resend dashboard for delivery status

**Error: "Invalid magic link"**
- Links expire after 1 hour
- Request a new magic link
- Make sure you're using the latest link sent

**Error: "Email rate limit exceeded"**
- Supabase limits: 4 emails per hour per email address
- Wait an hour or use a different email for testing

### Redirect Issues

**Redirected to wrong URL after login**
- Check Site URL in Supabase dashboard
- Check Redirect URLs list includes your callback URL
- Verify `NEXT_PUBLIC_APP_URL` in `.env.local`

---

## Security Best Practices

1. **Use HTTPS in Production**
   - Never use HTTP for authentication in production
   - All redirect URLs should use HTTPS

2. **Protect OAuth Credentials**
   - Never commit Client ID/Secret to git
   - Use environment variables
   - Rotate secrets every 6 months

3. **Email Verification**
   - Keep "Confirm email" enabled in production
   - Prevents email enumeration attacks
   - Ensures email ownership

4. **Rate Limiting**
   - Supabase has built-in rate limiting
   - Monitor authentication logs for suspicious activity
   - Consider adding CAPTCHA for signup

5. **Session Management**
   - Configure session timeout in Supabase settings
   - Default: 7 days
   - Consider shorter timeout for admin users

---

## Environment Variables Summary

Add these to your `.env.local`:

```bash
# Already configured
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
# Production: https://member.hsnef.org

# Resend for emails (already configured)
RESEND_API_KEY=re_your-resend-api-key
EMAIL_FROM=noreply@portal.hsnef.org
EMAIL_FROM_NAME=HSNEF Membership Portal
EMAIL_REPLY_TO=info@hsnef.org
```

---

## Next Steps

After authentication is working:

1. Create member records for authenticated users
2. Build admin panel with role-based access
3. Implement member management features
4. Set up automated role assignment workflow

---

## Support & Resources

- **Supabase Auth Docs:** [supabase.com/docs/guides/auth](https://supabase.com/docs/guides/auth)
- **Google OAuth Setup:** [developers.google.com/identity/protocols/oauth2](https://developers.google.com/identity/protocols/oauth2)
- **Resend SMTP:** [resend.com/docs/send-with-smtp](https://resend.com/docs/send-with-smtp)

Your authentication is ready to go! 🎉
