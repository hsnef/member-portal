# Authentication Troubleshooting Guide

## Issues Identified

### Issue 1: Google OAuth Button Not Working
**Symptoms:** Clicking "Continue with Google" does nothing, no errors in console

**Potential Causes:**
1. Environment variables not set or incorrect
2. Google OAuth not enabled in Supabase
3. Redirect URL not configured in Supabase
4. Browser blocking redirects
5. Silent error in OAuth flow

### Issue 2: Magic Link Not Logging In
**Symptoms:** Email sent successfully, clicking link redirects to login without authentication

**Potential Causes:**
1. Callback route not handling magic link tokens correctly
2. Session not persisting after callback
3. Middleware interfering with session creation
4. Redirect happening before session is established

---

## Diagnostic Steps

### Step 1: Check Environment Variables

Verify these are set in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**How to check:**
1. Open browser console on login page
2. Type: `console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)`
3. Should show your Supabase URL (not undefined)

**Fix:** If undefined, restart dev server after adding to `.env.local`

---

### Step 2: Verify Supabase Configuration

#### A. Check Google OAuth is Enabled

1. Go to Supabase Dashboard → Authentication → Providers
2. Find "Google" provider
3. Ensure "Enable Sign in with Google" is **ON**
4. Verify Client ID and Client Secret are filled in

#### B. Check Redirect URLs

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Verify **Site URL** is set:
   - Development: `http://localhost:3000`
   - Production: Your production URL
3. Verify **Redirect URLs** includes:
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000/**
   ```

#### C. Check Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to APIs & Services → Credentials
3. Find your OAuth 2.0 Client ID
4. Verify **Authorized redirect URIs** includes:
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```
   (Replace YOUR_PROJECT_REF with your actual Supabase project reference)

---

### Step 3: Test Google OAuth Flow

Add debugging to login page:

```typescript
const handleGoogleSignIn = async () => {
  try {
    setLoading(true)
    setMessage(null)
    
    console.log('Starting Google OAuth...')
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Redirect to:', `${window.location.origin}/auth/callback?redirect=${redirectTo}`)

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${redirectTo}`,
      },
    })

    console.log('OAuth response:', { data, error })

    if (error) {
      console.error('OAuth error:', error)
      setMessage({ type: 'error', text: error.message })
    } else if (data?.url) {
      console.log('Redirecting to:', data.url)
      // The redirect should happen automatically, but if not:
      window.location.href = data.url
    }
  } catch (error) {
    console.error('OAuth exception:', error)
    setMessage({
      type: 'error',
      text: error instanceof Error ? error.message : 'An error occurred',
    })
  } finally {
    setLoading(false)
  }
}
```

**What to look for:**
- If `data.url` exists, the OAuth flow started but redirect didn't happen
- If `error` exists, check the error message
- If nothing is logged, the function might not be called

---

### Step 4: Test Magic Link Flow

Magic links use a different flow than OAuth. The callback needs to handle:
- OAuth: `?code=...` parameter
- Magic Link: `?token=...` or `#access_token=...` parameter

**Check the magic link email:**
- What URL does it contain?
- Does it have `token=` or `code=` parameter?
- What's the full redirect URL?

---

## Fixes

### Fix 1: Update Callback Route for Magic Links

The callback route needs to handle both OAuth codes and magic link tokens.

### Fix 2: Add Better Error Handling

Add console logging and error messages to identify where the flow breaks.

### Fix 3: Verify Session After Callback

Ensure the session is properly established before redirecting.

---

## Quick Tests

### Test 1: Direct Supabase Auth Test

Open browser console and test directly:

```javascript
// Test Supabase connection
const { createClient } = await import('@supabase/supabase-js')
const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_ANON_KEY'
)

// Test OAuth
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'http://localhost:3000/auth/callback'
  }
})
console.log({ data, error })
```

### Test 2: Check Network Tab

1. Open browser DevTools → Network tab
2. Click "Continue with Google"
3. Look for:
   - Request to Supabase auth endpoint
   - Redirect to Google
   - Any failed requests

### Test 3: Check Application Tab

1. Open browser DevTools → Application tab
2. Go to Local Storage
3. Look for Supabase session keys
4. After clicking magic link, check if session is stored

---

## Common Solutions

### Solution 1: Restart Dev Server
After changing `.env.local`, always restart:
```bash
npm run dev
```

### Solution 2: Clear Browser Cache
Clear localStorage and cookies, then try again.

### Solution 3: Check Supabase Logs
1. Go to Supabase Dashboard → Logs → Auth Logs
2. Look for failed authentication attempts
3. Check error messages

### Solution 4: Verify Redirect URL Format
- Must match exactly (including http vs https)
- No trailing slashes
- Must be in Supabase allowed list

---

## Next Steps

1. Run diagnostic steps above
2. Check browser console for errors
3. Check Supabase auth logs
4. Verify all configuration steps
5. Apply fixes below
