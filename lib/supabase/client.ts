// ============================================================================
// Supabase Client Configuration (Browser/Client Components)
// ============================================================================
// Uses @supabase/ssr for proper PKCE handling with cookies in Next.js

import { createBrowserClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Singleton browser client
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

// Browser client for client components (uses cookies for PKCE)
export function createClient() {
  if (supabaseClient) {
    return supabaseClient
  }

  supabaseClient = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return supabaseClient
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
