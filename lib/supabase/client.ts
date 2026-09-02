// ============================================================================
// Supabase Client Configuration (Browser/Client Components)
// ============================================================================
// Uses @supabase/ssr for proper PKCE handling with cookies in Next.js

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Browser client for client components (uses cookies for PKCE)
// Note: We create a fresh client each time to ensure proper cookie handling
// The @supabase/ssr library manages its own connection pooling internally
/**
 * NOTE ON THE RETURN TYPE
 *
 * `@supabase/ssr` 0.5.2 predates `@supabase/supabase-js` 2.89 and its
 * `createBrowserClient` / `createServerClient` signatures no longer propagate
 * the `Database` generic to the modern client. Without the annotation below,
 * every `.from()` resolves to `never` and roughly 400 type errors follow --
 * which is how five live bugs went unnoticed (see DEC-008).
 *
 * At runtime the object IS a SupabaseClient, so this only restores the type
 * that was already intended. The proper fix is to upgrade @supabase/ssr, which
 * touches PKCE cookie handling and so needs testing on its own.
 */
export function createClient(): SupabaseClient<Database> {
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
  ) as unknown as SupabaseClient<Database>
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
