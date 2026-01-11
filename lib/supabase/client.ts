// ============================================================================
// Supabase Client Configuration (Browser/Client Components)
// ============================================================================
// Uses @supabase/ssr for proper PKCE handling with cookies in Next.js

import { createBrowserClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Browser client for client components (uses cookies for PKCE)
// Note: We create a fresh client each time to ensure proper cookie handling
// The @supabase/ssr library manages its own connection pooling internally
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        // Ensure cookies work across the auth redirect flow
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      },
    }
  )
}

// Service role client for server-side operations (bypasses RLS)
// Note: This should only be used in server-side code (API routes, server components)
// For client components, use createClient() instead
export function createServiceClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
