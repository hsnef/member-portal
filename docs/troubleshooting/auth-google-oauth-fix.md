# Google OAuth & Hydration Error Fixes

> **Historical — a record of fixes already applied.**
> These issues were diagnosed and fixed. Kept for the reasoning, not as a to-do.
> It is kept for background and is deliberately NOT updated as the code changes,
> so expect stale filenames, routes, component names, colours and URLs.
> For current state see [`docs/PROJECT-HUB.md`](../PROJECT-HUB.md) and
> [`docs/PRIORITY-ROADMAP.md`](../PRIORITY-ROADMAP.md).

## Issues Fixed

### 1. Hydration Mismatch Error
**Problem:** Dashlane browser extension adds attributes (`data-dashlane-*`) to form fields, causing React hydration warnings.

**Solution:**
- Added `suppressHydrationWarning` to input and button elements
- This prevents React from complaining about browser extension modifications

### 2. Google OAuth Button Not Working
**Problem:** Clicking "Continue with Google" does nothing.

**Fixes Applied:**
1. **Better Event Handling:**
   - Added explicit `preventDefault()` and `stopPropagation()`
   - Added `type="button"` to prevent form submission
   - Improved error handling

2. **Environment Variable Checks:**
   - Added validation for `NEXT_PUBLIC_SUPABASE_URL`
   - Better error messages if configuration is missing

3. **Improved OAuth Options:**
   - Added `queryParams` for better OAuth flow
   - Explicit redirect handling

4. **Error Display:**
   - Added useEffect to show errors from URL params (from callback)

---

## What to Check

### 1. Environment Variables
Verify these are set in `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**How to verify:**
- Open browser console on login page
- Type: `console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)`
- Should show your Supabase URL (not `undefined`)

**If undefined:**
- Restart dev server: `npm run dev`
- Check `.env.local` file exists and has correct values
- Make sure file is in project root

### 2. Supabase Configuration

#### A. Google OAuth Enabled
1. Go to Supabase Dashboard → Authentication → Providers
2. Find "Google" provider
3. Ensure "Enable Sign in with Google" is **ON**
4. Verify Client ID and Client Secret are filled in

#### B. Redirect URLs
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Verify **Site URL** is set:
   - Development: `http://localhost:3000`
3. Verify **Redirect URLs** includes:
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000/**
   ```

#### C. Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to APIs & Services → Credentials
3. Find your OAuth 2.0 Client ID
4. Verify **Authorized redirect URIs** includes:
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```
   (Replace YOUR_PROJECT_REF with your actual Supabase project reference)

---

## Testing Steps

### 1. Test Google OAuth
1. **Open browser console** (F12)
2. **Clear console** (optional)
3. **Click "Continue with Google"**
4. **Check console for logs:**
   - Should see: "Starting Google OAuth..."
   - Should see: "Supabase URL: ..."
   - Should see: "Redirect to: ..."
   - Should see: "OAuth response: ..."
   - Should see: "Redirecting to: ..." (with Google OAuth URL)

5. **Expected behavior:**
   - Should redirect to Google login page
   - After login, redirect back to your app
   - Should be logged in

### 2. If Still Not Working

**Check Console for Errors:**
- Look for any red error messages
- Check Network tab for failed requests
- Look for Supabase-related errors

**Common Issues:**
- **"Configuration error"** → Environment variables not set
- **"OAuth redirect failed"** → Redirect URL not configured in Supabase
- **"Invalid redirect URI"** → Google Cloud Console redirect URI mismatch
- **No redirect happening** → Check if `data.url` exists in console log

---

## Debugging Commands

### Test Supabase Connection
Open browser console and run:
```javascript
// Test Supabase client
const { createClient } = await import('@supabase/supabase-js')
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
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

### Check Environment Variables
```javascript
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing')
```

---

## Files Modified

- `app/login/page.tsx`
  - Added `suppressHydrationWarning` to form elements
  - Improved Google OAuth handler with better error handling
  - Added environment variable validation
  - Added error display from URL params
  - Improved event handling

---

## Next Steps

1. **Restart dev server** after checking environment variables
2. **Test Google OAuth** with console open
3. **Check Supabase logs** if issues persist:
   - Supabase Dashboard → Logs → Auth Logs
4. **Verify Google OAuth** is properly configured in both:
   - Supabase Dashboard
   - Google Cloud Console

---

## ✅ PKCE Code Verifier Fix

**Problem:** "PKCE code verifier not found in storage" error after Google OAuth redirect.

**Root Cause:** Using `@supabase/supabase-js` client stores PKCE in localStorage, which can be lost on redirect. Next.js requires `@supabase/ssr` to store PKCE in cookies.

**Solution Applied:**
- Updated `lib/supabase/client.ts` to use `createBrowserClient` from `@supabase/ssr`
- This stores PKCE code verifier in cookies instead of localStorage
- Cookies persist across redirects and work with SSR

**What Changed:**
```typescript
// Before (wrong for Next.js):
import { createClient } from '@supabase/supabase-js'

// After (correct for Next.js):
import { createBrowserClient } from '@supabase/ssr'
```

**Next Steps:**
1. **Clear browser cookies and localStorage** for localhost:3000
2. **Restart dev server**
3. **Try Google OAuth again**

---

## Still Having Issues?

If the button still doesn't work after these fixes:

1. **Clear all cookies and localStorage:**
   - Open DevTools → Application tab
   - Clear Storage → Clear site data
   - Or use incognito mode

2. **Check browser console** for specific error messages
3. **Check Network tab** for failed requests
4. **Verify Supabase project** is active and accessible
5. **Test in incognito mode** (to rule out browser extensions)
6. **Check Supabase status** at status.supabase.com

The hydration warning is now suppressed and shouldn't interfere with functionality.
